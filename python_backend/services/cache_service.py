import hashlib

from services.db_service import get_response_cache_by_hash, insert_response_cache


def normalize_question_text(question_text: str | None) -> str:
    """Normalize optional question text for cache keys."""
    return (question_text or "").strip()


def build_request_hash(
    game_id: int,
    document_id: int,
    request_type: str,
    question_text: str | None,
    model_name: str,
    context_key: str | None = None,
) -> str:
    """Build a deterministic cache key for an AI request."""
    normalized_question = normalize_question_text(question_text)
    normalized_context_key = (context_key or "").strip()
    raw_value = f"{game_id}|{document_id}|{request_type}|{normalized_question}|{model_name}|{normalized_context_key}"
    return hashlib.sha256(raw_value.encode("utf-8")).hexdigest()


def find_cached_response(
    connection,
    game_id: int,
    document_id: int,
    request_type: str,
    question_text: str | None,
    model_name: str,
    context_key: str | None = None,
) -> tuple[str, dict | None]:
    """Return the cache hash and any existing cached response."""
    request_hash = build_request_hash(
        game_id=game_id,
        document_id=document_id,
        request_type=request_type,
        question_text=question_text,
        model_name=model_name,
        context_key=context_key,
    )
    cache_row = get_response_cache_by_hash(connection, request_hash)
    return request_hash, cache_row


def save_cached_response(
    connection,
    game_id: int,
    document_id: int,
    request_type: str,
    question_text: str | None,
    model_name: str,
    request_hash: str,
    response_text: str,
) -> None:
    """Persist an AI response to the cache table."""
    insert_response_cache(
        connection=connection,
        game_id=game_id,
        document_id=document_id,
        request_type=request_type,
        question_text=normalize_question_text(question_text) or None,
        model_name=model_name,
        request_hash=request_hash,
        response_text=response_text,
    )
