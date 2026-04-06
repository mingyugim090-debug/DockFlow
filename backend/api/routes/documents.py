"""사용자별 문서 목록 API"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

import structlog

from api.middleware.auth import get_current_user_id
from core.config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api", tags=["documents"])


class DocumentListItem(BaseModel):
    id: str
    file_id: str
    filename: str
    format: str
    instruction: Optional[str] = None
    size_bytes: int = 0
    created_at: str


def _get_supabase_client():
    """Supabase 클라이언트 반환. 설정 없으면 None."""
    if not settings.supabase_url or not settings.supabase_service_key:
        return None
    try:
        from supabase import create_client  # type: ignore
        return create_client(settings.supabase_url, settings.supabase_service_key)
    except Exception as e:
        logger.error("supabase_client_init_failed", error=str(e))
        return None


@router.get("/documents", response_model=list[DocumentListItem])
async def list_documents(
    user_id: str = Depends(get_current_user_id),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """로그인한 사용자의 문서 목록을 반환합니다."""
    if user_id == "anonymous":
        return []

    client = _get_supabase_client()
    if client is None:
        logger.warning("supabase_not_configured")
        return []

    result = (
        client.from_("documents")
        .select("id, file_id, filename, format, instruction, size_bytes, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute()
    )

    return result.data or []


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """문서를 삭제합니다. 본인 소유 문서만 삭제 가능합니다."""
    if user_id == "anonymous":
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

    client = _get_supabase_client()
    if client is None:
        raise HTTPException(status_code=503, detail="데이터베이스를 사용할 수 없습니다.")

    # 소유권 확인 (user_id 조건으로 다른 사용자 문서 접근 차단)
    check = (
        client.from_("documents")
        .select("id")
        .eq("id", document_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not check.data:
        raise HTTPException(status_code=403, detail="접근 권한이 없거나 존재하지 않는 문서입니다.")

    client.from_("documents").delete().eq("id", document_id).execute()
    logger.info("document_deleted", document_id=document_id, user_id=user_id)
