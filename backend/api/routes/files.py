"""파일 다운로드 라우트"""

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

import structlog

from core.config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api", tags=["files"])

# 확장자 → MIME 타입 매핑
MIME_TYPES = {
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pdf": "application/pdf",
}


@router.get("/files/{file_id}")
async def download_file(file_id: str):
    """생성된 파일 다운로드

    UUID 기반 파일 경로로 접근합니다.
    파일은 생성 후 1시간 뒤 자동 삭제됩니다.
    """
    # 지원 확장자 탐색
    for ext in MIME_TYPES:
        file_path = settings.output_dir / f"{file_id}{ext}"
        if file_path.exists():
            media_type = MIME_TYPES[ext]

            logger.info(
                "file_download",
                file_id=file_id,
                ext=ext,
                size=file_path.stat().st_size,
            )

            return FileResponse(
                path=str(file_path),
                media_type=media_type,
                filename=f"docflow_{file_id[:8]}{ext}",
                headers={
                    "Content-Disposition": f'attachment; filename="docflow_{file_id[:8]}{ext}"',
                },
            )

    raise HTTPException(
        status_code=404,
        detail="파일을 찾을 수 없습니다. 만료되었거나 존재하지 않는 파일입니다.",
    )
