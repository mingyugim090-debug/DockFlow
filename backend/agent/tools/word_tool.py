"""Word 생성 Tool — Claude Agent Tool 정의 + 핸들러"""

import uuid
import structlog

logger = structlog.get_logger(__name__)

# ── Tool 스키마 (Claude에 전달) ──
WORD_TOOL_SCHEMA = {
    "name": "create_word",
    "description": (
        "Word 문서(.docx)를 생성합니다. "
        "문서 제목과 콘텐츠 블록(헤딩, 본문, 리스트 등)을 지정하세요. "
        "보고서, 공문서, 사업계획서 등의 줄글 형태 문서에 적합합니다."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "문서 전체 제목",
            },
            "content_blocks": {
                "type": "array",
                "description": "콘텐츠 블록 목록",
                "items": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "enum": ["heading", "paragraph", "list"],
                            "description": "블록 종류",
                        },
                        "text": {
                            "type": "string",
                            "description": "본문 내용",
                        },
                        "level": {
                            "type": "integer",
                            "description": "헤딩일 경우 레벨 (1~9)",
                        },
                    },
                    "required": ["type", "text"],
                },
            },
        },
        "required": ["title", "content_blocks"],
    },
}

async def handle_create_word(tool_input: dict) -> dict:
    """Word 생성 Tool 핸들러

    Args:
        tool_input: 모델이 제공하는 Tool Input

    Returns:
        dict: 생성 결과 (file_id, filename, path 등)
    """
    from document.word_engine import WordEngine
    from core.config import settings

    file_id = str(uuid.uuid4())
    title = tool_input.get("title", "문서")
    content_blocks = tool_input.get("content_blocks", [])

    # 파일명 (특수문자 제거)
    safe_title = "".join(c for c in title if c.isalnum() or c in (" ", "_", "-")).strip()
    filename = f"{safe_title}.docx"
    output_path = settings.output_dir / f"{file_id}.docx"

    engine = WordEngine()
    result = engine.create(
        title=title,
        content_blocks=content_blocks,
        output_path=output_path,
    )

    logger.info("word_tool_complete", file_id=file_id, filename=filename)

    return {
        "success": True,
        "file": {
            "file_id": file_id,
            "filename": filename,
            "format": "docx",
            "download_url": f"/api/files/{file_id}",
            "size_bytes": result["size_bytes"],
            "block_count": result["block_count"],
        },
    }
