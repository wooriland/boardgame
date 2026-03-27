"""프롬프트 조합
룰북 내용
세계관 내용
사용자 질문
최종 프롬프트 생성"""

from prompts.prompt_templates import build_rulebook_only_qa_prompt, build_rulebook_qa_prompt
from services.document_loader_service import LoadedDocument


def build_chat_prompt(
    question_text: str,
    rulebook_document: LoadedDocument,
    worldview_document: LoadedDocument | None,
) -> str:
    """Build the prompt for the AI chat answer."""
    game_name = rulebook_document.title

    if worldview_document is None:
        return build_rulebook_only_qa_prompt(
            game_name=game_name,
            rulebook_title=rulebook_document.title,
            rulebook_content=rulebook_document.content,
            question_text=question_text,
        )

    return build_rulebook_qa_prompt(
        game_name=game_name,
        rulebook_title=rulebook_document.title,
        rulebook_content=rulebook_document.content,
        worldview_title=worldview_document.title,
        worldview_content=worldview_document.content,
        question_text=question_text,
    )
