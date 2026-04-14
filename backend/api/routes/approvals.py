"""승인 워크플로우 API 라우트"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

import structlog

from core.config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/approvals", tags=["approvals"])


def _get_supabase():
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_service_key)


# ── 엔드포인트 ──

@router.get("")
async def list_approvals(status: str | None = None, limit: int = 50):
    """승인 요청 목록 조회 (공고 정보 포함)"""
    client = _get_supabase()

    query = (
        client.table("approval_requests")
        .select("*, announcements(*)")
        .order("created_at", desc=True)
        .limit(limit)
    )
    if status:
        query = query.eq("status", status)

    result = query.execute()
    return {"approvals": result.data or [], "count": len(result.data or [])}


@router.get("/{approval_id}")
async def get_approval(approval_id: str):
    """승인 요청 상세 조회"""
    client = _get_supabase()
    result = (
        client.table("approval_requests")
        .select("*, announcements(*)")
        .eq("id", approval_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="승인 요청을 찾을 수 없습니다.")
    return result.data


@router.patch("/{approval_id}/approve")
async def approve_request(approval_id: str, bg: BackgroundTasks):
    """승인 → 분석 + 지원서 생성 파이프라인 시작 (백그라운드)"""
    client = _get_supabase()

    # 상태 확인
    req = (
        client.table("approval_requests")
        .select("*, announcements(*)")
        .eq("id", approval_id)
        .single()
        .execute()
    )
    if not req.data:
        raise HTTPException(status_code=404, detail="승인 요청을 찾을 수 없습니다.")
    if req.data["status"] not in ("pending",):
        raise HTTPException(status_code=400, detail=f"현재 상태({req.data['status']})에서는 승인할 수 없습니다.")

    # 상태를 processing으로 변경
    client.table("approval_requests").update({
        "status": "processing",
        "reviewed_at": datetime.utcnow().isoformat(),
    }).eq("id", approval_id).execute()

    # 백그라운드에서 파이프라인 실행
    announcement_id = req.data["announcement_id"]

    async def _run_pipeline():
        try:
            from pipeline.analyzer import run_full_pipeline
            result = await run_full_pipeline(announcement_id)

            client.table("approval_requests").update({
                "status": result.get("status", "completed"),
                "analysis_summary": result.get("analysis_summary", ""),
                "analysis_file_url": result.get("analysis_file_url", ""),
                "generated_file_url": result.get("generated_file_url", ""),
            }).eq("id", approval_id).execute()

            logger.info("pipeline_complete", approval_id=approval_id, status=result.get("status"))

        except Exception as exc:
            logger.error("pipeline_error", approval_id=approval_id, error=str(exc))
            client.table("approval_requests").update({
                "status": "failed",
                "analysis_summary": f"파이프라인 실행 실패: {str(exc)}",
            }).eq("id", approval_id).execute()

    bg.add_task(_run_pipeline)

    logger.info("approval_approved", approval_id=approval_id)
    return {
        "status": "processing",
        "message": "승인되었습니다. AI가 분석 및 지원서 생성을 시작합니다.",
    }


@router.patch("/{approval_id}/reject")
async def reject_request(approval_id: str):
    """반려"""
    client = _get_supabase()

    req = client.table("approval_requests").select("id, status").eq("id", approval_id).single().execute()
    if not req.data:
        raise HTTPException(status_code=404, detail="승인 요청을 찾을 수 없습니다.")
    if req.data["status"] not in ("pending",):
        raise HTTPException(status_code=400, detail=f"현재 상태({req.data['status']})에서는 반려할 수 없습니다.")

    client.table("approval_requests").update({
        "status": "rejected",
        "reviewed_at": datetime.utcnow().isoformat(),
    }).eq("id", approval_id).execute()

    logger.info("approval_rejected", approval_id=approval_id)
    return {"status": "rejected", "message": "반려되었습니다."}
