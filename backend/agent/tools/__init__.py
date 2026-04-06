"""Agent Tool 레지스트리 — 모든 Tool을 등록/조회"""

from typing import Any, Callable, Coroutine

from agent.tools.ppt_tool import PPT_TOOL_SCHEMA, handle_create_ppt
from agent.tools.excel_tool import EXCEL_TOOL_SCHEMA, handle_create_excel
from agent.tools.word_tool import WORD_TOOL_SCHEMA, handle_create_word
from agent.tools.pdf_tool import PDF_TOOL_SCHEMA, handle_create_pdf_contract
from agent.tools.search_tool import SEARCH_TOOL_SCHEMA, handle_web_search

# ── Tool 이름 → 핸들러 매핑 ──
TOOL_REGISTRY: dict[str, Callable[..., Coroutine[Any, Any, dict]]] = {
    "create_ppt": handle_create_ppt,
    "create_excel": handle_create_excel,
    "create_word": handle_create_word,
    "create_pdf_contract": handle_create_pdf_contract,
    "web_search": handle_web_search,
}

# ── 전체 Tool 스키마 목록 ──
_ALL_TOOL_SCHEMAS: list[dict] = [
    PPT_TOOL_SCHEMA,
    EXCEL_TOOL_SCHEMA,
    WORD_TOOL_SCHEMA,
    PDF_TOOL_SCHEMA,
    SEARCH_TOOL_SCHEMA,
]


def get_all_tool_schemas() -> list[dict]:
    """등록된 모든 Tool의 JSON 스키마 반환"""
    return _ALL_TOOL_SCHEMAS.copy()


def get_tool_schemas_for_format(format_type: str) -> list[dict]:
    """특정 포맷에 맞는 Tool 스키마만 반환

    contract/pdf 포맷은 웹 검색 툴도 함께 포함 (최신 정보 반영 가능)
    """
    format_to_tools = {
        "pptx": [PPT_TOOL_SCHEMA, SEARCH_TOOL_SCHEMA],
        "ppt": [PPT_TOOL_SCHEMA, SEARCH_TOOL_SCHEMA],
        "xlsx": [EXCEL_TOOL_SCHEMA, SEARCH_TOOL_SCHEMA],
        "excel": [EXCEL_TOOL_SCHEMA, SEARCH_TOOL_SCHEMA],
        "docx": [WORD_TOOL_SCHEMA],
        "word": [WORD_TOOL_SCHEMA],
        "pdf": [PDF_TOOL_SCHEMA, SEARCH_TOOL_SCHEMA],
        "contract": [PDF_TOOL_SCHEMA],
    }
    return format_to_tools.get(format_type, _ALL_TOOL_SCHEMAS.copy())
