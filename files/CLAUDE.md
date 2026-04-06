# CLAUDE.md — DocFlow AI 프로젝트 지시서

> Claude Code가 이 프로젝트에서 작업할 때 항상 이 파일을 먼저 읽고 시작한다.
> 모든 코드 생성, 수정, 리뷰는 이 문서의 규칙을 따른다.

---

## 프로젝트 개요

**DocFlow AI** — LLM + Agent 기반 올인원 문서 자동화 서비스.
공인중개사, 세무사, 총무팀 등 오피스 업무의 PPT·엑셀·계약서·보고서를 자연어 명령으로 자동 생성한다.

- **목표**: 젠스파크(Genspark) 수준의 문서 자동화 AI SaaS
- **1차 타겟**: 공인중개사 사무소 (임대차계약서, 매물 PPT, 정산 엑셀)
- **핵심 가치**: "말로 시키면 파일이 나온다"

---

## 기술 스택

### Backend
```
언어:        Python 3.11+
프레임워크:  FastAPI (비동기, 타입 힌트 필수)
AI:          OpenAI API (gpt-4o)
문서 생성:   python-pptx, openpyxl, python-docx, weasyprint
템플릿:      Jinja2
검색:        Tavily API (웹 검색 툴)
저장:        로컬 파일 → Cloudflare R2 (추후)
DB:          Supabase PostgreSQL (추후)
```

### Frontend
```
프레임워크:  Next.js 14 (App Router)
언어:        TypeScript
스타일:      Tailwind CSS
상태관리:    Zustand
파일업로드:  react-dropzone
```

### 자동화 레이어
```
워크플로우:  n8n (self-hosted via Docker)
트리거:      Webhook, Gmail, Cron, Telegram
연결:        n8n → FastAPI HTTP Request 노드
```

### 개발 도구
```
패키지관리:  uv (Python), pnpm (Node)
포맷터:      ruff (Python), prettier (TS)
타입체크:    mypy (Python), tsc (TS)
테스트:      pytest (Python), vitest (TS)
컨테이너:    Docker Compose
```

---

## 프로젝트 디렉토리 구조

```
docflow-ai/
├── CLAUDE.md              ← 지금 이 파일 (항상 먼저 읽기)
├── TASKS.md               ← 현재 작업 목록
├── SKILLS.md              ← 기술 패턴 레퍼런스
├── README.md              ← 프로젝트 소개
├── ARCHITECTURE.md        ← 시스템 설계 상세
├── docker-compose.yml     ← 전체 서비스 실행
│
├── backend/               ← FastAPI 서버
│   ├── main.py
│   ├── api/
│   │   ├── routes/
│   │   │   ├── generate.py    ← 문서 생성 엔드포인트
│   │   │   ├── templates.py   ← 템플릿 관리
│   │   │   └── health.py
│   │   └── deps.py
│   ├── agent/
│   │   ├── orchestrator.py    ← Claude Tool Use Agent 루프
│   │   ├── tools/
│   │   │   ├── ppt_tool.py
│   │   │   ├── excel_tool.py
│   │   │   ├── pdf_tool.py
│   │   │   └── search_tool.py
│   │   └── prompts/
│   │       ├── system.py
│   │       └── templates.py
│   ├── document/
│   │   ├── ppt_engine.py      ← python-pptx 래퍼
│   │   ├── excel_engine.py    ← openpyxl 래퍼
│   │   ├── pdf_engine.py      ← reportlab/weasyprint 래퍼
│   │   └── contract_engine.py ← 계약서 특화 생성
│   ├── templates/
│   │   ├── ppt/               ← PPT 템플릿 파일
│   │   ├── excel/             ← 엑셀 템플릿 파일
│   │   └── html/              ← Jinja2 HTML 템플릿
│   ├── models/
│   │   ├── request.py         ← Pydantic 요청 모델
│   │   └── response.py        ← Pydantic 응답 모델
│   ├── core/
│   │   ├── config.py          ← 환경변수 설정
│   │   └── exceptions.py
│   ├── tests/
│   └── requirements.txt
│
├── frontend/              ← Next.js 앱
│   ├── app/
│   │   ├── page.tsx           ← 메인 UI
│   │   ├── api/               ← API Routes (BFF)
│   │   └── components/
│   ├── lib/
│   └── package.json
│
├── n8n/                   ← n8n 워크플로우 정의
│   ├── workflows/
│   │   ├── email_trigger.json
│   │   ├── schedule_report.json
│   │   └── kakao_bot.json
│   └── README.md
│
└── docs/
    ├── API.md             ← API 명세
    ├── WORKFLOWS.md       ← n8n 워크플로우 설명
    └── DEPLOY.md          ← 배포 가이드
```

---

## 코딩 컨벤션

### Python (Backend)

```python
# 1. 모든 함수에 타입 힌트 필수
async def generate_document(request: GenerateRequest) -> DocumentResponse:
    ...

# 2. Pydantic v2 사용 (BaseModel)
from pydantic import BaseModel, Field

class GenerateRequest(BaseModel):
    instruction: str = Field(..., description="사용자 자연어 명령")
    format: Literal["pptx", "xlsx", "pdf"] = "pptx"
    context: dict[str, Any] = Field(default_factory=dict)

# 3. 에러는 반드시 커스텀 예외로
class DocumentGenerationError(Exception):
    def __init__(self, message: str, tool: str):
        self.message = message
        self.tool = tool

# 4. 비동기 우선 (FastAPI)
# sync 함수는 run_in_executor로 감싸기

# 5. 로깅 표준
import structlog
logger = structlog.get_logger(__name__)
logger.info("document_generated", format=format, duration_ms=elapsed)
```

### TypeScript (Frontend)

```typescript
// 1. any 사용 금지, unknown 사용
// 2. interface > type (확장성)
// 3. Server Components 우선, 필요할 때만 "use client"
// 4. fetch는 Server Actions 또는 API Routes에서
```

### 일반 규칙

- 커밋 메시지: `feat:`, `fix:`, `refactor:`, `docs:`, `test:` 접두사
- 파일명: Python은 `snake_case`, TS는 `kebab-case` (컴포넌트는 `PascalCase`)
- 주석: 한국어로 작성 (이 프로젝트는 한국어 우선)
- 함수 길이: 50줄 초과 시 분리 고려
- 매직 넘버: 상수로 분리

---

## OpenAI API 사용 규칙

### 모델 선택
```python
# 문서 생성 (Function Calling, 복잡한 추론) → gpt-4o
model = "gpt-4o"

# 단순 파싱, 분류 → gpt-4o-mini (비용 절감)
model = "gpt-4o-mini"
```

### Function Calling 패턴
```python
# Tool 정의는 tools/ 폴더의 각 파일에서 관리
# orchestrator.py에서 조합하여 OpenAI에 전달
# Tool 실행 결과는 반드시 검증 후 반환
# input_schema 필드 → OpenAI parameters 자동 변환 처리됨
```

### 비용 관리
- 개발 중에는 gpt-4o-mini 우선 테스트 후 gpt-4o로 전환
- 불필요한 API 호출 최소화

---

## 환경변수 (.env)

```bash
# AI
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...

# 서버
BACKEND_PORT=8000
FRONTEND_PORT=3000
N8N_PORT=5678

# 파일 저장
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
MAX_FILE_SIZE_MB=50

# 데이터베이스 (추후)
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_KEY=...

# 클라우드 스토리지 (추후)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET_NAME=docflow-outputs
```

---

## 개발 명령어

```bash
# 백엔드 실행
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000

# 프론트엔드 실행
cd frontend
pnpm install
pnpm dev

# 전체 Docker 실행
docker-compose up -d

# 테스트
cd backend && uv run pytest tests/ -v
cd frontend && pnpm test

# 타입 체크
cd backend && uv run mypy .
cd frontend && pnpm tsc --noEmit

# 린트/포맷
cd backend && uv run ruff check . && uv run ruff format .
cd frontend && pnpm lint
```

---

## 작업 시작 체크리스트

새 기능 개발 전 반드시 확인:
1. [ ] TASKS.md에서 현재 우선순위 확인
2. [ ] ARCHITECTURE.md에서 해당 모듈의 인터페이스 확인
3. [ ] 기존 유사 코드 참고 (중복 작성 금지)
4. [ ] 타입 힌트 / Pydantic 모델 먼저 정의
5. [ ] 테스트 파일 함께 작성

---

## 금지 사항

- `print()` 디버깅 — `logger` 사용
- 하드코딩된 파일 경로 — `core/config.py`의 설정값 사용
- `Any` 타입 남발 — 명확한 타입 정의
- API 키 코드 내 직접 작성 — 환경변수만
- `time.sleep()` — `asyncio.sleep()` 사용
- 파일 생성 후 정리 안 함 — 임시 파일 반드시 cleanup
