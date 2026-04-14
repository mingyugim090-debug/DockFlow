"""작업 유형에 따라 최적의 AI 모델을 선택하는 라우터.

전략:
  - 요약·분류·RAG 검색 쿼리 생성 등 경량 작업 → 로컬 Gemma (비용 0, 빠른 응답)
  - 슬라이드 HTML 생성·복잡한 추론·장문 작성 → 클라우드 (GPT-4o / Gemini)
  - 로컬 모델 응답 실패 시 → 설정된 fallback 모델로 자동 전환
"""

from __future__ import annotations

import asyncio
from enum import Enum
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


class TaskType(str, Enum):
    """모델 선택 기준 작업 유형"""
    # 경량 → 로컬 Gemma 사용
    SUMMARIZE = "summarize"          # 문서 요약
    CLASSIFY = "classify"            # 카테고리 분류
    RAG_QUERY = "rag_query"          # RAG 검색 쿼리 생성
    SIMPLE_REWRITE = "simple_rewrite"  # 단문 텍스트 수정

    # 복잡 → 클라우드 모델 사용
    SLIDE_DESIGN = "slide_design"    # 슬라이드 레이아웃+HTML 설계
    DOCUMENT_DRAFT = "document_draft"  # 긴 문서 초안 작성
    COMPLEX_REWRITE = "complex_rewrite"  # 복잡한 HTML/구조 변경


# 로컬 모델로 처리할 작업들
_LOCAL_TASKS = {
    TaskType.SUMMARIZE,
    TaskType.CLASSIFY,
    TaskType.RAG_QUERY,
    TaskType.SIMPLE_REWRITE,
}


def get_model_config(task: TaskType) -> dict[str, Any]:
    """작업 유형에 맞는 모델 설정 딕셔너리를 반환한다.

    Returns:
        {
            "base_url": str | None,  # None이면 기본 OpenAI 엔드포인트
            "model": str,
            "api_key": str,
            "temperature": float,
        }
    """
    from core.config import settings

    if task in _LOCAL_TASKS:
        # 로컬 Ollama 사용
        lm = settings.local_model
        if lm.get("enabled") and lm.get("base_url"):
            logger.info("model_router", task=task, selected="local", model=lm.get("model"))
            return {
                "base_url": lm["base_url"],
                "model": lm.get("model", "gemma4:e4b"),
                "api_key": lm.get("api_key", "ollama"),
                "temperature": lm.get("temperature", 0.1),
            }

    # 클라우드 (또는 로컬 비활성화 시 fallback)
    logger.info("model_router", task=task, selected="cloud", model=settings.default_model)
    return {
        "base_url": None,
        "model": settings.default_model,
        "api_key": settings.openai_api_key,
        "temperature": 0.7,
    }


async def run_local(
    prompt: str,
    task: TaskType = TaskType.SUMMARIZE,
    max_tokens: int = 1024,
) -> str:
    """로컬 Gemma 모델에 단순 텍스트 완성(completion)을 요청한다.

    슬라이드 생성과 같은 복잡한 function calling 루프가 필요 없는
    경량 작업(요약, 분류 등)에 사용한다.

    Returns:
        생성된 텍스트 (실패 시 빈 문자열)
    """
    cfg = get_model_config(task)

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=cfg["api_key"],
            base_url=cfg["base_url"],
        )
        resp = await client.chat.completions.create(
            model=cfg["model"],
            messages=[{"role": "user", "content": prompt}],
            temperature=cfg["temperature"],
            max_tokens=max_tokens,
        )
        text = resp.choices[0].message.content or ""
        logger.info("local_model_success", task=task, chars=len(text))
        return text

    except Exception as exc:
        logger.warning("local_model_failed", task=task, error=str(exc))
        return ""
