"""PPT 생성 Tool — Claude Agent Tool 정의 + 핸들러"""

import uuid

import structlog

logger = structlog.get_logger(__name__)

# ── Tool 스키마 (Claude에 전달) ──
PPT_TOOL_SCHEMA = {
    "name": "create_ppt",
    "description": (
        "PowerPoint 프레젠테이션(.pptx)을 생성합니다. "
        "슬라이드 제목, 내용, 레이아웃을 지정하세요. "
        "공인중개사 보고서, 사업 제안서, 시장 분석 자료에 적합합니다."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "프레젠테이션 전체 제목",
            },
            "slides": {
                "type": "array",
                "description": "슬라이드 목록",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "슬라이드 제목",
                        },
                        "layout": {
                            "type": "string",
                            "enum": ["title_only", "content", "two_column"],
                            "default": "content",
                            "description": "레이아웃 유형",
                        },
                        "content": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "불릿 포인트 목록",
                        },
                        "notes": {
                            "type": "string",
                            "description": "발표자 노트 (선택)",
                        },
                    },
                    "required": ["title"],
                },
            },
            "theme": {
                "type": "string",
                "enum": ["modern", "classic", "minimal", "dark"],
                "default": "modern",
                "description": "프레젠테이션 테마",
            },
        },
        "required": ["title", "slides"],
    },
}


async def handle_create_ppt(tool_input: dict) -> dict:
    """PPT 생성 Tool 핸들러

    Args:
        tool_input: Claude가 제공하는 Tool Input

    Returns:
        dict: 생성 결과 (file_id, filename, path 등)
    """
    from document.ppt_engine import PptEngine
    from core.config import settings

    file_id = str(uuid.uuid4())
    title = tool_input.get("title", "문서")
    theme = tool_input.get("theme", "modern")
    slides = tool_input.get("slides", [])

    # 파일명 (특수문자 제거)
    safe_title = "".join(c for c in title if c.isalnum() or c in (" ", "_", "-")).strip()
    filename = f"{safe_title}.pptx"
    output_path = settings.output_dir / f"{file_id}.pptx"

    engine = PptEngine(theme=theme)
    result = engine.create(
        title=title,
        slides=slides,
        output_path=output_path,
    )

    logger.info("ppt_tool_complete", file_id=file_id, filename=filename)

    return {
        "success": True,
        "file": {
            "file_id": file_id,
            "filename": filename,
            "format": "pptx",
            "download_url": f"/api/files/{file_id}",
            "size_bytes": result["size_bytes"],
            "slide_count": result["slide_count"],
        },
    }
