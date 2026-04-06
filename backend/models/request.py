"""Pydantic 요청 모델"""

from pydantic import BaseModel, Field
from typing import Any, Literal


class GenerateRequest(BaseModel):
    """통합 문서 생성 요청"""
    instruction: str = Field(
        ...,
        description="자연어 명령 (예: '3분기 부동산 시장 보고서 PPT 5슬라이드')",
    )
    format: Literal["pptx", "xlsx", "pdf", "contract"] = Field(
        default="pptx",
        description="출력 파일 형식",
    )
    context: dict[str, Any] = Field(
        default_factory=dict,
        description="추가 컨텍스트 (부동산 정보, 날짜 등)",
    )
    session_id: str | None = Field(
        default=None,
        description="멀티턴 세션 ID (Phase 2)",
    )


class PptGenerateRequest(BaseModel):
    """PPT 직접 생성 요청"""
    title: str = Field(..., description="프레젠테이션 제목")
    slides: list[dict[str, Any]] = Field(..., description="슬라이드 목록")
    theme: Literal["modern", "classic", "minimal", "dark"] = Field(
        default="modern",
        description="테마",
    )


class ExcelGenerateRequest(BaseModel):
    """엑셀 직접 생성 요청"""
    filename: str = Field(default="document", description="파일명")
    sheets: list[dict[str, Any]] = Field(..., description="시트 목록")
    add_total_row: bool = Field(default=True, description="합계 행 자동 추가")
