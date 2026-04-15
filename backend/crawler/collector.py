"""기업마당(bizinfo.go.kr) 공고 자동 수집 크롤러.

기업마당 오픈 API를 사용하여 정부 지원사업 공고를 수집하고,
AI로 요약 및 적합도 점수를 산출한 뒤 Supabase에 저장한다.

API 문서: https://www.bizinfo.go.kr (정책정보 개방 → 지원사업정보 API)
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any

import httpx
import structlog

logger = structlog.get_logger(__name__)

# 기업마당 API 엔드포인트
BIZINFO_API_URL = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do"


async def fetch_announcements(
    api_key: str,
    count: int = 30,
    category: str | None = None,
) -> list[dict[str, Any]]:
    """기업마당 API에서 공고 목록을 수집한다.

    Args:
        api_key: 기업마당 서비스 인증키
        count: 수집할 공고 수 (기본 30)
        category: 분야 코드 (None이면 전체)

    Returns:
        공고 딕셔너리 리스트
    """
    params: dict[str, Any] = {
        "crtfcKey": api_key,
        "dataType": "json",
        "searchCnt": count,
    }
    if category:
        params["searchLclasId"] = category

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(BIZINFO_API_URL, params=params)
            resp.raise_for_status()

        data = resp.json()
        items = data.get("jsonArray", [])
        logger.info("bizinfo_fetched", count=len(items))
        return _normalize_items(items)

    except httpx.HTTPStatusError as exc:
        logger.error("bizinfo_http_error", status=exc.response.status_code)
        return []
    except Exception as exc:
        logger.error("bizinfo_fetch_failed", error=str(exc))
        return []


def _normalize_items(items: list[dict]) -> list[dict[str, Any]]:
    """API 응답을 통일된 포맷으로 변환한다."""
    results = []
    for item in items:
        # 마감일 파싱
        deadline = None
        end_date = item.get("reqstEndDe", "") or item.get("endDe", "")
        if end_date:
            try:
                deadline = datetime.strptime(end_date.replace(".", "-").strip()[:10], "%Y-%m-%d").date()
            except ValueError:
                pass

        results.append({
            "title": (item.get("pblancNm") or item.get("title") or "").strip(),
            "org": (item.get("jrsdInsttNm") or item.get("mngtInsttNm") or "").strip(),
            "category": (item.get("pldirSportRealmLclasCodeNm") or "").strip(),
            "source_url": (item.get("pblancUrl") or "").strip(),
            "fund": (item.get("totPrntCnt") or "").strip(),
            "deadline": deadline,
            "external_id": f"bizinfo_{item.get('pblancId') or item.get('inqireQy', '')}",
            "raw_content": (item.get("bsnsSumryCn") or item.get("excptnInsttNm") or "").strip(),
            "source": "bizinfo",
        })
    return results


async def score_and_summarize(
    announcement: dict[str, Any],
) -> dict[str, Any]:
    """AI로 공고 적합도 점수와 요약을 생성한다.

    로컬 Gemma 모델을 우선 사용하고, 실패 시 GPT-4o-mini로 fallback.
    """
    title = announcement.get("title", "")
    raw = announcement.get("raw_content", "")
    text = f"제목: {title}\n내용: {raw[:2000]}" if raw else f"제목: {title}"

    prompt = f"""다음 정부 지원사업 공고를 분석해줘.

{text}

응답 형식 (반드시 이 형식으로만 답변):
점수: [0~100 정수]
카테고리: [R&D/창업지원/수출지원/제조혁신/금융지원/기타 중 하나]
요약: [1~2문장 핵심 요약]
키워드: [쉼표로 구분된 3~5개 키워드]"""

    # 1차: 로컬 Gemma 모델 시도
    try:
        from agent.model_router import run_local, TaskType
        result = await run_local(prompt=prompt, task=TaskType.CLASSIFY, max_tokens=256)
        if result:
            return _parse_ai_response(result, announcement)
    except Exception as exc:
        logger.warning("local_model_scoring_failed", error=str(exc))

    # 2차: GPT-4o-mini fallback
    try:
        from openai import AsyncOpenAI
        from core.config import settings

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        resp = await client.chat.completions.create(
            model=settings.fast_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=256,
            temperature=0.1,
        )
        result = resp.choices[0].message.content or ""
        if result:
            logger.info("cloud_scoring_success", title=title[:40])
            return _parse_ai_response(result, announcement)
    except Exception as exc:
        logger.warning("cloud_scoring_failed", error=str(exc))

    # 최종 fallback: 기본값
    return {
        **announcement,
        "score": 50,
        "summary": announcement.get("raw_content", "")[:200],
        "keywords": [],
    }


def _parse_ai_response(text: str, base: dict) -> dict[str, Any]:
    """AI 응답에서 점수/카테고리/요약/키워드를 파싱한다."""
    score = 50
    summary = ""
    keywords: list[str] = []
    category = base.get("category", "")

    for line in text.strip().splitlines():
        line = line.strip()
        if line.startswith("점수:"):
            try:
                score = int("".join(c for c in line.split(":", 1)[1] if c.isdigit())[:3])
                score = max(0, min(100, score))
            except (ValueError, IndexError):
                pass
        elif line.startswith("카테고리:"):
            category = line.split(":", 1)[1].strip()
        elif line.startswith("요약:"):
            summary = line.split(":", 1)[1].strip()
        elif line.startswith("키워드:"):
            kw_text = line.split(":", 1)[1].strip()
            keywords = [k.strip() for k in kw_text.split(",") if k.strip()]

    return {
        **base,
        "score": score,
        "summary": summary or base.get("raw_content", "")[:200],
        "keywords": keywords,
        "category": category or base.get("category", ""),
    }


async def collect_and_store(api_key: str, count: int = 30) -> int:
    """공고를 수집하고 Supabase에 저장한다.

    Returns:
        새로 저장된 공고 수
    """
    from supabase import create_client
    from core.config import settings

    items = await fetch_announcements(api_key, count)
    if not items:
        return 0

    client = create_client(settings.supabase_url, settings.supabase_service_key)

    # 기존 external_id로 중복 확인
    existing = client.table("announcements").select("external_id").execute()
    existing_ids = {row["external_id"] for row in (existing.data or [])}

    new_items = [item for item in items if item["external_id"] not in existing_ids]
    logger.info("new_announcements_found", total=len(items), new=len(new_items))

    saved = 0
    for item in new_items:
        # AI 점수/요약 생성
        enriched = await score_and_summarize(item)

        row = {
            "title": enriched["title"],
            "org": enriched["org"],
            "category": enriched.get("category", ""),
            "summary": enriched.get("summary", ""),
            "deadline": str(enriched["deadline"]) if enriched.get("deadline") else None,
            "fund": enriched.get("fund", ""),
            "keywords": enriched.get("keywords", []),
            "score": enriched.get("score", 50),
            "source_url": enriched.get("source_url", ""),
            "raw_content": enriched.get("raw_content", ""),
            "source": enriched.get("source", "bizinfo"),
            "external_id": enriched.get("external_id", ""),
            "is_new": True,
            "status": "active",
        }

        try:
            client.table("announcements").insert(row).execute()
            saved += 1
        except Exception as exc:
            logger.warning("announcement_insert_failed", title=row["title"][:40], error=str(exc))

    logger.info("announcements_saved", count=saved)
    return saved
