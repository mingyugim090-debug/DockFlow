"""OpenAI 임베딩 생성 — text-embedding-3-small"""

from __future__ import annotations

import structlog

logger = structlog.get_logger(__name__)

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """텍스트 리스트를 OpenAI 임베딩 벡터로 변환한다.

    Args:
        texts: 임베딩할 텍스트 목록

    Returns:
        각 텍스트에 대한 1536차원 float 벡터 리스트
    """
    try:
        from openai import AsyncOpenAI
        from core.config import settings

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=texts,
        )
        vectors = [item.embedding for item in response.data]
        logger.info("embeddings_created", count=len(vectors), model=EMBEDDING_MODEL)
        return vectors

    except Exception as exc:
        logger.error("embedding_failed", error=str(exc))
        raise


async def embed_single(text: str) -> list[float]:
    """단일 텍스트를 임베딩한다."""
    results = await embed_texts([text])
    return results[0]
