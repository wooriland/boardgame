"""역할:

텍스트 정리
공통 유틸 처리"""


def normalize_text(value: str | None) -> str:
    """Normalize optional text input into a stripped string."""
    return (value or "").strip()


def has_text(value: str | None) -> bool:
    """Return whether the given value contains any non-whitespace text."""
    return bool(normalize_text(value))
