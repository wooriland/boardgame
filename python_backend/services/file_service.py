import re
from pathlib import Path

from config import (
    BASE_DIR,
    DEFAULT_ENCODING,
    DOCUMENT_TYPE_RULEBOOK,
    DOCUMENT_TYPE_WORLDVIEW,
    RULEBOOK_DIR,
    WORLDVIEW_DIR,
)


def get_directory_for_document_type(document_type: str) -> Path:
    """Return the directory for the given document type."""
    if document_type == DOCUMENT_TYPE_WORLDVIEW:
        return WORLDVIEW_DIR
    if document_type == DOCUMENT_TYPE_RULEBOOK:
        return RULEBOOK_DIR

    raise ValueError("Unsupported document type. Use WORLDVIEW or RULEBOOK only.")


def list_text_files(document_type: str) -> list[Path]:
    """List `.txt` files from the directory for the given document type."""
    target_dir = get_directory_for_document_type(document_type)

    if not target_dir.exists():
        raise FileNotFoundError(f"Document directory not found: {target_dir}")

    text_files = sorted(
        [file_path for file_path in target_dir.iterdir() if file_path.is_file() and file_path.suffix.lower() == ".txt"]
    )

    if not text_files:
        raise FileNotFoundError(f"No .txt files found in {target_dir.name}.")

    return text_files


def extract_game_id_from_file_name(file_path: Path) -> int:
    """Extract the leading game_id prefix from a text file name."""
    match = re.match(r"^(\d+)(?:[_\-\s]|$)", file_path.stem)

    if not match:
        raise ValueError(
            f"파일명 앞에 GAME_ID prefix가 없습니다: {file_path.name}. "
            "예시: 99_rulebook.txt"
        )

    return int(match.group(1))


def get_text_file_for_game_id(document_type: str, game_id: int) -> Path:
    """Return the only text file that matches the given game_id and document type."""
    matched_files = [
        file_path
        for file_path in list_text_files(document_type)
        if extract_game_id_from_file_name(file_path) == game_id
    ]

    if not matched_files:
        raise FileNotFoundError(f"GAME_ID {game_id}에 연결된 {document_type} 텍스트 파일을 찾지 못했습니다.")

    if len(matched_files) > 1:
        matched_names = ", ".join(file_path.name for file_path in matched_files)
        raise ValueError(f"GAME_ID {game_id}에 연결된 {document_type} 파일이 여러 개 있습니다: {matched_names}")

    return matched_files[0]


def read_text_file(file_path: Path, encoding: str = DEFAULT_ENCODING) -> str:
    """Read a text file with UTF-8 by default."""
    if not file_path.exists():
        raise FileNotFoundError(f"선택된 파일을 찾지 못했습니다: {file_path}")

    try:
        return file_path.read_text(encoding=encoding)
    except UnicodeDecodeError as error:
        raise UnicodeDecodeError(
            error.encoding,
            error.object,
            error.start,
            error.end,
            "파일을 UTF-8로 읽지 못했습니다. 파일 인코딩을 확인해 주세요.",
        ) from error
    except OSError as error:
        raise OSError(f"파일을 읽는 중 오류가 발생했습니다: {file_path}") from error


def get_document_title(file_path: Path) -> str:
    """Use the file stem as the document title."""
    title = re.sub(r"^\d+(?:[_\-\s]+)?", "", file_path.stem)

    if not title:
        title = file_path.stem

    return title.replace("_", " ").replace("-", " ").strip()


def get_game_name_from_file(file_path: Path) -> str:
    """Fallback: use the file name as the game name."""
    return get_document_title(file_path)


def get_relative_file_path(file_path: Path) -> str:
    """Return the project-relative path for DB storage."""
    return file_path.resolve().relative_to(BASE_DIR.resolve()).as_posix()
