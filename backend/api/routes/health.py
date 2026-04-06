"""헬스체크 라우트"""

from fastapi import APIRouter
from models.response import HealthResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """서버 상태 확인"""
    return HealthResponse(status="ok", version="0.1.0")
