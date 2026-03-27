"""역할:

Spring에서 받는 JSON 형식 검증
Python 내부 응답 형식 정리

FastAPI를 쓴다면 요청/응답 모델을 여기 두면 깔끔합니다."""

from pydantic import BaseModel, ConfigDict, Field


class ChatResponse(BaseModel):
    """Minimal response model for Spring integration."""

    model_config = ConfigDict(populate_by_name=True)

    success: bool = Field(description="Whether the AI request succeeded.")
    answer: str | None = Field(default=None, description="Generated answer when success is true.")
    rulebook_found: bool = Field(alias="rulebookFound", description="Whether a rulebook document was found.")
    rulebook_file_name: str | None = Field(
        default=None,
        alias="rulebookFileName",
        description="Rulebook file name used for the answer.",
    )
    worldview_found: bool = Field(alias="worldviewFound", description="Whether a worldview document was found.")
    worldview_file_name: str | None = Field(
        default=None,
        alias="worldviewFileName",
        description="Worldview file name used for the answer.",
    )
    error_message: str | None = Field(
        default=None,
        alias="errorMessage",
        description="Error message when success is false.",
    )
    details: list[dict] | None = Field(
        default=None,
        description="Optional validation details for debugging invalid requests.",
    )

    @classmethod
    def failure(
        cls,
        error_message: str,
        rulebook_found: bool = False,
        rulebook_file_name: str | None = None,
        worldview_found: bool = False,
        worldview_file_name: str | None = None,
        details: list[dict] | None = None,
    ) -> "ChatResponse":
        return cls(
            success=False,
            answer=None,
            rulebookFound=rulebook_found,
            rulebookFileName=rulebook_file_name,
            worldviewFound=worldview_found,
            worldviewFileName=worldview_file_name,
            errorMessage=error_message,
            details=details,
        )
