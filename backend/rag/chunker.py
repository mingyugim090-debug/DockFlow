"""텍스트 청킹 — 슬라이딩 윈도우 방식"""

from __future__ import annotations


def chunk_text(
    text: str,
    chunk_size: int = 800,
    overlap: int = 100,
) -> list[str]:
    """텍스트를 chunk_size 글자 단위로 분할한다.

    Args:
        text: 원본 텍스트
        chunk_size: 청크당 최대 글자 수 (기본 800)
        overlap: 연속 청크 간 겹치는 글자 수 (기본 100)

    Returns:
        청크 문자열 리스트
    """
    text = text.strip()
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start += chunk_size - overlap

    return chunks
