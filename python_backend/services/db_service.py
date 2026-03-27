import os

_TABLE_COLUMNS_CACHE: dict[str, set[str]] = {}

try:
    import oracledb
except ImportError:
    oracledb = None

from config import (
    ORACLE_CONFIG_DIR_ENV_NAME,
    ORACLE_DSN_ENV_NAME,
    ORACLE_PASSWORD_ENV_NAME,
    ORACLE_TNS_ADMIN_ENV_NAME,
    ORACLE_USER_ENV_NAME,
    ORACLE_WALLET_PASSWORD_ENV_NAME,
)


def _read_lob_if_needed(value):
    """Convert LOB values to strings when necessary."""
    if hasattr(value, "read"):
        return value.read()
    return value


def _row_to_dict(cursor, row) -> dict:
    columns = [column[0].lower() for column in cursor.description]
    values = [_read_lob_if_needed(value) for value in row]
    return dict(zip(columns, values))


def _get_table_columns(connection, table_name: str) -> set[str]:
    """Return the uppercase column names for the given table."""
    normalized_table_name = table_name.upper()

    if normalized_table_name in _TABLE_COLUMNS_CACHE:
        return _TABLE_COLUMNS_CACHE[normalized_table_name]

    cursor = connection.cursor()
    cursor.execute(
        """
        SELECT COLUMN_NAME
        FROM USER_TAB_COLUMNS
        WHERE TABLE_NAME = :table_name
        """,
        {"table_name": normalized_table_name},
    )
    columns = {row[0] for row in cursor.fetchall()}
    _TABLE_COLUMNS_CACHE[normalized_table_name] = columns
    return columns


def _get_oracle_config_dir() -> str | None:
    """Return the Oracle Net configuration directory if configured."""
    config_dir = os.getenv(ORACLE_TNS_ADMIN_ENV_NAME) or os.getenv(ORACLE_CONFIG_DIR_ENV_NAME)

    if not config_dir:
        return None

    return config_dir.strip() or None


def get_db_connection():
    """Create an Oracle DB connection."""
    if oracledb is None:
        raise RuntimeError("python-oracledb is not installed. Run `py -m pip install oracledb` first.")

    user = os.getenv(ORACLE_USER_ENV_NAME)
    password = os.getenv(ORACLE_PASSWORD_ENV_NAME)
    dsn = os.getenv(ORACLE_DSN_ENV_NAME)
    config_dir = _get_oracle_config_dir()
    wallet_password = os.getenv(ORACLE_WALLET_PASSWORD_ENV_NAME)

    if not user or not password or not dsn:
        raise ValueError("Set ORACLE_USER, ORACLE_PASSWORD, and ORACLE_DSN in the .env file.")

    connect_kwargs = {
        "user": user,
        "password": password,
        "dsn": dsn,
    }

    if config_dir:
        connect_kwargs["config_dir"] = config_dir
        connect_kwargs["wallet_location"] = config_dir

    if wallet_password:
        connect_kwargs["wallet_password"] = wallet_password

    try:
        return oracledb.connect(**connect_kwargs)
    except oracledb.DatabaseError as error:
        raise RuntimeError(f"Oracle DB 연결 중 오류가 발생했습니다: {error}") from error


def get_document_by_game_and_path(connection, game_id: int, document_type: str, file_path: str) -> dict | None:
    """Look up a document by game, type, and file path."""
    sql = """
        SELECT
            DOCUMENT_ID,
            GAME_ID,
            DOCUMENT_TYPE,
            DOCUMENT_TITLE,
            FILE_NAME,
            FILE_PATH,
            DESCRIPTION,
            ACTIVE_YN,
            CREATED_AT,
            UPDATED_AT
        FROM AI_GAME_DOCUMENT
        WHERE GAME_ID = :game_id
          AND DOCUMENT_TYPE = :document_type
          AND FILE_PATH = :file_path
    """

    cursor = connection.cursor()
    cursor.execute(
        sql,
        {
            "game_id": game_id,
            "document_type": document_type,
            "file_path": file_path,
        },
    )
    row = cursor.fetchone()
    return _row_to_dict(cursor, row) if row else None


def insert_document_metadata(
    connection,
    game_id: int,
    document_type: str,
    document_title: str,
    file_name: str,
    file_path: str,
    description: str | None = None,
) -> None:
    """Insert document metadata."""
    sql = """
        INSERT INTO AI_GAME_DOCUMENT (
            GAME_ID,
            DOCUMENT_TYPE,
            DOCUMENT_TITLE,
            FILE_NAME,
            FILE_PATH,
            DESCRIPTION,
            ACTIVE_YN,
            CREATED_AT,
            UPDATED_AT
        )
        VALUES (
            :game_id,
            :document_type,
            :document_title,
            :file_name,
            :file_path,
            :description,
            'Y',
            SYSTIMESTAMP,
            SYSTIMESTAMP
        )
    """

    cursor = connection.cursor()
    cursor.execute(
        sql,
        {
            "game_id": game_id,
            "document_type": document_type,
            "document_title": document_title,
            "file_name": file_name,
            "file_path": file_path,
            "description": description,
        },
    )
    connection.commit()


def update_document_metadata(
    connection,
    document_id: int,
    document_title: str,
    file_name: str,
    description: str | None = None,
) -> None:
    """Update document metadata."""
    sql = """
        UPDATE AI_GAME_DOCUMENT
        SET DOCUMENT_TITLE = :document_title,
            FILE_NAME = :file_name,
            DESCRIPTION = :description,
            ACTIVE_YN = 'Y',
            UPDATED_AT = SYSTIMESTAMP
        WHERE DOCUMENT_ID = :document_id
    """

    cursor = connection.cursor()
    cursor.execute(
        sql,
        {
            "document_id": document_id,
            "document_title": document_title,
            "file_name": file_name,
            "description": description,
        },
    )
    connection.commit()


def ensure_document_metadata(
    connection,
    game_id: int,
    document_type: str,
    document_title: str,
    file_name: str,
    file_path: str,
    description: str | None = None,
) -> dict:
    """Reuse or create document metadata."""
    document = get_document_by_game_and_path(connection, game_id, document_type, file_path)

    if document:
        update_document_metadata(
            connection=connection,
            document_id=document["document_id"],
            document_title=document_title,
            file_name=file_name,
            description=description,
        )
        return get_document_by_game_and_path(connection, game_id, document_type, file_path)

    insert_document_metadata(
        connection=connection,
        game_id=game_id,
        document_type=document_type,
        document_title=document_title,
        file_name=file_name,
        file_path=file_path,
        description=description,
    )
    return get_document_by_game_and_path(connection, game_id, document_type, file_path)


def get_response_cache_by_hash(connection, request_hash: str) -> dict | None:
    """Look up a cached response by hash."""
    sql = """
        SELECT
            CACHE_ID,
            GAME_ID,
            DOCUMENT_ID,
            REQUEST_TYPE,
            QUESTION_TEXT,
            MODEL_NAME,
            REQUEST_HASH,
            RESPONSE_TEXT,
            CREATED_AT
        FROM AI_RESPONSE_CACHE
        WHERE REQUEST_HASH = :request_hash
    """

    cursor = connection.cursor()
    cursor.execute(sql, {"request_hash": request_hash})
    row = cursor.fetchone()
    return _row_to_dict(cursor, row) if row else None


def insert_response_cache(
    connection,
    game_id: int,
    document_id: int,
    request_type: str,
    question_text: str | None,
    model_name: str,
    request_hash: str,
    response_text: str,
) -> None:
    """Insert a cached AI response."""
    sql = """
        INSERT INTO AI_RESPONSE_CACHE (
            GAME_ID,
            DOCUMENT_ID,
            REQUEST_TYPE,
            QUESTION_TEXT,
            MODEL_NAME,
            REQUEST_HASH,
            RESPONSE_TEXT,
            CREATED_AT
        )
        VALUES (
            :game_id,
            :document_id,
            :request_type,
            :question_text,
            :model_name,
            :request_hash,
            :response_text,
            SYSTIMESTAMP
        )
    """

    cursor = connection.cursor()
    cursor.execute(
        sql,
        {
            "game_id": game_id,
            "document_id": document_id,
            "request_type": request_type,
            "question_text": question_text,
            "model_name": model_name,
            "request_hash": request_hash,
            "response_text": response_text,
        },
    )
    connection.commit()


def insert_request_log(
    connection,
    game_id: int,
    document_id: int | None,
    request_type: str,
    question_text: str | None,
    model_name: str,
    request_hash: str,
    cache_hit_yn: str,
    response_status: str,
    response_time_ms: int | None,
    error_message: str | None = None,
) -> None:
    """Insert a request log entry."""
    table_columns = _get_table_columns(connection, "AI_REQUEST_LOG")

    insert_columns = [
        "GAME_ID",
        "DOCUMENT_ID",
        "REQUEST_TYPE",
        "QUESTION_TEXT",
        "MODEL_NAME",
        "CACHE_HIT_YN",
        "RESPONSE_STATUS",
        "ERROR_MESSAGE",
        "RESPONSE_TIME_MS",
        "CREATED_AT",
    ]
    bind_values = [
        ":game_id",
        ":document_id",
        ":request_type",
        ":question_text",
        ":model_name",
        ":cache_hit_yn",
        ":response_status",
        ":error_message",
        ":response_time_ms",
        "SYSTIMESTAMP",
    ]

    if "REQUEST_HASH" in table_columns:
        insert_columns.insert(5, "REQUEST_HASH")
        bind_values.insert(5, ":request_hash")

    sql = f"""
        INSERT INTO AI_REQUEST_LOG (
            {", ".join(insert_columns)}
        )
        VALUES (
            {", ".join(bind_values)}
        )
    """
    bind_params = {
        "game_id": game_id,
        "document_id": document_id,
        "request_type": request_type,
        "question_text": question_text,
        "model_name": model_name,
        "cache_hit_yn": cache_hit_yn,
        "response_status": response_status,
        "error_message": error_message,
        "response_time_ms": response_time_ms,
    }

    if "REQUEST_HASH" in table_columns:
        bind_params["request_hash"] = request_hash

    cursor = connection.cursor()
    cursor.execute(sql, bind_params)
    connection.commit()
