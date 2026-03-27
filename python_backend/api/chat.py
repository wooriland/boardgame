"""
역할:

Spring이 호출할 AI 엔드포인트 정의

방향:

/ai/chat
필요하면 /health
필요하면 /ai/test

지금 main.py에 모든 라우팅을 몰아넣기보다,
AI 관련 요청은 별도로 빼는 것이 좋다
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from models.chat_request import ChatRequest
from models.chat_response import ChatResponse
from services.ai_chat_service import AiChatServiceError, generate_chat_response


router = APIRouter(tags=["ai"])


@router.get("/health")
async def health() -> dict[str, str]:
    """Simple health check for Spring to verify the AI server is alive."""
    return {"status": "ok"}


@router.post("/ai/chat", response_model=ChatResponse)
async def ai_chat(request: ChatRequest) -> ChatResponse | JSONResponse:
    """Receive a Spring request and return an AI answer."""
    try:
        return generate_chat_response(request)
    except AiChatServiceError as error:
        response = ChatResponse.failure(
            error_message=error.message,
            rulebook_found=error.rulebook_found,
            rulebook_file_name=error.rulebook_file_name,
            worldview_found=error.worldview_found,
            worldview_file_name=error.worldview_file_name,
        )
        return JSONResponse(status_code=error.status_code, content=response.model_dump(by_alias=True))
