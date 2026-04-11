"""워크플로우 CRUD API"""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

import structlog

from api.middleware.auth import get_current_user_id
from core.config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api", tags=["workflows"])


# ── Pydantic 모델 ──────────────────────────────────────────────


class WorkflowStep(BaseModel):
    label: str
    type: str
    color: str = "bg-gray-100 text-gray-600"


class WorkflowCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    purpose: Optional[str] = None
    trigger_type: Optional[str] = None
    steps: list[WorkflowStep] = []


class WorkflowUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    purpose: Optional[str] = None
    trigger_type: Optional[str] = None
    steps: Optional[list[WorkflowStep]] = None
    enabled: Optional[bool] = None
    status: Optional[str] = None


class WorkflowListItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    purpose: Optional[str] = None
    trigger_type: Optional[str] = None
    steps: list[Any] = []
    enabled: bool = True
    status: str = "active"
    run_count: int = 0
    success_count: int = 0
    last_run_at: Optional[str] = None
    created_at: str
    updated_at: str


# ── 공통 헬퍼 ──────────────────────────────────────────────────


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


# ── 엔드포인트 ──────────────────────────────────────────────────


@router.get("/workflows", response_model=list[WorkflowListItem])
async def list_workflows(
    user_id: str = Depends(get_current_user_id),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """로그인한 사용자의 워크플로우 목록을 반환합니다."""
    if user_id == "anonymous":
        return []

    client = _get_supabase_client()
    if client is None:
        logger.warning("supabase_not_configured")
        return []

    result = (
        client.from_("workflows")
        .select(
            "id, title, description, purpose, trigger_type, steps, "
            "enabled, status, run_count, success_count, last_run_at, "
            "created_at, updated_at"
        )
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute()
    )

    return result.data or []


@router.post("/workflows", response_model=WorkflowListItem, status_code=201)
async def create_workflow(
    body: WorkflowCreateRequest,
    user_id: str = Depends(get_current_user_id),
):
    """새 워크플로우를 생성합니다."""
    if user_id == "anonymous":
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

    client = _get_supabase_client()
    if client is None:
        raise HTTPException(status_code=503, detail="데이터베이스를 사용할 수 없습니다.")

    row = {
        "user_id": user_id,
        "title": body.title,
        "description": body.description,
        "purpose": body.purpose,
        "trigger_type": body.trigger_type,
        "steps": [s.model_dump() for s in body.steps],
        "enabled": True,
        "status": "active",
        "run_count": 0,
        "success_count": 0,
    }

    result = client.from_("workflows").insert(row).select().single().execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="워크플로우 생성에 실패했습니다.")

    logger.info("workflow_created", workflow_id=result.data["id"], user_id=user_id)
    return result.data


@router.patch("/workflows/{workflow_id}", response_model=WorkflowListItem)
async def update_workflow(
    workflow_id: str,
    body: WorkflowUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    """워크플로우를 수정합니다 (활성화/비활성화 포함)."""
    if user_id == "anonymous":
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

    client = _get_supabase_client()
    if client is None:
        raise HTTPException(status_code=503, detail="데이터베이스를 사용할 수 없습니다.")

    # 소유권 확인
    check = (
        client.from_("workflows")
        .select("id")
        .eq("id", workflow_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=403, detail="접근 권한이 없거나 존재하지 않는 워크플로우입니다.")

    updates: dict[str, Any] = {}
    if body.title is not None:
        updates["title"] = body.title
    if body.description is not None:
        updates["description"] = body.description
    if body.purpose is not None:
        updates["purpose"] = body.purpose
    if body.trigger_type is not None:
        updates["trigger_type"] = body.trigger_type
    if body.steps is not None:
        updates["steps"] = [s.model_dump() for s in body.steps]
    if body.enabled is not None:
        updates["enabled"] = body.enabled
        updates["status"] = "active" if body.enabled else "paused"
    if body.status is not None:
        updates["status"] = body.status

    if not updates:
        raise HTTPException(status_code=400, detail="변경할 항목이 없습니다.")

    result = (
        client.from_("workflows")
        .update(updates)
        .eq("id", workflow_id)
        .select()
        .single()
        .execute()
    )

    logger.info("workflow_updated", workflow_id=workflow_id, user_id=user_id)
    return result.data


@router.delete("/workflows/{workflow_id}", status_code=204)
async def delete_workflow(
    workflow_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """워크플로우를 삭제합니다."""
    if user_id == "anonymous":
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

    client = _get_supabase_client()
    if client is None:
        raise HTTPException(status_code=503, detail="데이터베이스를 사용할 수 없습니다.")

    check = (
        client.from_("workflows")
        .select("id")
        .eq("id", workflow_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=403, detail="접근 권한이 없거나 존재하지 않는 워크플로우입니다.")

    client.from_("workflows").delete().eq("id", workflow_id).execute()
    logger.info("workflow_deleted", workflow_id=workflow_id, user_id=user_id)
