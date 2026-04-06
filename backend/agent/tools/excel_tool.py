"""엑셀 생성 Tool — Claude Agent Tool 정의 + 핸들러"""

import uuid

import structlog

logger = structlog.get_logger(__name__)

# ── Tool 스키마 (Claude에 전달) ──
EXCEL_TOOL_SCHEMA = {
    "name": "create_excel",
    "description": (
        "엑셀 스프레드시트(.xlsx)를 생성합니다. "
        "시트명, 헤더, 데이터 행을 지정하세요. "
        "정산서, 매출 현황, 관리비 명세, 데이터 목록에 적합합니다."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "filename": {
                "type": "string",
                "description": "엑셀 파일명 (확장자 제외)",
            },
            "sheets": {
                "type": "array",
                "description": "시트 목록",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "시트 이름",
                        },
                        "headers": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "열 헤더 목록",
                        },
                        "rows": {
                            "type": "array",
                            "items": {
                                "type": "array",
                                "items": {},
                            },
                            "description": "데이터 행 목록 (2차원 배열)",
                        },
                    },
                    "required": ["name", "headers", "rows"],
                },
            },
            "add_total_row": {
                "type": "boolean",
                "default": True,
                "description": "합계 행 자동 추가 여부",
            },
        },
        "required": ["filename", "sheets"],
    },
}


async def handle_create_excel(tool_input: dict) -> dict:
    """엑셀 생성 Tool 핸들러

    Args:
        tool_input: Claude가 제공하는 Tool Input

    Returns:
        dict: 생성 결과
    """
    from document.excel_engine import ExcelEngine
    from core.config import settings

    file_id = str(uuid.uuid4())
    raw_filename = tool_input.get("filename", "document")
    sheets = tool_input.get("sheets", [])
    add_total = tool_input.get("add_total_row", True)

    # 파일명
    safe_name = "".join(c for c in raw_filename if c.isalnum() or c in (" ", "_", "-")).strip()
    filename = f"{safe_name}.xlsx"
    output_path = settings.output_dir / f"{file_id}.xlsx"

    engine = ExcelEngine()
    result = engine.create(
        sheets=sheets,
        output_path=output_path,
        add_total_row=add_total,
    )

    logger.info("excel_tool_complete", file_id=file_id, filename=filename)

    return {
        "success": True,
        "file": {
            "file_id": file_id,
            "filename": filename,
            "format": "xlsx",
            "download_url": f"/api/files/{file_id}",
            "size_bytes": result["size_bytes"],
            "sheet_count": result["sheet_count"],
            "total_rows": result["total_rows"],
        },
    }
