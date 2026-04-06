"""Pydantic 응답 모델"""

from pydantic import BaseModel, Field
from typing import Any, Literal


class FileInfo(BaseModel):
    """생성된 파일 정보"""
    file_id: str
    filename: str
    format: str
    download_url: str
    size_bytes: int = 0
    expires_at: str | None = None


class JobResponse(BaseModel):
    """작업 생성 응답 (202 Accepted)"""
    job_id: str
    status: Literal["processing", "success", "failed"] = "processing"
    estimated_seconds: int = 15


class JobStatusResponse(BaseModel):
    """작업 상태 조회 응답"""
    job_id: str
    status: Literal["processing", "success", "failed"]
    files: list[FileInfo] = Field(default_factory=list)
    message: str = ""
    duration_ms: int | None = None
    error: str | None = None
    progress: str | None = None


class DocumentResponse(BaseModel):
    """문서 생성 완료 응답 (동기 모드)"""
    file_id: str
    filename: str
    format: str
    download_url: str
    created_at: str
    message: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    """헬스체크 응답"""
    status: str = "ok"
    version: str = "0.1.0"


class ErrorResponse(BaseModel):
    """에러 응답"""
    error: str
    detail: str | None = None
