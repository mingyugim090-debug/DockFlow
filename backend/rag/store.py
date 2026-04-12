"""Supabase pgvector 기반 청크 저장·검색"""

from __future__ import annotations

import json
import uuid
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


def _get_supabase():
    """Supabase 클라이언트 반환 (lazy import)."""
    from supabase import create_client
    from core.config import settings
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def save_chunks(
    upload_id: str,
    user_id: str | None,
    chunks: list[str],
    vectors: list[list[float]],
) -> None:
    """청크와 벡터를 Supabase document_chunks 테이블에 저장한다."""
    client = _get_supabase()

    rows = [
        {
            "id": str(uuid.uuid4()),
            "upload_id": upload_id,
            "user_id": user_id,
            "content": chunk,
            "embedding": vector,
            "chunk_index": i,
        }
        for i, (chunk, vector) in enumerate(zip(chunks, vectors))
    ]

    try:
        client.table("document_chunks").insert(rows).execute()
        logger.info("chunks_saved", upload_id=upload_id, count=len(rows))
    except Exception as exc:
        logger.error("chunk_save_failed", upload_id=upload_id, error=str(exc))
        raise


async def search_similar(
    query_vector: list[float],
    upload_id: str,
    top_k: int = 5,
) -> list[str]:
    """쿼리 벡터와 가장 유사한 청크를 반환한다.

    Supabase RPC 함수 `match_document_chunks` 호출.
    """
    client = _get_supabase()

    try:
        result = client.rpc(
            "match_document_chunks",
            {
                "query_embedding": query_vector,
                "filter_upload_id": upload_id,
                "match_count": top_k,
            },
        ).execute()

        chunks = [row["content"] for row in (result.data or [])]
        logger.info("chunks_retrieved", upload_id=upload_id, count=len(chunks))
        return chunks

    except Exception as exc:
        logger.warning("chunk_search_failed", upload_id=upload_id, error=str(exc))
        return []


async def delete_chunks(upload_id: str) -> None:
    """특정 upload_id의 모든 청크를 삭제한다."""
    client = _get_supabase()
    try:
        client.table("document_chunks").delete().eq("upload_id", upload_id).execute()
        logger.info("chunks_deleted", upload_id=upload_id)
    except Exception as exc:
        logger.warning("chunk_delete_failed", upload_id=upload_id, error=str(exc))
