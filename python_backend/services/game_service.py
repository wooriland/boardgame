import time
from pathlib import Path

from config import (
    DOCUMENT_TYPE_WORLDVIEW,
    MODEL_NAME,
    REQUEST_TYPE_RULEBOOK_QA,
    REQUEST_TYPE_WORLDVIEW_EXPLAIN,
)
from services.cache_service import find_cached_response, save_cached_response
from services.db_service import ensure_document_metadata, insert_request_log
from services.file_service import (
    extract_game_id_from_file_name,
    get_document_title,
    get_game_name_from_file,
    get_relative_file_path,
    get_text_file_for_game_id,
    read_text_file,
)
from services.openai_service import answer_rulebook_question, generate_worldview_explanation


def _build_document_description(document_type: str) -> str:
    if document_type == "WORLDVIEW":
        return "CLI auto-registered worldview document"
    return "CLI auto-registered rulebook document"


def _prepare_document_metadata(connection, game_id: int, document_type: str, file_path: Path) -> dict:
    file_game_id = extract_game_id_from_file_name(file_path)

    if file_game_id != game_id:
        raise ValueError(f"파일의 GAME_ID({file_game_id})와 입력한 GAME_ID({game_id})가 일치하지 않습니다.")

    document_title = get_document_title(file_path)
    relative_file_path = get_relative_file_path(file_path)

    return ensure_document_metadata(
        connection=connection,
        game_id=game_id,
        document_type=document_type,
        document_title=document_title,
        file_name=file_path.name,
        file_path=relative_file_path,
        description=_build_document_description(document_type),
    )


def _get_rulebook_context_key(rulebook_document_id: int, worldview_document_id: int) -> str:
    """Use both document ids in the cache key for rulebook Q&A."""
    return f"rulebook:{rulebook_document_id}|worldview:{worldview_document_id}"


def run_worldview_explanation(connection, game_id: int, file_path: Path) -> dict:
    """Generate a worldview explanation."""
    document_type = "WORLDVIEW"
    request_type = REQUEST_TYPE_WORLDVIEW_EXPLAIN
    question_text = None

    document = _prepare_document_metadata(connection, game_id, document_type, file_path)
    request_hash, cache_row = find_cached_response(
        connection=connection,
        game_id=game_id,
        document_id=document["document_id"],
        request_type=request_type,
        question_text=question_text,
        model_name=MODEL_NAME,
    )

    if cache_row:
        insert_request_log(
            connection=connection,
            game_id=game_id,
            document_id=document["document_id"],
            request_type=request_type,
            question_text=question_text,
            model_name=MODEL_NAME,
            request_hash=request_hash,
            cache_hit_yn="Y",
            response_status="SUCCESS",
            response_time_ms=0,
            error_message=None,
        )
        return {
            "document": document,
            "response_text": cache_row["response_text"],
            "used_cache": True,
            "request_hash": request_hash,
        }

    start_time = time.perf_counter()

    try:
        document_content = read_text_file(file_path)
        game_name = get_game_name_from_file(file_path)
        response_text = generate_worldview_explanation(
            game_name=game_name,
            document_title=document["document_title"],
            document_content=document_content,
        )
        response_time_ms = int((time.perf_counter() - start_time) * 1000)

        save_cached_response(
            connection=connection,
            game_id=game_id,
            document_id=document["document_id"],
            request_type=request_type,
            question_text=question_text,
            model_name=MODEL_NAME,
            request_hash=request_hash,
            response_text=response_text,
        )
        insert_request_log(
            connection=connection,
            game_id=game_id,
            document_id=document["document_id"],
            request_type=request_type,
            question_text=question_text,
            model_name=MODEL_NAME,
            request_hash=request_hash,
            cache_hit_yn="N",
            response_status="SUCCESS",
            response_time_ms=response_time_ms,
            error_message=None,
        )

        return {
            "document": document,
            "response_text": response_text,
            "used_cache": False,
            "request_hash": request_hash,
        }

    except Exception as error:
        response_time_ms = int((time.perf_counter() - start_time) * 1000)
        insert_request_log(
            connection=connection,
            game_id=game_id,
            document_id=document["document_id"],
            request_type=request_type,
            question_text=question_text,
            model_name=MODEL_NAME,
            request_hash=request_hash,
            cache_hit_yn="N",
            response_status="FAIL",
            response_time_ms=response_time_ms,
            error_message=str(error),
        )
        raise


def run_rulebook_question_answer(connection, game_id: int, file_path: Path, question_text: str) -> dict:
    """Answer a rulebook question using both the rulebook and worldview documents."""
    document_type = "RULEBOOK"
    request_type = REQUEST_TYPE_RULEBOOK_QA

    rulebook_document = _prepare_document_metadata(connection, game_id, document_type, file_path)
    worldview_file_path = get_text_file_for_game_id(DOCUMENT_TYPE_WORLDVIEW, game_id)
    worldview_document = _prepare_document_metadata(connection, game_id, DOCUMENT_TYPE_WORLDVIEW, worldview_file_path)
    context_key = _get_rulebook_context_key(rulebook_document["document_id"], worldview_document["document_id"])

    request_hash, cache_row = find_cached_response(
        connection=connection,
        game_id=game_id,
        document_id=rulebook_document["document_id"],
        request_type=request_type,
        question_text=question_text,
        model_name=MODEL_NAME,
        context_key=context_key,
    )

    if cache_row:
        insert_request_log(
            connection=connection,
            game_id=game_id,
            document_id=rulebook_document["document_id"],
            request_type=request_type,
            question_text=question_text,
            model_name=MODEL_NAME,
            request_hash=request_hash,
            cache_hit_yn="Y",
            response_status="SUCCESS",
            response_time_ms=0,
            error_message=None,
        )
        return {
            "document": rulebook_document,
            "worldview_document": worldview_document,
            "response_text": cache_row["response_text"],
            "used_cache": True,
            "request_hash": request_hash,
        }

    start_time = time.perf_counter()

    try:
        rulebook_content = read_text_file(file_path)
        worldview_content = read_text_file(worldview_file_path)
        game_name = get_game_name_from_file(file_path)
        response_text = answer_rulebook_question(
            game_name=game_name,
            rulebook_title=rulebook_document["document_title"],
            rulebook_content=rulebook_content,
            worldview_title=worldview_document["document_title"],
            worldview_content=worldview_content,
            question_text=question_text,
        )
        response_time_ms = int((time.perf_counter() - start_time) * 1000)

        save_cached_response(
            connection=connection,
            game_id=game_id,
            document_id=rulebook_document["document_id"],
            request_type=request_type,
            question_text=question_text,
            model_name=MODEL_NAME,
            request_hash=request_hash,
            response_text=response_text,
        )
        insert_request_log(
            connection=connection,
            game_id=game_id,
            document_id=rulebook_document["document_id"],
            request_type=request_type,
            question_text=question_text,
            model_name=MODEL_NAME,
            request_hash=request_hash,
            cache_hit_yn="N",
            response_status="SUCCESS",
            response_time_ms=response_time_ms,
            error_message=None,
        )

        return {
            "document": rulebook_document,
            "worldview_document": worldview_document,
            "response_text": response_text,
            "used_cache": False,
            "request_hash": request_hash,
        }

    except Exception as error:
        response_time_ms = int((time.perf_counter() - start_time) * 1000)
        insert_request_log(
            connection=connection,
            game_id=game_id,
            document_id=rulebook_document["document_id"],
            request_type=request_type,
            question_text=question_text,
            model_name=MODEL_NAME,
            request_hash=request_hash,
            cache_hit_yn="N",
            response_status="FAIL",
            response_time_ms=response_time_ms,
            error_message=str(error),
        )
        raise
