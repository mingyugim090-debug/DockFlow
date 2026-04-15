"""공고 모니터링 API 라우트"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Any

import structlog

from core.config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/announcements", tags=["announcements"])


def _get_supabase():
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_service_key)


# ── 요청/응답 모델 ──

class CollectRequest(BaseModel):
    count: int = Field(default=30, ge=1, le=100)
    category: str | None = None


class RequestApprovalBody(BaseModel):
    user_id: str | None = None


# ── 엔드포인트 ──

@router.get("")
async def list_announcements(
    status: str = "active",
    min_score: int = 0,
    limit: int = 50,
    offset: int = 0,
):
    """공고 목록 조회 (필터/정렬/페이징)"""
    client = _get_supabase()

    query = (
        client.table("announcements")
        .select("*")
        .eq("status", status)
        .gte("score", min_score)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )

    result = query.execute()
    return {"announcements": result.data or [], "count": len(result.data or [])}


@router.get("/stats")
async def get_stats():
    """공고 통계 (오늘 수집, 분석 완료, 높은 적합도, 마감 임박)"""
    client = _get_supabase()

    all_resp = client.table("announcements").select("id, score, deadline, is_new, created_at", count="exact").eq("status", "active").execute()
    items = all_resp.data or []

    from datetime import date, timedelta
    today = date.today()
    week_later = today + timedelta(days=7)

    total = len(items)
    high_score = sum(1 for i in items if (i.get("score") or 0) >= 80)
    deadline_soon = sum(
        1 for i in items
        if i.get("deadline") and i["deadline"] <= str(week_later)
    )
    new_today = sum(
        1 for i in items
        if i.get("created_at", "").startswith(str(today))
    )

    return {
        "total": total,
        "new_today": new_today,
        "high_score": high_score,
        "deadline_soon": deadline_soon,
    }


@router.get("/{announcement_id}")
async def get_announcement(announcement_id: str):
    """공고 상세 조회"""
    client = _get_supabase()
    result = client.table("announcements").select("*").eq("id", announcement_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다.")
    return result.data


@router.post("/collect")
async def trigger_collect(req: CollectRequest, bg: BackgroundTasks):
    """공고 수집 트리거 (백그라운드 실행)"""
    api_key = settings.bizinfo_api_key
    if not api_key:
        raise HTTPException(status_code=400, detail="기업마당 API 키가 설정되지 않았습니다. (.env에 BIZINFO_API_KEY 추가)")

    async def _do_collect():
        from crawler.collector import collect_and_store
        count = await collect_and_store(api_key=api_key, count=req.count)
        logger.info("collect_complete", saved=count)

    bg.add_task(_do_collect)

    return {
        "status": "collecting",
        "message": f"공고 수집이 시작되었습니다. 최대 {req.count}건을 수집합니다.",
    }


@router.post("/{announcement_id}/request-approval")
async def request_approval(announcement_id: str, body: RequestApprovalBody):
    """해당 공고에 대한 지원서 작성 승인 요청 생성"""
    client = _get_supabase()

    # 공고 존재 확인
    ann = client.table("announcements").select("id, title").eq("id", announcement_id).single().execute()
    if not ann.data:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다.")

    # 기존 요청 중복 확인
    existing = (
        client.table("approval_requests")
        .select("id")
        .eq("announcement_id", announcement_id)
        .in_("status", ["pending", "processing"])
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="이미 처리 중인 승인 요청이 있습니다.")

    # 승인 요청 생성
    import uuid
    user_id = None
    if body.user_id and body.user_id != "string":
        try:
            # 유효한 UUID인지 검사
            uuid_obj = uuid.UUID(body.user_id)
            user_id = str(uuid_obj)
        except ValueError:
            user_id = None

    row = {
        "announcement_id": announcement_id,
        "user_id": user_id,
        "status": "pending",
    }
    result = client.table("approval_requests").insert(row).execute()

    # 공고의 is_new를 false로 변경
    client.table("announcements").update({"is_new": False}).eq("id", announcement_id).execute()

    logger.info("approval_requested", announcement_id=announcement_id)
    return {
        "approval_id": result.data[0]["id"] if result.data else None,
        "status": "pending",
        "message": f"'{ann.data['title']}' 공고의 지원서 작성 요청이 생성되었습니다.",
    }
