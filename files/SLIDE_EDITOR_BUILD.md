# SLIDE_EDITOR_BUILD.md
# DockFlow AI — AI 슬라이드 에디터 구현 명령서
# Claude Code 전용

> 이 파일을 Claude Code에 읽히고 "SLIDE_EDITOR_BUILD.md를 읽고 순서대로 구현해줘"라고 입력한다.
> 각 Phase는 독립적으로 완료 확인 후 다음으로 넘어간다.

---

## 프로젝트 컨텍스트

- 기존 프로젝트: DockFlow AI (FastAPI 백엔드 + Next.js 14 프론트엔드)
- 구현 목표: slides-grab 방식의 AI 슬라이드 에디터
- 핵심 원리: PPTX 직접 생성 X → HTML 중간 포맷 → 브라우저 시각 편집 → Playwright 내보내기
- 기존 CLAUDE.md, ARCHITECTURE.md 규칙을 모두 따른다

---

## 전체 구현 순서

```
Phase 1 → HTML 슬라이드 생성 엔진      (백엔드)
Phase 2 → API 엔드포인트               (백엔드)
Phase 3 → Playwright 내보내기          (백엔드)
Phase 4 → 비주얼 에디터 UI             (프론트엔드)
Phase 5 → 슬라이드 관리 페이지         (프론트엔드)
Phase 6 → 통합 테스트
```

---

## Phase 1 — HTML 슬라이드 생성 엔진

### 1-1. 의존성 추가

```bash
cd backend
uv add playwright jinja2 pypdf2 pillow
uv run playwright install chromium
```

### 1-2. 디렉토리 생성

```
backend/
  slides/
    __init__.py
    engine.py          ← HTML 슬라이드 생성 핵심 로직
    templates/         ← 레이아웃별 Jinja2 HTML 템플릿
      base.html
      cover.html
      content.html
      two_col.html
      chart.html
      quote.html
    themes/            ← 색상/폰트 테마 JSON
      modern_dark.json
      executive.json
      minimal.json
      government.json  ← 정부 제안서 전용
    export.py          ← Playwright PDF/PPTX 내보내기
    validator.py       ← 슬라이드 HTML 유효성 검사
```

### 1-3. 테마 JSON 생성

`backend/slides/themes/modern_dark.json`:
```json
{
  "name": "modern_dark",
  "bg": "#0a0a0f",
  "surface": "#13131f",
  "text_primary": "#f0f0ff",
  "text_secondary": "rgba(240,240,255,0.55)",
  "accent": "#8b5cf6",
  "accent_2": "#3b82f6",
  "border": "rgba(255,255,255,0.08)",
  "font_head": "Syne, sans-serif",
  "font_body": "Noto Sans KR, sans-serif",
  "font_import": "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Noto+Sans+KR:wght@300;400;500&display=swap"
}
```

`backend/slides/themes/government.json`:
```json
{
  "name": "government",
  "bg": "#ffffff",
  "surface": "#f8f9fa",
  "text_primary": "#1a1a2e",
  "text_secondary": "#555577",
  "accent": "#003087",
  "accent_2": "#c8102e",
  "border": "rgba(0,0,0,0.1)",
  "font_head": "Noto Sans KR, sans-serif",
  "font_body": "Noto Sans KR, sans-serif",
  "font_import": "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
}
```

`backend/slides/themes/executive.json`:
```json
{
  "name": "executive",
  "bg": "#1a1a2e",
  "surface": "#16213e",
  "text_primary": "#eaeaf8",
  "text_secondary": "rgba(234,234,248,0.6)",
  "accent": "#e8c56d",
  "accent_2": "#c084fc",
  "border": "rgba(255,255,255,0.1)",
  "font_head": "Cormorant Garamond, serif",
  "font_body": "Noto Sans KR, sans-serif",
  "font_import": "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&family=Noto+Sans+KR:wght@300;400&display=swap"
}
```

`backend/slides/themes/minimal.json`:
```json
{
  "name": "minimal",
  "bg": "#fafafa",
  "surface": "#ffffff",
  "text_primary": "#111111",
  "text_secondary": "#666666",
  "accent": "#111111",
  "accent_2": "#888888",
  "border": "rgba(0,0,0,0.08)",
  "font_head": "Pretendard, sans-serif",
  "font_body": "Pretendard, sans-serif",
  "font_import": "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
}
```

### 1-4. base.html 템플릿 생성

`backend/slides/templates/base.html`:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=1280"/>
<title>{{ slide_title }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="{{ theme.font_import }}" rel="stylesheet"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:       {{ theme.bg }};
    --surface:  {{ theme.surface }};
    --text-1:   {{ theme.text_primary }};
    --text-2:   {{ theme.text_secondary }};
    --accent:   {{ theme.accent }};
    --accent-2: {{ theme.accent_2 }};
    --border:   {{ theme.border }};
    --font-h:   {{ theme.font_head }};
    --font-b:   {{ theme.font_body }};
  }
  html, body {
    width: 1280px; height: 720px;
    overflow: hidden;
    background: var(--bg);
    color: var(--text-1);
    font-family: var(--font-b);
    -webkit-font-smoothing: antialiased;
  }
  .slide {
    width: 1280px; height: 720px;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  /* 슬라이드 번호 */
  .slide-num {
    position: absolute;
    bottom: 24px; right: 32px;
    font-size: 11px;
    color: var(--text-2);
    letter-spacing: 1px;
    font-family: var(--font-b);
  }
  /* 로고 영역 */
  .slide-logo {
    position: absolute;
    bottom: 20px; left: 32px;
    font-size: 12px;
    color: var(--text-2);
    letter-spacing: 2px;
    font-family: var(--font-h);
  }
  {% block extra_styles %}{% endblock %}
</style>
</head>
<body>
<div class="slide" id="slide-root">
  {% block content %}{% endblock %}
  <div class="slide-logo">{{ deck_title }}</div>
  <div class="slide-num">{{ slide_index }} / {{ total_slides }}</div>
</div>
</body>
</html>
```

### 1-5. cover.html 템플릿 생성

`backend/slides/templates/cover.html`:
```html
{% extends "base.html" %}
{% block extra_styles %}
.cover {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  justify-content: center; align-items: flex-start;
  padding: 80px 100px;
  position: relative;
}
.cover-accent-line {
  width: 64px; height: 4px;
  background: var(--accent);
  margin-bottom: 32px;
  border-radius: 2px;
}
.cover-title {
  font-family: var(--font-h);
  font-size: 56px;
  font-weight: 800;
  letter-spacing: -2px;
  line-height: 1.1;
  color: var(--text-1);
  margin-bottom: 24px;
  max-width: 800px;
}
.cover-subtitle {
  font-size: 20px;
  font-weight: 300;
  color: var(--text-2);
  line-height: 1.6;
  max-width: 600px;
  margin-bottom: 48px;
}
.cover-meta {
  display: flex; gap: 32px;
  font-size: 13px;
  color: var(--text-2);
  letter-spacing: 1px;
}
.cover-meta-item {
  display: flex; flex-direction: column; gap: 4px;
}
.cover-meta-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--accent);
}
.cover-bg-shape {
  position: absolute;
  right: -100px; top: -100px;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.04;
}
{% endblock %}
{% block content %}
<div class="cover">
  <div class="cover-bg-shape"></div>
  <div class="cover-accent-line"></div>
  <h1 class="cover-title">{{ title }}</h1>
  <p class="cover-subtitle">{{ subtitle }}</p>
  <div class="cover-meta">
    {% for item in meta_items %}
    <div class="cover-meta-item">
      <span class="cover-meta-label">{{ item.label }}</span>
      <span>{{ item.value }}</span>
    </div>
    {% endfor %}
  </div>
</div>
{% endblock %}
```

### 1-6. content.html 템플릿 생성

`backend/slides/templates/content.html`:
```html
{% extends "base.html" %}
{% block extra_styles %}
.content-slide {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  padding: 60px 80px;
}
.content-eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--accent);
  margin-bottom: 16px;
}
.content-title {
  font-family: var(--font-h);
  font-size: 40px;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.15;
  color: var(--text-1);
  margin-bottom: 40px;
}
.content-title-line {
  width: 48px; height: 3px;
  background: var(--accent);
  margin: 16px 0 32px;
  border-radius: 2px;
}
.bullets {
  display: flex; flex-direction: column; gap: 16px;
  flex: 1;
}
.bullet-item {
  display: flex; align-items: flex-start; gap: 16px;
  font-size: 18px;
  color: var(--text-1);
  line-height: 1.6;
}
.bullet-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  margin-top: 10px;
  flex-shrink: 0;
}
.bullet-sub {
  font-size: 14px;
  color: var(--text-2);
  margin-top: 4px;
  line-height: 1.5;
}
{% endblock %}
{% block content %}
<div class="content-slide">
  {% if eyebrow %}<div class="content-eyebrow">{{ eyebrow }}</div>{% endif %}
  <h2 class="content-title">{{ title }}</h2>
  <div class="content-title-line"></div>
  <div class="bullets">
    {% for bullet in bullets %}
    <div class="bullet-item">
      <div class="bullet-dot"></div>
      <div>
        <div>{{ bullet.text }}</div>
        {% if bullet.sub %}<div class="bullet-sub">{{ bullet.sub }}</div>{% endif %}
      </div>
    </div>
    {% endfor %}
  </div>
</div>
{% endblock %}
```

### 1-7. two_col.html 템플릿 생성

`backend/slides/templates/two_col.html`:
```html
{% extends "base.html" %}
{% block extra_styles %}
.two-col-slide {
  width: 100%; height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
}
.two-col-header {
  grid-column: 1 / -1;
  padding: 48px 80px 32px;
  border-bottom: 1px solid var(--border);
}
.two-col-title {
  font-family: var(--font-h);
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -1px;
  color: var(--text-1);
}
.col-body {
  padding: 36px 60px;
  display: flex; flex-direction: column; gap: 16px;
}
.col-body:first-of-type { border-right: 1px solid var(--border); }
.col-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--accent);
  margin-bottom: 8px;
}
.col-item {
  font-size: 16px;
  color: var(--text-1);
  line-height: 1.6;
  padding-left: 16px;
  border-left: 2px solid var(--border);
}
{% endblock %}
{% block content %}
<div class="two-col-slide">
  <div class="two-col-header">
    <h2 class="two-col-title">{{ title }}</h2>
  </div>
  <div class="col-body">
    <div class="col-label">{{ left.label }}</div>
    {% for item in left.items %}
    <div class="col-item">{{ item }}</div>
    {% endfor %}
  </div>
  <div class="col-body">
    <div class="col-label">{{ right.label }}</div>
    {% for item in right.items %}
    <div class="col-item">{{ item }}</div>
    {% endfor %}
  </div>
</div>
{% endblock %}
```

### 1-8. engine.py 구현

`backend/slides/engine.py`:
```python
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
import json
import uuid

TEMPLATES_DIR = Path(__file__).parent / "templates"
THEMES_DIR    = Path(__file__).parent / "themes"

env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))

def load_theme(theme_name: str) -> dict:
    path = THEMES_DIR / f"{theme_name}.json"
    if not path.exists():
        path = THEMES_DIR / "modern_dark.json"
    return json.loads(path.read_text())

def render_slide(
    layout: str,
    slide_data: dict,
    theme_name: str = "modern_dark",
    slide_index: int = 1,
    total_slides: int = 1,
    deck_title: str = "",
) -> str:
    """슬라이드 하나를 완전 독립 HTML 문자열로 렌더링"""
    theme = load_theme(theme_name)
    template = env.get_template(f"{layout}.html")
    return template.render(
        theme=theme,
        slide_index=slide_index,
        total_slides=total_slides,
        deck_title=deck_title,
        **slide_data,
    )

def create_deck(deck_id: str, slides_dir: Path) -> Path:
    """덱 디렉토리 생성"""
    deck_path = slides_dir / deck_id
    deck_path.mkdir(parents=True, exist_ok=True)
    return deck_path

def save_slide(deck_path: Path, index: int, html: str) -> Path:
    """슬라이드 HTML 파일 저장"""
    slide_path = deck_path / f"slide-{index:02d}.html"
    slide_path.write_text(html, encoding="utf-8")
    return slide_path

def load_slide(deck_path: Path, index: int) -> str:
    slide_path = deck_path / f"slide-{index:02d}.html"
    return slide_path.read_text(encoding="utf-8")

def list_slides(deck_path: Path) -> list[Path]:
    return sorted(deck_path.glob("slide-*.html"))

def update_slide(deck_path: Path, index: int, html: str) -> None:
    slide_path = deck_path / f"slide-{index:02d}.html"
    slide_path.write_text(html, encoding="utf-8")
```

### 1-9. Claude Tool 정의

`backend/agent/tools/slide_tool.py`:
```python
SLIDE_PLAN_TOOL = {
    "name": "plan_slides",
    "description": (
        "프레젠테이션 전체 구조를 설계합니다. "
        "각 슬라이드의 레이아웃, 제목, 핵심 내용을 결정합니다. "
        "공모전 지원서, 사업계획서, 시장 분석 보고서에 적합합니다."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "deck_title": {"type": "string", "description": "전체 프레젠테이션 제목"},
            "theme": {
                "type": "string",
                "enum": ["modern_dark", "executive", "minimal", "government"],
                "description": "디자인 테마. 정부 제안서는 government, 기업 발표는 executive"
            },
            "slides": {
                "type": "array",
                "description": "슬라이드 목록",
                "items": {
                    "type": "object",
                    "properties": {
                        "index":  {"type": "integer"},
                        "layout": {
                            "type": "string",
                            "enum": ["cover", "content", "two_col", "quote", "chart"],
                            "description": "cover=표지, content=불릿, two_col=2단, quote=인용구, chart=차트"
                        },
                        "title":    {"type": "string"},
                        "subtitle": {"type": "string", "description": "cover 레이아웃에서 사용"},
                        "eyebrow":  {"type": "string", "description": "슬라이드 상단 소제목"},
                        "bullets": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "text": {"type": "string"},
                                    "sub":  {"type": "string", "description": "보조 설명 (선택)"}
                                }
                            }
                        },
                        "left":  {"type": "object", "description": "two_col 왼쪽"},
                        "right": {"type": "object", "description": "two_col 오른쪽"},
                        "notes": {"type": "string", "description": "발표자 노트"}
                    },
                    "required": ["index", "layout", "title"]
                }
            }
        },
        "required": ["deck_title", "theme", "slides"]
    }
}

SLIDE_REWRITE_TOOL = {
    "name": "rewrite_slide_element",
    "description": (
        "슬라이드 HTML에서 특정 요소를 수정합니다. "
        "사용자가 클릭한 요소의 HTML을 받아 새 버전으로 재작성합니다."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "original_html":  {"type": "string", "description": "수정 전 요소 HTML"},
            "instruction":    {"type": "string", "description": "수정 지시사항"},
            "context_html":   {"type": "string", "description": "슬라이드 전체 HTML (맥락 파악용)"},
            "theme_name":     {"type": "string", "description": "현재 테마명"}
        },
        "required": ["original_html", "instruction"]
    }
}
```

---

## Phase 2 — API 엔드포인트

`backend/api/routes/slides.py` 파일을 새로 생성한다.

```python
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Literal, Any
import uuid
import asyncio
from pathlib import Path

from core.config import settings
from slides.engine import (
    render_slide, create_deck, save_slide,
    load_slide, list_slides, update_slide
)
from slides.export import export_to_pdf, export_to_pptx
from agent.orchestrator import DocumentOrchestrator
from agent.tools.slide_tool import SLIDE_PLAN_TOOL, SLIDE_REWRITE_TOOL

router = APIRouter(prefix="/api/slides", tags=["slides"])

SLIDES_DIR = settings.output_dir / "slides"
SLIDES_DIR.mkdir(parents=True, exist_ok=True)


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
    deck_path = create_deck(deck_id, SLIDES_DIR)

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


@router.get("/{deck_id}/slides/{index}/html")
async def get_slide_html(deck_id: str, index: int):
    """슬라이드 HTML 반환 (에디터 iframe용)"""
    deck_path = SLIDES_DIR / deck_id
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
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=injected)


@router.patch("/{deck_id}/slides/{index}/rewrite")
async def rewrite_element(deck_id: str, index: int, req: RewriteRequest):
    """선택된 요소를 AI가 수정하여 반환"""
    deck_path = SLIDES_DIR / deck_id
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
    deck_path = SLIDES_DIR / deck_id
    html = body.get("html", "")
    if not html:
        raise HTTPException(status_code=400, detail="html 필드가 비어있습니다")
    update_slide(deck_path, index, html)
    return {"status": "saved"}


@router.post("/{deck_id}/export")
async def export_deck(deck_id: str, req: ExportRequest, bg: BackgroundTasks):
    """전체 슬라이드를 PDF 또는 PPTX로 내보내기"""
    deck_path = SLIDES_DIR / deck_id
    if not deck_path.exists():
        raise HTTPException(status_code=404, detail="덱을 찾을 수 없습니다")

    export_id = str(uuid.uuid4())
    output_dir = settings.output_dir / "exports"
    output_dir.mkdir(parents=True, exist_ok=True)

    async def do_export():
        if req.format in ("pdf", "both"):
            await export_to_pdf(deck_path, output_dir / f"{export_id}.pdf")
        if req.format in ("pptx", "both"):
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
    deck_path = SLIDES_DIR / deck_id
    if not deck_path.exists():
        raise HTTPException(status_code=404, detail="덱을 찾을 수 없습니다")
    slides = list_slides(deck_path)
    return {
        "deck_id": deck_id,
        "slide_count": len(slides),
        "slides": [{"index": i+1, "filename": s.name} for i, s in enumerate(slides)]
    }
```

`backend/main.py`에 라우터 등록:
```python
from api.routes.slides import router as slides_router
app.include_router(slides_router)
```

---

## Phase 3 — Playwright 내보내기 엔진

`backend/slides/export.py`:
```python
from playwright.async_api import async_playwright
from pathlib import Path
import io
import asyncio

async def export_to_pdf(slides_dir: Path, output_path: Path) -> None:
    """HTML 슬라이드 목록을 단일 PDF로 병합"""
    from pypdf import PdfWriter

    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--no-sandbox"])
        page = await browser.new_page(
            viewport={"width": 1280, "height": 720}
        )

        writer = PdfWriter()
        slide_files = sorted(slides_dir.glob("slide-*.html"))

        for slide_file in slide_files:
            await page.goto(
                f"file://{slide_file.absolute()}",
                wait_until="networkidle",
                timeout=15000,
            )
            await page.wait_for_timeout(300)

            pdf_bytes = await page.pdf(
                width="1280px",
                height="720px",
                print_background=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            )

            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(pdf_bytes))
            for pdf_page in reader.pages:
                writer.add_page(pdf_page)

        await browser.close()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        writer.write(f)


async def export_to_pptx(slides_dir: Path, output_path: Path) -> None:
    """HTML 슬라이드를 스크린샷으로 캡처해 PPTX 생성"""
    from pptx import Presentation
    from pptx.util import Inches

    prs = Presentation()
    prs.slide_width  = Inches(13.33)
    prs.slide_height = Inches(7.5)

    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--no-sandbox"])
        page = await browser.new_page(
            viewport={"width": 1280, "height": 720}
        )

        slide_files = sorted(slides_dir.glob("slide-*.html"))

        for slide_file in slide_files:
            await page.goto(
                f"file://{slide_file.absolute()}",
                wait_until="networkidle",
                timeout=15000,
            )
            await page.wait_for_timeout(400)

            screenshot = await page.screenshot(
                full_page=False,
                type="png",
                clip={"x": 0, "y": 0, "width": 1280, "height": 720},
            )

            blank = prs.slide_layouts[6]
            slide = prs.slides.add_slide(blank)
            slide.shapes.add_picture(
                io.BytesIO(screenshot),
                left=0, top=0,
                width=prs.slide_width,
                height=prs.slide_height,
            )

        await browser.close()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(output_path))
```

---

## Phase 4 — 비주얼 에디터 UI

### 4-1. 컴포넌트 파일 생성

```
frontend/
  app/
    slides/
      [deckId]/
        page.tsx         ← 에디터 메인 페이지
  components/
    slides/
      SlideEditor.tsx    ← iframe + bbox 오버레이 (핵심)
      SlidePanel.tsx     ← 우측 수정 패널
      SlideThumbnails.tsx ← 좌측 썸네일 목록
      ExportButton.tsx   ← 내보내기 버튼
      GenerateModal.tsx  ← 슬라이드 생성 모달
```

### 4-2. SlideEditor.tsx

`frontend/components/slides/SlideEditor.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
  elementPath: string;
  outerHTML: string;
  tagName: string;
  textContent: string;
}

interface SlideEditorProps {
  deckId: string;
  slideIndex: number;
  onElementSelect: (bbox: BBox | null) => void;
}

export default function SlideEditor({
  deckId,
  slideIndex,
  onElementSelect,
}: SlideEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBBox, setSelectedBBox] = useState<BBox | null>(null);
  const [iframeScale, setIframeScale] = useState(1);

  // iframe 크기에 따른 스케일 계산 (1280x720을 컨테이너에 맞춤)
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const scaleX = width / 1280;
      const scaleY = height / 720;
      setIframeScale(Math.min(scaleX, scaleY));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // iframe postMessage 수신
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data.type === "ELEMENT_SELECTED") {
        const bbox: BBox = {
          ...e.data.bbox,
          // 스케일 보정
          x: e.data.bbox.x * iframeScale,
          y: e.data.bbox.y * iframeScale,
          width:  e.data.bbox.width  * iframeScale,
          height: e.data.bbox.height * iframeScale,
        };
        setSelectedBBox(bbox);
        onElementSelect(bbox);
      }
      if (e.data.type === "UPDATE_DONE") {
        setSelectedBBox(null);
        onElementSelect(null);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [iframeScale, onElementSelect]);

  // 외부에서 요소 업데이트 요청
  const updateElement = useCallback((path: string, html: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "UPDATE_ELEMENT", path, html },
      "*"
    );
  }, []);

  // ref를 통해 외부로 노출
  useEffect(() => {
    (window as any).__slideEditorUpdate = updateElement;
  }, [updateElement]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        background: "#000",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* 슬라이드 iframe */}
      <iframe
        ref={iframeRef}
        src={`${process.env.NEXT_PUBLIC_API_URL}/api/slides/${deckId}/slides/${slideIndex}/html`}
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: 1280,
          height: 720,
          border: "none",
          transformOrigin: "top left",
          transform: `scale(${iframeScale})`,
        }}
        title={`Slide ${slideIndex}`}
      />

      {/* 선택 영역 bbox 오버레이 */}
      {selectedBBox && (
        <div
          style={{
            position: "absolute",
            left:   selectedBBox.x,
            top:    selectedBBox.y,
            width:  selectedBBox.width,
            height: selectedBBox.height,
            border: "2px solid #8b5cf6",
            background: "rgba(139,92,246,0.1)",
            borderRadius: 2,
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div style={{
            position: "absolute",
            top: -22,
            left: 0,
            background: "#8b5cf6",
            color: "#fff",
            fontSize: 10,
            padding: "2px 7px",
            borderRadius: "3px 3px 0 0",
            letterSpacing: 0.5,
            whiteSpace: "nowrap",
          }}>
            {selectedBBox.tagName} · {selectedBBox.textContent.substring(0, 20)}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4-3. SlidePanel.tsx

`frontend/components/slides/SlidePanel.tsx`:
```tsx
"use client";

import { useState } from "react";

interface BBox {
  elementPath: string;
  outerHTML: string;
  textContent: string;
}

interface SlidePanelProps {
  deckId: string;
  slideIndex: number;
  selectedBBox: BBox | null;
  onClearSelection: () => void;
}

export default function SlidePanel({
  deckId,
  slideIndex,
  selectedBBox,
  onClearSelection,
}: SlidePanelProps) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const QUICK_PROMPTS = [
    "글자 크기 키워줘",
    "색상을 강조색으로 바꿔줘",
    "내용을 더 간결하게",
    "굵게 만들어줘",
    "줄간격 넓혀줘",
  ];

  const handleRewrite = async (customInstruction?: string) => {
    if (!selectedBBox) return;
    const inst = customInstruction ?? instruction;
    if (!inst.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/slides/${deckId}/slides/${slideIndex}/rewrite`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slide_index: slideIndex,
            element_path: selectedBBox.elementPath,
            original_html: selectedBBox.outerHTML,
            instruction: inst,
          }),
        }
      );
      const data = await res.json();

      // SlideEditor에 업데이트 전달
      (window as any).__slideEditorUpdate?.(
        data.element_path,
        data.new_html
      );
      setInstruction("");
      onClearSelection();
    } catch (e) {
      setError("수정 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: 280,
      height: "100%",
      background: "#0e0e1a",
      borderLeft: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      flexDirection: "column",
      padding: 20,
      gap: 16,
    }}>
      {selectedBBox ? (
        <>
          {/* 선택된 요소 정보 */}
          <div style={{
            background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: 8,
            padding: "10px 12px",
          }}>
            <div style={{ fontSize: 10, color: "#a78bfa", letterSpacing: 1, marginBottom: 4 }}>
              선택된 요소
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              {selectedBBox.textContent || "(빈 요소)"}
            </div>
          </div>

          {/* 빠른 수정 버튼들 */}
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 8 }}>
              빠른 수정
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleRewrite(p)}
                  disabled={loading}
                  style={{
                    fontSize: 11,
                    padding: "5px 10px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 5,
                    color: "rgba(255,255,255,0.55)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 직접 지시 입력 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>
              수정 지시
            </div>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="예: 이 텍스트를 더 임팩트 있게 바꿔줘"
              rows={4}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: 12,
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                resize: "none",
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleRewrite();
                }
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: "#f87171" }}>{error}</div>
            )}
            <button
              onClick={() => handleRewrite()}
              disabled={loading || !instruction.trim()}
              style={{
                height: 40,
                background: loading ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg,#8b5cf6,#3b82f6)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "수정 중..." : "AI 수정 적용  ⌘↵"}
            </button>
          </div>

          <button
            onClick={onClearSelection}
            style={{
              height: 36,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 7,
              color: "rgba(255,255,255,0.4)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            선택 해제
          </button>
        </>
      ) : (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "rgba(255,255,255,0.2)",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          <div style={{ fontSize: 13, textAlign: "center", lineHeight: 1.6 }}>
            슬라이드에서 수정할<br/>요소를 클릭하세요
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4-4. 에디터 메인 페이지

`frontend/app/slides/[deckId]/page.tsx`:
```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import SlideEditor from "@/components/slides/SlideEditor";
import SlidePanel from "@/components/slides/SlidePanel";

export default function SlideEditorPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;

  const [deckInfo, setDeckInfo] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [selectedBBox, setSelectedBBox] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/slides/${deckId}`)
      .then((r) => r.json())
      .then(setDeckInfo);
  }, [deckId]);

  const handleExport = async (format: "pptx" | "pdf") => {
    setExporting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/slides/${deckId}/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format }),
        }
      );
      const { export_id, download_urls } = await res.json();

      // 폴링으로 완료 대기
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const url = download_urls[format];
      window.open(`${process.env.NEXT_PUBLIC_API_URL}${url}`, "_blank");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{
      height: "100vh",
      background: "#08080f",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* 상단 툴바 */}
      <div style={{
        height: 52,
        background: "#0e0e1a",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 12,
      }}>
        <button onClick={() => router.back()}
          style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}>
          ← 뒤로
        </button>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
          {deckInfo?.deck_title ?? "슬라이드 편집"}
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          {currentSlide} / {deckInfo?.slide_count ?? "?"}
        </span>
        <button
          onClick={() => handleExport("pptx")}
          disabled={exporting}
          style={{
            height: 34,
            padding: "0 18px",
            background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
            border: "none",
            borderRadius: 7,
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            cursor: exporting ? "not-allowed" : "pointer",
            opacity: exporting ? 0.6 : 1,
          }}
        >
          {exporting ? "내보내는 중..." : "PPTX 다운로드"}
        </button>
        <button
          onClick={() => handleExport("pdf")}
          disabled={exporting}
          style={{
            height: 34,
            padding: "0 18px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 7,
            color: "rgba(255,255,255,0.6)",
            fontSize: 13,
            cursor: exporting ? "not-allowed" : "pointer",
          }}
        >
          PDF
        </button>
      </div>

      {/* 메인 영역 */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* 좌측: 슬라이드 번호 목록 */}
        <div style={{
          width: 72,
          background: "#0b0b16",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          padding: "12px 8px",
          gap: 6,
          overflowY: "auto",
        }}>
          {Array.from({ length: deckInfo?.slide_count ?? 0 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setCurrentSlide(n)}
              style={{
                height: 40,
                width: "100%",
                background: currentSlide === n ? "rgba(139,92,246,0.2)" : "transparent",
                border: currentSlide === n ? "1px solid rgba(139,92,246,0.4)" : "1px solid transparent",
                borderRadius: 6,
                color: currentSlide === n ? "#c4b5fd" : "rgba(255,255,255,0.3)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* 가운데: 슬라이드 캔버스 */}
        <div style={{
          flex: 1,
          padding: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08080f",
        }}>
          <div style={{ width: "100%", maxWidth: 900 }}>
            <SlideEditor
              deckId={deckId}
              slideIndex={currentSlide}
              onElementSelect={setSelectedBBox}
            />
          </div>
        </div>

        {/* 우측: 수정 패널 */}
        <SlidePanel
          deckId={deckId}
          slideIndex={currentSlide}
          selectedBBox={selectedBBox}
          onClearSelection={() => setSelectedBBox(null)}
        />
      </div>
    </div>
  );
}
```

---

## Phase 5 — 슬라이드 생성 진입점

기존 대시보드 `app/dashboard/page.tsx`에 슬라이드 생성 버튼 추가:

```tsx
// 기존 빠른 시작 카드에 추가
<div
  style={{
    background: "rgba(59,130,246,0.1)",
    border: "1px solid rgba(59,130,246,0.25)",
    borderRadius: 14,
    padding: 20,
    cursor: "pointer",
  }}
  onClick={() => setShowSlideModal(true)}
>
  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 14 }}>
    AI 슬라이드 생성
  </div>
  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4, lineHeight: 1.5 }}>
    주제나 내용을 입력하면 PPT 슬라이드를 자동으로 만들어줍니다
  </div>
  <div style={{ marginTop: 16, fontSize: 13, color: "#60a5fa" }}>
    슬라이드 만들기 →
  </div>
</div>
```

`GenerateModal.tsx` 컴포넌트 구현:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GenerateModalProps {
  onClose: () => void;
}

export default function GenerateModal({ onClose }: GenerateModalProps) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState(8);
  const [theme, setTheme] = useState("modern_dark");
  const [loading, setLoading] = useState(false);

  const THEMES = [
    { value: "modern_dark", label: "모던 다크" },
    { value: "executive",   label: "임원 보고용" },
    { value: "minimal",     label: "심플" },
    { value: "government",  label: "정부 제안서" },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/slides/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, slide_count: slideCount, theme }),
        }
      );
      const data = await res.json();
      onClose();
      router.push(`/slides/${data.deck_id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#0e0e1a",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: 32,
        width: 520,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>AI 슬라이드 생성</div>

        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 8 }}>
            주제 또는 내용
          </div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            placeholder="예: 2026 스마트팩토리 구축 제안서, 핵심 기술과 기대효과 포함"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 10,
              padding: 14,
              color: "rgba(255,255,255,0.8)",
              fontSize: 14,
              resize: "none",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 8 }}>
              슬라이드 수
            </div>
            <select
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              style={{
                width: "100%",
                height: 40,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                padding: "0 12px",
              }}
            >
              {[5,6,7,8,10,12,15].map((n) => (
                <option key={n} value={n}>{n}장</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 8 }}>
              테마
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                width: "100%",
                height: 40,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                padding: "0 12px",
              }}
            >
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, height: 44,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 8,
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            style={{
              flex: 2, height: 44,
              background: loading
                ? "rgba(139,92,246,0.3)"
                : "linear-gradient(135deg,#8b5cf6,#3b82f6)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "생성 중... (15~30초)" : "슬라이드 생성하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 6 — 통합 테스트

### 6-1. 백엔드 테스트

```python
# backend/tests/test_slides.py
import pytest
from pathlib import Path
from slides.engine import render_slide, load_theme

def test_render_cover():
    html = render_slide(
        layout="cover",
        slide_data={
            "title": "테스트 발표",
            "subtitle": "DockFlow AI 구현",
            "meta_items": [
                {"label": "작성자", "value": "홍길동"},
                {"label": "날짜",  "value": "2026.04"},
            ]
        },
        theme_name="modern_dark",
        slide_index=1,
        total_slides=8,
        deck_title="테스트 덱",
    )
    assert "테스트 발표" in html
    assert "DockFlow AI" in html
    assert "slide-root" in html

def test_render_content():
    html = render_slide(
        layout="content",
        slide_data={
            "title": "핵심 기능",
            "eyebrow": "FEATURES",
            "bullets": [
                {"text": "AI 공고 분석", "sub": "적합도 자동 산출"},
                {"text": "자동 문서 생성"},
            ]
        },
        theme_name="government",
    )
    assert "핵심 기능" in html
    assert "AI 공고 분석" in html

@pytest.mark.asyncio
async def test_export_pdf(tmp_path):
    from slides.engine import save_slide
    from slides.export import export_to_pdf

    deck_path = tmp_path / "test_deck"
    deck_path.mkdir()

    html = render_slide("cover", {"title":"테스트","subtitle":"sub"})
    save_slide(deck_path, 1, html)

    out = tmp_path / "test.pdf"
    await export_to_pdf(deck_path, out)
    assert out.exists()
    assert out.stat().st_size > 1000
```

### 6-2. 수동 확인 체크리스트

```
[ ] POST /api/slides/generate → deck_id 반환됨
[ ] GET /api/slides/{id}/slides/1/html → HTML 반환 + 에디터 스크립트 주입 확인
[ ] 브라우저에서 슬라이드 요소 클릭 → 파란 bbox 오버레이 표시
[ ] 수정 지시 입력 → AI가 수정된 HTML 반환
[ ] 수정 내용이 슬라이드에 실시간 반영
[ ] PPTX 내보내기 → 파일 다운로드 완료
[ ] PDF 내보내기 → 파일 다운로드 완료
[ ] government 테마로 생성 → 흰 배경 슬라이드 확인
```

---

## 완료 조건

모든 Phase 완료 후 다음이 동작해야 한다:

```
1. 대시보드 → "AI 슬라이드 생성" 클릭
2. 주제 입력 + 테마 선택 → "생성하기"
3. 슬라이드 에디터 자동 이동
4. 원하는 요소 클릭 → 파란 선택 표시
5. "글자 크기 키워줘" 입력 → 즉시 반영
6. "PPTX 다운로드" → 파일 저장
```

---

## 참고 자료

- slides-grab 원본: https://github.com/vkehfdl1/slides-grab
- Playwright Python 문서: https://playwright.dev/python/
- iframe postMessage MDN: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
- 기존 CLAUDE.md, ARCHITECTURE.md 규칙 반드시 준수
