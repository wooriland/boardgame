"""ai_chat_service

전체 흐름 조정

gameId 받고
문서 읽고
프롬프트 만들고
OpenAI 호출하고
응답 조립"""

from dataclasses import dataclass

from models.chat_request import ChatRequest
from models.chat_response import ChatResponse
from services.document_loader_service import load_chat_documents
from services.openai_service import generate_chat_answer
from services.prompt_builder_service import build_chat_prompt
from utils.file_path_util import get_file_name
from utils.text_cleaner import has_text, normalize_text


@dataclass
class AiChatServiceError(Exception):
    """Service-level error with metadata for the API response."""

    message: str
    status_code: int
    rulebook_found: bool = False
    rulebook_file_name: str | None = None
    worldview_found: bool = False
    worldview_file_name: str | None = None


def _validate_request(request: ChatRequest) -> tuple[int, str]:
    game_id = request.game_id
    question_text = normalize_text(request.question)

    if game_id <= 0:
        raise AiChatServiceError(message="gameId must be greater than 0.", status_code=422)

    if not has_text(question_text):
        raise AiChatServiceError(message="question must not be empty.", status_code=422)

    return game_id, question_text


def generate_chat_response(request: ChatRequest) -> ChatResponse:
    """Run the minimal AI chat flow for Spring integration."""
    game_id, question_text = _validate_request(request)

    try:
        documents = load_chat_documents(game_id)
    except FileNotFoundError as error:
        raise AiChatServiceError(
            message=f"Rulebook file not found for gameId={game_id}.",
            status_code=404,
        ) from error
    except ValueError as error:
        raise AiChatServiceError(message=str(error), status_code=422) from error

    worldview_document = documents.worldview
    rulebook_file_name = get_file_name(documents.rulebook.file_path)
    worldview_file_name = get_file_name(worldview_document.file_path) if worldview_document else None

    prompt = build_chat_prompt(
        question_text=question_text,
        rulebook_document=documents.rulebook,
        worldview_document=worldview_document,
    )

    try:
        answer = generate_chat_answer(prompt)
    except RuntimeError as error:
        raise AiChatServiceError(
            message=str(error),
            status_code=502,
            rulebook_found=True,
            rulebook_file_name=rulebook_file_name,
            worldview_found=worldview_document is not None,
            worldview_file_name=worldview_file_name,
        ) from error

    return ChatResponse(
        success=True,
        answer=answer,
        rulebookFound=True,
        rulebookFileName=rulebook_file_name,
        worldviewFound=worldview_document is not None,
        worldviewFileName=worldview_file_name,
        errorMessage=None,
        details=None,
    )
