# SKILLS.md — 핵심 기술 패턴 레퍼런스

> Claude Code가 코드 작성 시 참고하는 검증된 패턴 모음.
> "어떻게 만드는가"에 대한 정답 예시.

---

## 1. FastAPI 기본 패턴

### 앱 초기화 (`main.py`)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

logger = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시 초기화
    logger.info("docflow_api_starting")
    yield
    # 종료 시 정리
    logger.info("docflow_api_shutting_down")

app = FastAPI(
    title="DocFlow AI API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 설정 관리 (`core/config.py`)
```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # AI
    anthropic_api_key: str
    tavily_api_key: str = ""

    # 파일 저장
    output_dir: Path = Path("./outputs")
    upload_dir: Path = Path("./uploads")
    max_file_size_mb: int = 50
    file_ttl_hours: int = 1

    # 서버
    debug: bool = False

    def model_post_init(self, __context):
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

settings = Settings()
```

### 요청/응답 모델 (`models/request.py`)
```python
from pydantic import BaseModel, Field
from typing import Literal, Any

class GenerateRequest(BaseModel):
    instruction: str = Field(..., min_length=5, description="자연어 명령")
    format: Literal["pptx", "xlsx", "pdf", "contract"] = Field(
        default="pptx",
        description="출력 파일 형식"
    )
    context: dict[str, Any] = Field(
        default_factory=dict,
        description="추가 컨텍스트 (부동산 정보, 날짜 등)"
    )
    session_id: str | None = Field(default=None, description="멀티턴 세션 ID")

class DocumentResponse(BaseModel):
    file_id: str
    filename: str
    format: str
    download_url: str
    created_at: str
    metadata: dict[str, Any] = {}
```

---

## 2. Claude Tool Use Agent 패턴

### Agent 오케스트레이터 (`agent/orchestrator.py`)
```python
import anthropic
from typing import Any
import structlog

logger = structlog.get_logger(__name__)

class DocumentOrchestrator:
    def __init__(self):
        self.client = anthropic.Anthropic()
        self.model = "claude-sonnet-4-20250514"
        self.max_iterations = 5  # 무한루프 방지

    async def run(
        self,
        instruction: str,
        tools: list[dict],
        context: dict[str, Any] = {}
    ) -> dict[str, Any]:
        """Tool Use 루프 실행 — 완료까지 반복"""

        messages = self._build_initial_messages(instruction, context)
        result = {"status": "pending", "files": [], "message": ""}

        for iteration in range(self.max_iterations):
            logger.info("agent_iteration", iteration=iteration)

            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                tools=tools,
                messages=messages,
            )

            # 완료 조건
            if response.stop_reason == "end_turn":
                result["status"] = "success"
                result["message"] = self._extract_text(response)
                break

            # Tool 호출 처리
            if response.stop_reason == "tool_use":
                tool_results = await self._execute_tools(response)
                messages.append({"role": "assistant", "content": response.content})
                messages.append({"role": "user", "content": tool_results})

                # 생성된 파일 추적
                for tr in tool_results:
                    if isinstance(tr.get("content"), dict):
                        file_info = tr["content"].get("file")
                        if file_info:
                            result["files"].append(file_info)
            else:
                logger.warning("unexpected_stop_reason", reason=response.stop_reason)
                break

        return result

    async def _execute_tools(self, response) -> list[dict]:
        """Tool 블록 찾아서 실행"""
        results = []
        for block in response.content:
            if block.type == "tool_use":
                logger.info("tool_called", name=block.name, input=block.input)
                try:
                    output = await self._dispatch(block.name, block.input)
                    results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(output),
                    })
                except Exception as e:
                    logger.error("tool_failed", name=block.name, error=str(e))
                    results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": f"오류: {str(e)}",
                        "is_error": True,
                    })
        return results

    def _build_initial_messages(self, instruction: str, context: dict) -> list:
        content = instruction
        if context:
            import json
            content += f"\n\n추가 정보:\n{json.dumps(context, ensure_ascii=False, indent=2)}"
        return [{"role": "user", "content": content}]

    def _extract_text(self, response) -> str:
        for block in response.content:
            if hasattr(block, "text"):
                return block.text
        return ""

    async def _dispatch(self, tool_name: str, tool_input: dict) -> Any:
        """Tool 이름 → 실제 함수 매핑"""
        from agent.tools import TOOL_REGISTRY
        handler = TOOL_REGISTRY.get(tool_name)
        if not handler:
            raise ValueError(f"알 수 없는 툴: {tool_name}")
        return await handler(tool_input)
```

### Tool 정의 패턴 (`agent/tools/ppt_tool.py`)
```python
# Tool 스키마 정의
PPT_TOOL_SCHEMA = {
    "name": "create_ppt",
    "description": (
        "PowerPoint 프레젠테이션을 생성합니다. "
        "슬라이드 제목, 내용, 레이아웃을 지정하세요. "
        "공인중개사 보고서, 사업 제안서, 시장 분석 자료에 적합합니다."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "프레젠테이션 전체 제목"
            },
            "slides": {
                "type": "array",
                "description": "슬라이드 목록",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "layout": {
                            "type": "string",
                            "enum": ["title_only", "content", "two_column", "image_text"],
                            "default": "content"
                        },
                        "content": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "불릿 포인트 목록"
                        },
                        "notes": {
                            "type": "string",
                            "description": "발표자 노트 (선택)"
                        }
                    },
                    "required": ["title"]
                }
            },
            "theme": {
                "type": "string",
                "enum": ["modern", "classic", "minimal", "dark"],
                "default": "modern"
            }
        },
        "required": ["title", "slides"]
    }
}

# Tool 핸들러
async def handle_create_ppt(tool_input: dict) -> dict:
    from document.ppt_engine import PptEngine
    from core.config import settings
    import uuid

    engine = PptEngine(theme=tool_input.get("theme", "modern"))
    file_id = str(uuid.uuid4())
    filename = f"{tool_input['title']}.pptx"
    output_path = settings.output_dir / f"{file_id}.pptx"

    engine.create(
        title=tool_input["title"],
        slides=tool_input["slides"],
        output_path=output_path
    )

    return {
        "success": True,
        "file": {
            "file_id": file_id,
            "filename": filename,
            "format": "pptx",
            "path": str(output_path),
            "download_url": f"/api/files/{file_id}"
        }
    }
```

---

## 3. 문서 엔진 패턴

### PPT 엔진 (`document/ppt_engine.py`)
```python
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pathlib import Path
from typing import Literal

# 테마 색상 정의
THEMES = {
    "modern": {
        "bg": RGBColor(0xFF, 0xFF, 0xFF),       # 흰 배경
        "title": RGBColor(0x1A, 0x1A, 0x2E),    # 진한 네이비
        "accent": RGBColor(0x4A, 0x90, 0xD9),   # 파란 강조
        "text": RGBColor(0x33, 0x33, 0x33),     # 본문
        "subtitle": RGBColor(0x66, 0x66, 0x66), # 서브텍스트
    },
    "dark": {
        "bg": RGBColor(0x1A, 0x1A, 0x2E),
        "title": RGBColor(0xFF, 0xFF, 0xFF),
        "accent": RGBColor(0x4A, 0x90, 0xD9),
        "text": RGBColor(0xE0, 0xE0, 0xE0),
        "subtitle": RGBColor(0xAA, 0xAA, 0xAA),
    }
}

class PptEngine:
    def __init__(self, theme: str = "modern"):
        self.prs = Presentation()
        self.theme = THEMES.get(theme, THEMES["modern"])
        # 16:9 슬라이드
        self.prs.slide_width = Inches(13.33)
        self.prs.slide_height = Inches(7.5)

    def create(self, title: str, slides: list[dict], output_path: Path) -> None:
        self._add_title_slide(title)
        for slide_data in slides:
            layout = slide_data.get("layout", "content")
            if layout == "two_column":
                self._add_two_column_slide(slide_data)
            else:
                self._add_content_slide(slide_data)
        self.prs.save(str(output_path))

    def _add_content_slide(self, data: dict) -> None:
        layout = self.prs.slide_layouts[1]  # Title and Content
        slide = self.prs.slides.add_slide(layout)

        # 제목
        title_tf = slide.shapes.title.text_frame
        title_tf.text = data["title"]
        title_tf.paragraphs[0].runs[0].font.size = Pt(32)
        title_tf.paragraphs[0].runs[0].font.color.rgb = self.theme["title"]

        # 내용
        if data.get("content"):
            body = slide.placeholders[1].text_frame
            body.clear()
            for i, item in enumerate(data["content"]):
                para = body.paragraphs[0] if i == 0 else body.add_paragraph()
                para.text = item
                para.level = 0
                run = para.runs[0]
                run.font.size = Pt(20)
                run.font.color.rgb = self.theme["text"]
```

### 엑셀 엔진 (`document/excel_engine.py`)
```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from pathlib import Path

class ExcelEngine:
    # 헤더 스타일
    HEADER_FILL = PatternFill("solid", fgColor="1A1A2E")
    HEADER_FONT = Font(color="FFFFFF", bold=True, size=11)
    # 짝수행 배경
    ALT_FILL = PatternFill("solid", fgColor="F5F7FA")

    def create(
        self,
        sheets: list[dict],
        output_path: Path,
        add_total_row: bool = True
    ) -> None:
        wb = Workbook()
        wb.remove(wb.active)  # 기본 시트 제거

        for sheet_data in sheets:
            ws = wb.create_sheet(title=sheet_data["name"])
            self._write_sheet(ws, sheet_data, add_total_row)

        wb.save(str(output_path))

    def _write_sheet(self, ws, data: dict, add_total: bool) -> None:
        headers = data.get("headers", [])
        rows = data.get("rows", [])

        # 헤더 작성
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.fill = self.HEADER_FILL
            cell.font = self.HEADER_FONT
            cell.alignment = Alignment(horizontal="center")

        # 데이터 작성
        for row_idx, row in enumerate(rows, 2):
            fill = self.ALT_FILL if row_idx % 2 == 0 else None
            for col_idx, value in enumerate(row, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                if fill:
                    cell.fill = fill
                cell.alignment = Alignment(horizontal="left")

        # 합계 행
        if add_total and rows:
            total_row = len(rows) + 2
            ws.cell(row=total_row, column=1, value="합계").font = Font(bold=True)

        # 열 너비 자동 조정
        for col in ws.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            ws.column_dimensions[get_column_letter(col[0].column)].width = min(max_len + 4, 40)
```

---

## 4. n8n 연동 패턴

### n8n → FastAPI 인증 미들웨어
```python
# backend/core/auth.py
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
from core.config import settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_n8n_key(api_key: str = Security(api_key_header)) -> str:
    if api_key != settings.n8n_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="유효하지 않은 API 키"
        )
    return api_key
```

### FastAPI 엔드포인트 (n8n에서 호출)
```python
# 이 엔드포인트를 n8n HTTP Request 노드에서 호출
@router.post("/api/generate", dependencies=[Depends(verify_n8n_key)])
async def generate_document(request: GenerateRequest) -> DocumentResponse:
    """
    n8n 또는 프론트엔드에서 호출하는 통합 문서 생성 엔드포인트.
    instruction을 Claude Agent가 분석하여 적절한 문서 생성.
    """
    orchestrator = DocumentOrchestrator()
    result = await orchestrator.run(
        instruction=request.instruction,
        tools=get_all_tools(),
        context=request.context,
    )
    # ... 파일 응답 반환
```

---

## 5. 환경 설정 패턴

### `docker-compose.yml` 기본 구조
```yaml
version: "3.9"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./outputs:/app/outputs
      - ./uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
    volumes:
      - n8n_data:/home/node/.n8n
      - ./n8n/workflows:/home/node/workflows

volumes:
  n8n_data:
```

### `.env.example`
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
TAVILY_API_KEY=tvly-your-key-here
N8N_API_KEY=your-internal-api-key
N8N_PASSWORD=your-n8n-admin-password
DEBUG=false
```

---

## 6. 테스트 패턴

### pytest 기본 구조
```python
# tests/test_ppt_tool.py
import pytest
from pathlib import Path
from document.ppt_engine import PptEngine

@pytest.fixture
def tmp_output(tmp_path):
    return tmp_path / "test.pptx"

def test_ppt_creation_basic(tmp_output):
    engine = PptEngine(theme="modern")
    engine.create(
        title="테스트 프레젠테이션",
        slides=[
            {"title": "슬라이드 1", "content": ["항목 1", "항목 2"]},
            {"title": "슬라이드 2", "layout": "two_column"},
        ],
        output_path=tmp_output
    )
    assert tmp_output.exists()
    assert tmp_output.stat().st_size > 0

@pytest.mark.asyncio
async def test_agent_ppt_request():
    """실제 Claude API 호출 — 개발 환경에서만 실행"""
    from agent.orchestrator import DocumentOrchestrator
    orch = DocumentOrchestrator()
    result = await orch.run(
        instruction="3분기 부동산 시장 동향 PPT 3슬라이드 만들어줘",
        tools=[PPT_TOOL_SCHEMA],
    )
    assert result["status"] == "success"
    assert len(result["files"]) > 0
```

---

## 7. 자주 쓰는 명령어 모음

```bash
# 새 의존성 추가
uv add fastapi anthropic python-pptx openpyxl

# 특정 테스트만 실행
uv run pytest tests/test_ppt_tool.py -v -k "test_basic"

# API 문서 확인
open http://localhost:8000/docs

# n8n 워크플로우 백업
curl -X GET http://localhost:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: your-key" > n8n/workflows/backup.json

# 로그 확인
docker-compose logs -f backend

# 생성된 파일 정리
find ./outputs -name "*.pptx" -mmin +60 -delete
```
