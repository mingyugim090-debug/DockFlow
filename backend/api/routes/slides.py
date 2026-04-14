from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import Literal, Any, AsyncGenerator
import uuid
import asyncio
import json
from pathlib import Path

from core.config import settings
from slides.engine import (
    render_slide, create_deck, save_slide,
    load_slide, list_slides, update_slide
)
from slides.export import export_to_pdf, export_to_pptx
from agent.orchestrator import DocumentOrchestrator
from agent.tools.slide_tool import SLIDE_PLAN_TOOL, SLIDE_REWRITE_TOOL
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/slides", tags=["slides"])

# SLIDES_DIR = settings.output_dir / "slides" # We define this in slides.engine instead or here. Actually, let's use the one from config if possible.
# In original implementation SLIDES_DIR was created here.
_LOCAL_SLIDES_DIR = settings.output_dir / "slides"
_LOCAL_SLIDES_DIR.mkdir(parents=True, exist_ok=True)

# ── 요청/응답 모델 ──

class GenerateRequest(BaseModel):
    topic: str = Field(..., description="발표 주제 또는 원본 내용")
    slide_count: int = Field(default=8, ge=3, le=20)
    theme: Literal["modern_dark","executive","minimal","government"] = "modern_dark"
    context: dict[str, Any] = Field(default_factory=dict)

class RewriteRequest(BaseModel):
    slide_index: int
    element_path: str   = Field(..., description="CSS selector")
    original_html: str
    instruction: str

class ExportRequest(BaseModel):
    format: Literal["pdf", "pptx", "both"] = "pptx"


# ── 엔드포인트 ──

@router.post("/generate")
async def generate_deck(req: GenerateRequest):
    """주제 입력 → AI가 슬라이드 구조 설계 → HTML 파일 생성"""

    deck_id = str(uuid.uuid4())
    deck_path = create_deck(deck_id, _LOCAL_SLIDES_DIR)

    system_prompt = f"""당신은 프레젠테이션 전문가입니다.
사용자의 요청을 분석하여 {req.slide_count}장의 슬라이드 구조를 설계하고
각 슬라이드를 HTML로 생성해주세요.

규칙:
- 첫 슬라이드는 반드시 cover 레이아웃
- 마지막 슬라이드는 결론/마무리
- 테마: {req.theme}
- 내용은 한국어로 작성
- 각 슬라이드 불릿은 3-5개, 간결하고 핵심만"""

    orch = DocumentOrchestrator()
    result = await orch.run(
        instruction=req.topic,
        tools=[SLIDE_PLAN_TOOL],
        system_prompt=system_prompt,
        context=req.context,
    )

    # plan_slides 툴 결과에서 슬라이드 데이터 추출
    plan = result.get("tool_results", {}).get("plan_slides", {})
    slides_data = plan.get("slides", [])
    total = len(slides_data)

    generated = []
    for slide in slides_data:
        html = render_slide(
            layout=slide["layout"],
            slide_data=slide,
            theme_name=req.theme,
            slide_index=slide["index"],
            total_slides=total,
            deck_title=plan.get("deck_title", ""),
        )
        save_slide(deck_path, slide["index"], html)
        generated.append({
            "index": slide["index"],
            "layout": slide["layout"],
            "title": slide["title"],
        })

    return {
        "deck_id": deck_id,
        "deck_title": plan.get("deck_title", ""),
        "theme": req.theme,
        "slide_count": total,
        "slides": generated,
    }


@router.post("/generate/stream")
async def generate_deck_stream(req: GenerateRequest):
    """슬라이드 생성 진행률을 SSE로 실시간 전송 (6단계 세분화)"""

    async def event_gen() -> AsyncGenerator[str, None]:
        def sse(data: dict) -> str:
            return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

        deck_id = str(uuid.uuid4())
        deck_path = create_deck(deck_id, _LOCAL_SLIDES_DIR)

        # ── 1단계: 시작 ──
        yield sse({"type": "stage", "stage": 1, "total_stages": 6,
                   "message": "🔍 요청 분석 중...", "percent": 5})
        await asyncio.sleep(0)

        # ── 2단계: RAG 요약 (로컬 Gemma 사용) ──
        rag_summary = ""
        if req.context.get("upload_id") or req.context.get("retrieved_chunks"):
            yield sse({"type": "stage", "stage": 2, "total_stages": 6,
                       "message": "📄 참조 문서 분석 중... (Local AI)", "percent": 15,
                       "model": "gemma4:e4b (local)"})
            await asyncio.sleep(0)
            try:
                from agent.model_router import run_local, TaskType
                raw_ctx = req.context.get("retrieved_chunks", req.context.get("extracted_text", ""))
                if raw_ctx:
                    rag_summary = await run_local(
                        prompt=f"다음 문서의 핵심 내용을 3줄로 요약해줘:\n\n{raw_ctx[:3000]}",
                        task=TaskType.SUMMARIZE,
                        max_tokens=512,
                    )
                    if rag_summary:
                        req.context["rag_summary"] = rag_summary
                        logger.info("rag_summary_done", chars=len(rag_summary))
            except Exception as exc:
                logger.warning("rag_summary_skipped", error=str(exc))
        else:
            yield sse({"type": "stage", "stage": 2, "total_stages": 6,
                       "message": "✅ 2단계 건너뜀 (첨부 파일 없음)", "percent": 15})
            await asyncio.sleep(0)

        # ── 3단계: AI 구조 설계 (클라우드) ──
        yield sse({"type": "stage", "stage": 3, "total_stages": 6,
                   "message": "🎨 슬라이드 구조 설계 중... (Cloud AI)", "percent": 20,
                   "model": "gpt-4o (cloud)"})
        await asyncio.sleep(0)

        system_prompt = (
            f"당신은 프레젠테이션 전문가입니다.\n"
            f"사용자의 요청을 분석하여 {req.slide_count}장의 슬라이드 구조를 설계하고\n"
            f"각 슬라이드를 HTML로 생성해주세요.\n\n"
            f"규칙:\n"
            f"- 첫 슬라이드는 반드시 cover 레이아웃\n"
            f"- 마지막 슬라이드는 결론/마무리\n"
            f"- 테마: {req.theme}\n"
            f"- 내용은 한국어로 작성\n"
            f"- 각 슬라이드 불릿은 3-5개, 간결하고 핵심만"
        )

        try:
            orch = DocumentOrchestrator()
            result = await orch.run(
                instruction=req.topic,
                tools=[SLIDE_PLAN_TOOL],
                system_prompt=system_prompt,
                context=req.context,
                task_type="slide_design",
            )
        except Exception as e:
            yield sse({"type": "error", "message": f"AI 호출 실패: {str(e)}"})
            return

        plan = result.get("tool_results", {}).get("plan_slides", {})
        slides_data = plan.get("slides", [])
        total = len(slides_data)

        if not slides_data:
            yield sse({"type": "error", "message": "슬라이드 계획 수립에 실패했습니다."})
            return

        # ── 4단계: 구조 확정 ──
        yield sse({"type": "stage", "stage": 4, "total_stages": 6,
                   "message": f"✅ {total}장 구조 확정. 렌더링 시작...", "percent": 35})
        await asyncio.sleep(0)

        # ── 5단계: 슬라이드별 렌더링 ──
        generated = []
        for i, slide in enumerate(slides_data):
            html = render_slide(
                layout=slide["layout"],
                slide_data=slide,
                theme_name=req.theme,
                slide_index=slide["index"],
                total_slides=total,
                deck_title=plan.get("deck_title", ""),
            )
            save_slide(deck_path, slide["index"], html)
            generated.append({
                "index": slide["index"],
                "layout": slide["layout"],
                "title": slide["title"],
            })
            percent = 35 + int((i + 1) / total * 55)
            yield sse({
                "type": "slide_done",
                "stage": 5,
                "current": i + 1,
                "total": total,
                "title": slide["title"],
                "layout": slide["layout"],
                "percent": percent,
            })
            await asyncio.sleep(0)

        # ── 6단계: 완료 ──
        yield sse({
            "type": "complete",
            "stage": 6,
            "deck_id": deck_id,
            "deck_title": plan.get("deck_title", ""),
            "theme": req.theme,
            "slide_count": total,
            "slides": generated,
            "percent": 100,
            "message": "🎉 프레젠테이션 완성!",
        })

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/{deck_id}/slides/{index}/html")
async def get_slide_html(deck_id: str, index: int):
    """슬라이드 HTML 반환 (에디터 iframe용)"""
    deck_path = _LOCAL_SLIDES_DIR / deck_id
    if not deck_path.exists():
        raise HTTPException(status_code=404, detail="덱을 찾을 수 없습니다")

    html = load_slide(deck_path, index)
    # 에디터 클릭 감지 스크립트 주입
    editor_script = """
<script>
document.addEventListener('click', function(e) {
  e.preventDefault();
  e.stopPropagation();
  var el = e.target;
  var rect = el.getBoundingClientRect();
  window.parent.postMessage({
    type: 'ELEMENT_SELECTED',
    bbox: {
      x: rect.left, y: rect.top,
      width: rect.width, height: rect.height,
      elementPath: getSelector(el),
      outerHTML: el.outerHTML,
      tagName: el.tagName.toLowerCase(),
      textContent: el.textContent.trim().substring(0, 100)
    }
  }, '*');
});

function getSelector(el) {
  if (el.id) return '#' + el.id;
  if (el === document.body) return 'body';
  var idx = Array.from(el.parentNode.children).indexOf(el) + 1;
  return getSelector(el.parentNode) + ' > ' + el.tagName.toLowerCase() + ':nth-child(' + idx + ')';
}

window.addEventListener('message', function(e) {
  if (e.data.type === 'UPDATE_ELEMENT') {
    try {
      var el = document.querySelector(e.data.path);
      if (el) el.outerHTML = e.data.html;
      window.parent.postMessage({ type: 'UPDATE_DONE' }, '*');
    } catch(err) {
      window.parent.postMessage({ type: 'UPDATE_ERROR', error: err.message }, '*');
    }
  }
});
</script>
"""
    injected = html.replace("</body>", editor_script + "</body>")
    return HTMLResponse(content=injected)


@router.patch("/{deck_id}/slides/{index}/rewrite")
async def rewrite_element(deck_id: str, index: int, req: RewriteRequest):
    """선택된 요소를 AI가 수정하여 반환"""
    deck_path = _LOCAL_SLIDES_DIR / deck_id
    full_html = load_slide(deck_path, index)

    orch = DocumentOrchestrator()
    result = await orch.run(
        instruction=f"""다음 HTML 요소를 지시에 따라 수정해줘.
원본 HTML:
{req.original_html}

수정 지시:
{req.instruction}

규칙:
- 원본 HTML의 구조와 클래스명을 최대한 유지
- 내용과 스타일만 수정
- 수정된 HTML만 반환, 설명 없이
- 반드시 유효한 HTML""",
        tools=[SLIDE_REWRITE_TOOL],
        context={"context_html": full_html[:2000]},
    )

    new_html = result.get("message", req.original_html)
    return {"new_html": new_html, "element_path": req.element_path}


@router.patch("/{deck_id}/slides/{index}/save")
async def save_slide_changes(deck_id: str, index: int, body: dict):
    """편집된 슬라이드 HTML 저장"""
    deck_path = _LOCAL_SLIDES_DIR / deck_id
    html = body.get("html", "")
    if not html:
        raise HTTPException(status_code=400, detail="html 필드가 비어있습니다")
    update_slide(deck_path, index, html)
    return {"status": "saved"}


@router.post("/{deck_id}/export")
async def export_deck(deck_id: str, req: ExportRequest, bg: BackgroundTasks):
    """전체 슬라이드를 PDF 또는 PPTX로 내보내기"""
    deck_path = _LOCAL_SLIDES_DIR / deck_id
    if not deck_path.exists():
        raise HTTPException(status_code=404, detail="덱을 찾을 수 없습니다")

    export_id = str(uuid.uuid4())
    output_dir = settings.output_dir / "exports"
    
    async def do_export():
        if req.format in ["pdf", "both"]:
            await export_to_pdf(deck_path, output_dir / f"{export_id}.pdf")
        if req.format in ["pptx", "both"]:
            await export_to_pptx(deck_path, output_dir / f"{export_id}.pptx")

    bg.add_task(do_export)
    return {
        "export_id": export_id,
        "status": "processing",
        "download_urls": {
            k: f"/api/slides/exports/{export_id}.{k}"
            for k in (["pdf","pptx"] if req.format == "both" else [req.format])
        }
    }


@router.get("/exports/{filename}")
async def download_export(filename: str):
    path = settings.output_dir / "exports" / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="파일이 없거나 아직 처리 중입니다")
    return FileResponse(path, filename=filename)


@router.get("/{deck_id}")
async def get_deck_info(deck_id: str):
    deck_path = _LOCAL_SLIDES_DIR / deck_id
    if not deck_path.exists():
        raise HTTPException(status_code=404, detail="덱을 찾을 수 없습니다")
    slides = list_slides(deck_path)
    return {
        "deck_id": deck_id,
        "slide_count": len(slides),
        "slides": [{"index": i+1, "filename": s.name} for i, s in enumerate(slides)]
    }
