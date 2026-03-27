"""역할:

Spring에서 받는 JSON 형식 검증
Python 내부 응답 형식 정리

FastAPI를 쓴다면 요청/응답 모델을 여기 두면 깔끔합니다."""

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    """Minimal request model for the Spring -> Python AI call."""

    model_config = ConfigDict(populate_by_name=True)

    game_id: int = Field(alias="gameId", description="GAME_ID used to find rulebook/worldview files.")
    question: str = Field(description="User question that Spring forwards to the AI server.")
