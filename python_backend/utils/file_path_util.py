"""역할:

파일 경로 조합
텍스트 파일 관련 공통 처리"""

from pathlib import Path


def get_file_name(file_path: Path | None) -> str | None:
    """Return the file name when a path exists."""
    if file_path is None:
        return None
    return file_path.name
