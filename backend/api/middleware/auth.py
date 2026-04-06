"""인증 의존성 — FastAPI Depends로 사용"""

from fastapi import Header, HTTPException, status

from core.config import settings


async def get_current_user_id(
    x_user_id: str | None = Header(default=None),
) -> str:
    """X-User-Id 헤더에서 Supabase user UUID를 추출합니다.

    - require_auth=False(개발 중): 헤더 없으면 "anonymous" 반환
    - require_auth=True(운영): 헤더 없으면 401 반환
    """
    if not settings.require_auth:
        return x_user_id or "anonymous"

    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증이 필요합니다. 카카오 로그인 후 이용해주세요.",
        )

    return x_user_id
