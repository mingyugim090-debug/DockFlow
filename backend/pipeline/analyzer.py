"""공고 분석 → 지원서 자동 생성 파이프라인.

승인된 공고에 대해:
1. 공고 원문을 AI로 심층 분석 (핵심 요구사항, 평가 기준, 자격 요건 추출)
2. 분석 결과를 토대로 지원서/사업계획서 DOCX 초안 자동 생성
3. 생성된 파일을 Supabase에 기록
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


async def analyze_announcement(announcement: dict[str, Any]) -> str:
    """공고 원문을 AI로 심층 분석한다.

    Returns:
        분석 결과 텍스트 (마크다운 형식)
    """
    title = announcement.get("title", "")
    org = announcement.get("org", "")
    raw = announcement.get("raw_content", "") or announcement.get("summary", "")
    fund = announcement.get("fund", "")
    deadline = announcement.get("deadline", "")

    prompt = f"""다음 정부 지원사업 공고를 심층 분석해서 보고서를 작성해줘.

[공고 정보]
- 제목: {title}
- 기관: {org}
- 지원금: {fund}
- 마감일: {deadline}
- 내용:
{raw[:4000]}

[분석 보고서 형식]
## 1. 공고 개요
(공고 핵심 내용 3줄 요약)

## 2. 지원 자격 요건
(자격 요건 상세히 불릿으로)

## 3. 평가 기준 및 배점
(평가 항목별 배점 표로 정리, 없으면 예상 기준)

## 4. 핵심 준비 서류
(필수 제출 서류 목록)

## 5. 지원 전략 제안
(선정 확률을 높이기 위한 3~5가지 핵심 전략)

## 6. 주의사항
(놓치기 쉬운 포인트)
"""

    try:
        from agent.orchestrator import DocumentOrchestrator
        orch = DocumentOrchestrator()
        result = await orch.run(
            instruction=prompt,
            task_type="document_draft",
        )
        analysis = result.get("message", "")
        if analysis:
            logger.info("analysis_done", title=title[:40], chars=len(analysis))
            return analysis
    except Exception as exc:
        logger.error("analysis_failed", error=str(exc))

    return f"# {title} 분석\n\n자동 분석에 실패했습니다. 공고 원문을 직접 확인해주세요."


async def generate_application(
    announcement: dict[str, Any],
    analysis: str,
) -> dict[str, Any]:
    """분석 결과를 토대로 지원서 DOCX를 자동 생성한다.

    Returns:
        {"file_id": str, "file_url": str, "message": str}
    """
    title = announcement.get("title", "")
    org = announcement.get("org", "")
    fund = announcement.get("fund", "")

    prompt = f"""다음 분석 결과를 토대로 지원서(사업계획서) 초안을 작성해줘.

[공고]
- 제목: {title}
- 기관: {org}
- 지원금: {fund}

[분석 보고서]
{analysis[:3000]}

[작성 지시]
- "Word" 형식(DOCX)의 사업계획서를 작성
- 구성: 표지 → 사업 개요 → 핵심 기술/서비스 → 사업화 전략 → 팀 구성 → 재무 계획 → 기대 효과
- 총 8~12페이지 분량
- 평가 기준에 맞춰 항목별로 작성
- 한국어로 작성하고 전문적이지만 이해하기 쉬운 문체 사용
"""

    try:
        from agent.orchestrator import DocumentOrchestrator
        orch = DocumentOrchestrator()
        result = await orch.run(
            instruction=prompt,
            context={"format": "word"},
            task_type="document_draft",
        )

        file_url = ""
        if result.get("files"):
            file_info = result["files"][0]
            file_url = file_info.get("download_url", "") if isinstance(file_info, dict) else str(file_info)

        return {
            "file_url": file_url,
            "message": result.get("message", "지원서 생성 완료"),
            "status": "success" if result.get("status") == "success" else "partial",
        }

    except Exception as exc:
        logger.error("generation_failed", error=str(exc))
        return {
            "file_url": "",
            "message": f"지원서 생성 실패: {str(exc)}",
            "status": "failed",
        }


async def run_full_pipeline(announcement_id: str) -> dict[str, Any]:
    """전체 파이프라인 실행: 분석 → 지원서 생성 → DB 업데이트

    Args:
        announcement_id: Supabase announcements 테이블 ID

    Returns:
        {"analysis_summary", "analysis_file_url", "generated_file_url", "status"}
    """
    from supabase import create_client
    from core.config import settings

    client = create_client(settings.supabase_url, settings.supabase_service_key)

    # 공고 정보 조회
    ann_resp = client.table("announcements").select("*").eq("id", announcement_id).single().execute()
    if not ann_resp.data:
        return {"status": "failed", "message": "공고를 찾을 수 없습니다."}

    announcement = ann_resp.data

    # 1단계: 분석
    logger.info("pipeline_analyze_start", title=announcement["title"][:40])
    analysis = await analyze_announcement(announcement)

    # 2단계: 지원서 생성
    logger.info("pipeline_generate_start", title=announcement["title"][:40])
    gen_result = await generate_application(announcement, analysis)

    return {
        "analysis_summary": analysis[:1000],
        "analysis_file_url": "",  # TODO: 분석 보고서 DOCX 생성 시 URL
        "generated_file_url": gen_result.get("file_url", ""),
        "status": "completed" if gen_result.get("status") == "success" else "partial",
        "message": gen_result.get("message", ""),
    }
