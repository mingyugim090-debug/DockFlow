"""Tavily 웹 검색 Tool — OpenAI Function Calling 정의 + 핸들러"""

from typing import Any

import structlog

logger = structlog.get_logger(__name__)

# ── Tool 스키마 ──
SEARCH_TOOL_SCHEMA = {
    "name": "web_search",
    "description": (
        "인터넷에서 최신 정보를 검색합니다. "
        "부동산 시세, 금리, 법령 개정, 시장 동향 등 실시간 정보가 필요할 때 사용하세요. "
        "검색 결과를 문서 내용에 반영합니다."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "검색 쿼리 (예: '2026 서울 아파트 전세 시세')",
            },
            "max_results": {
                "type": "integer",
                "description": "최대 검색 결과 수 (기본: 5, 최대: 10)",
                "default": 5,
            },
        },
        "required": ["query"],
    },
}


async def handle_web_search(tool_input: dict[str, Any]) -> dict:
    """Tavily 웹 검색 핸들러

    Args:
        tool_input: OpenAI Function Calling에서 전달받은 인자

    Returns:
        dict: {"success": bool, "results": [...], "summary": str}
    """
    import httpx
    from core.config import settings

    query = tool_input.get("query", "")
    max_results = min(tool_input.get("max_results", 5), 10)

    if not settings.tavily_api_key:
        logger.warning("tavily_api_key_missing")
        return {
            "success": False,
            "results": [],
            "summary": "검색 API 키가 설정되지 않아 웹 검색을 수행할 수 없습니다.",
        }

    logger.info("web_search_start", query=query[:80])

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://api.tavily.com/search",
            json={
                "api_key": settings.tavily_api_key,
                "query": query,
                "max_results": max_results,
                "search_depth": "basic",
                "include_answer": True,
            },
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for r in data.get("results", []):
        results.append({
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "content": r.get("content", "")[:500],  # 500자로 잘라 토큰 절약
        })

    summary = data.get("answer", "")

    logger.info("web_search_done", query=query[:80], result_count=len(results))

    return {
        "success": True,
        "query": query,
        "results": results,
        "summary": summary,
    }
