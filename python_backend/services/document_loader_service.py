"""rulebook/2_rulebook.txt
worldview/2_worldview.txt
같은 파일 규칙 처리

즉 gameId 기준으로 어떤 파일을 읽을지 찾는 역할"""

from dataclasses import dataclass
from pathlib import Path

from config import DOCUMENT_TYPE_RULEBOOK, DOCUMENT_TYPE_WORLDVIEW
from services.file_service import get_document_title, get_text_file_for_game_id, read_text_file


@dataclass(frozen=True)
class LoadedDocument:
    """Loaded text document metadata."""

    document_type: str
    file_path: Path
    title: str
    content: str


@dataclass(frozen=True)
class LoadedDocuments:
    """Rulebook is required, worldview is optional for chat answers."""

    rulebook: LoadedDocument
    worldview: LoadedDocument | None


def _load_document(document_type: str, game_id: int) -> LoadedDocument:
    file_path = get_text_file_for_game_id(document_type, game_id)
    return LoadedDocument(
        document_type=document_type,
        file_path=file_path,
        title=get_document_title(file_path),
        content=read_text_file(file_path),
    )


def load_rulebook_document(game_id: int) -> LoadedDocument:
    """Load the required rulebook document for the given game."""
    return _load_document(DOCUMENT_TYPE_RULEBOOK, game_id)


def load_optional_worldview_document(game_id: int) -> LoadedDocument | None:
    """Load the worldview document when it exists."""
    try:
        return _load_document(DOCUMENT_TYPE_WORLDVIEW, game_id)
    except FileNotFoundError:
        return None


def load_chat_documents(game_id: int) -> LoadedDocuments:
    """Load the documents needed for the AI chat flow."""
    return LoadedDocuments(
        rulebook=load_rulebook_document(game_id),
        worldview=load_optional_worldview_document(game_id),
    )
