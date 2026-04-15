# CLAUDE.md — DocFlow AI 개발 지침서

> **이 파일이 최우선이다.** 작업 시작 전 반드시 읽는다.
> 과거 실패 사례와 검증 절차가 담겨 있다. 무시하면 배포가 깨진다.

---

## 프로젝트 현황 (2026-04)

**DocFlow AI** — 정부 공고 자동 수집 → AI 분석 → 지원서 자동 생성 + 범용 AI 문서 자동화 SaaS.  
카카오 로그인 + Supabase 사용자 관리 + AI 문서 생성(PPT·Word·Excel·PDF) + 슬라이드 에디터 + 정부공고 파이프라인.

| 레이어 | 서비스 | URL |
|--------|--------|-----|
| Frontend | Vercel | https://dock-flow-ten.vercel.app |
| Backend | Railway | 환경변수 `BACKEND_URL` 참조 |
| Auth | NextAuth + KakaoProvider | |
| DB | Supabase PostgreSQL | |
| 공고 API | 기업마당(bizinfo.go.kr) | `.env` `BIZINFO_API_KEY` |

### 핵심 플로우 (정부공고 파이프라인)
```
기업마당 API → 공고 수집 → AI 점수/요약 → 공고 모니터링 화면
→ "지원서 자동 생성" 클릭 → 결재함 대기
→ 승인 → AI 심층분석 + 지원서 DOCX → 다운로드
```

---

## 기술 스택 (실제 사용 중)

### Backend (`backend/`)
```
Python 3.11 · FastAPI · uv (패키지 관리)
AI: OpenAI gpt-4o / gpt-4o-mini
문서 생성: python-pptx, openpyxl, python-docx, weasyprint (Linux 전용)
슬라이드: jinja2 템플릿 + HTML 렌더링
Export: playwright + pypdf (선택적 — 미설치 시 graceful 실패)
DB: supabase-py (>=2.5.0,<2.6.0)
로깅: structlog
배포: Railway (Dockerfile 기반)
```

### Frontend (`frontend/`)
```
Next.js 15 (App Router) · TypeScript · Tailwind CSS
인증: next-auth (KakaoProvider + Supabase upsert)
아이콘: lucide-react
이미지: next/image (외부 도메인 whitelist 필요)
배포: Vercel (자동 빌드)
```

---

## 실제 디렉토리 구조

```
docflow-ai/
├── CLAUDE.md                    ← 이 파일 (루트 최우선)
├── 인수인계.md                  ← 현재 개발 상태 + 다음 할 일
├── supabase/migrations/         ← SQL 마이그레이션 (Supabase Dashboard에서 수동 실행)
│   ├── pipeline_tables.sql      ← announcements + approval_requests 테이블
│   ├── sprint5_workflows_rls.sql ← workflows 테이블 + RLS
│   └── milestone2_rag_chunks.sql ← document_chunks 벡터 테이블
├── backend/
│   ├── main.py                  ← FastAPI 앱 엔트리, 라우터 등록
│   ├── Dockerfile               ← Railway 빌드
│   ├── railway.toml             ← healthcheckPath=/health, timeout=60
│   ├── pyproject.toml           ← uv 의존성 (여기만 추가)
│   ├── core/config.py           ← 환경변수 (Settings 클래스, backend_url 포함)
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py        ← GET /health
│   │   │   ├── generate.py      ← POST /api/generate/async, GET /api/jobs/{id}
│   │   │   ├── files.py         ← POST /api/upload, GET /api/files/{id}
│   │   │   ├── documents.py     ← GET /api/documents, DELETE /api/documents/{id}
│   │   │   ├── slides.py        ← POST /slides/generate, PATCH /slides/...
│   │   │   ├── workflows.py     ← /api/workflows CRUD
│   │   │   ├── announcements.py ← 공고 수집/목록/승인요청
│   │   │   └── approvals.py     ← 승인/반려/파이프라인 실행
│   │   └── middleware/auth.py   ← get_current_user_id (X-User-Id 헤더)
│   ├── agent/
│   │   ├── orchestrator.py      ← OpenAI Tool Use 루프
│   │   ├── model_router.py      ← 로컬/클라우드 모델 라우팅
│   │   └── tools/               ← ppt_tool, excel_tool, pdf_tool, slide_tool, search_tool
│   ├── crawler/
│   │   └── collector.py         ← 기업마당 API 공고 수집 + AI 점수/요약
│   ├── pipeline/
│   │   └── analyzer.py          ← 공고 심층분석 + 지원서 DOCX 생성
│   ├── document/                ← ppt_engine, excel_engine, word_engine, pdf_engine
│   ├── slides/
│   │   ├── engine.py            ← jinja2 렌더링
│   │   ├── export.py            ← playwright PDF/PPTX (lazy import)
│   │   ├── templates/           ← HTML 슬라이드 템플릿
│   │   └── themes/              ← JSON 테마 파일
│   ├── models/                  ← Pydantic 요청/응답 모델
│   └── tests/
│
└── frontend/
    ├── AGENTS.md                ← Next.js 에이전트 규칙 (이 파일도 읽을 것)
    ├── next.config.ts           ← rewrites: /api/* → Railway 백엔드
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx       ← SessionProvider, Sidebar, Header 포함
    │   │   ├── page.tsx         ← 홈 대시보드 ('use client' 필수)
    │   │   ├── announcements/   ← 공고 모니터링
    │   │   ├── approvals/       ← 결재함 (승인/반려)
    │   │   ├── workflows/       ← 워크플로우 관리
    │   │   ├── documents/       ← 내 문서 목록
    │   │   ├── slides/          ← AI 슬라이드 에디터
    │   │   ├── convert/         ← 파일 변환
    │   │   └── api/auth/[...nextauth]/route.ts
    │   ├── components/
    │   │   ├── workspace/Sidebar.tsx
    │   │   ├── workspace/Header.tsx
    │   │   └── slides/          ← GenerateModal, SlideEditor, SlidePanel
    │   ├── lib/
    │   │   ├── api.ts           ← fetch 래퍼 (X-User-Id 헤더 자동 주입)
    │   │   ├── types.ts         ← 공통 TypeScript 타입
    │   │   └── supabase.ts      ← getSupabaseAdmin()
    │   └── middleware.ts        ← 인증 보호 라우트
```

---

## 과거 실패 사례 — 절대 반복 금지

### [F-1] Vercel 빌드 실패: "useState is not a function" / "use client missing"
**원인**: React 훅(`useState`, `useSession` 등)을 쓰는 컴포넌트에 `'use client'` 없음  
**규칙**: 훅 사용 파일은 **첫 번째 줄**이 반드시 `'use client';`  
```tsx
'use client';   // ← 반드시 첫 줄. import보다 위.
import { useState } from 'react';
```
**체크**: 커밋 전 `cd frontend && npx tsc --noEmit` 실행

---

### [F-2] Vercel 빌드 실패: "Expected </>, got )" (Turbopack JSX 오류)
**원인**: 삼항 연산자 닫는 괄호 오타. `)}` vs `}`  
```tsx
// 잘못된 예 — )} 가 JSX 구조 위반
) : null
)}

// 올바른 예
) : null
}
```
**체크**: `npx tsc --noEmit`이 이 오류를 잡는다

---

### [F-3] Railway Healthcheck 실패: 앱 시작 시 ImportError
**원인**: `pyproject.toml`에 없는 패키지를 모듈 **최상위 레벨**에서 import  
```python
# 잘못된 예 — 파일 로드 시점에 ImportError 발생
from playwright.async_api import async_playwright   # playwright 미설치

# 올바른 예 — 함수 내부에서 lazy import
async def export():
    try:
        from playwright.async_api import async_playwright
    except ImportError as e:
        raise RuntimeError(f"패키지 없음: {e}") from e
```
**규칙**: `pyproject.toml`에 없는 패키지는 반드시 함수 내부에서 lazy import  
**체크**: 커밋 전 `cd backend && uv run python -c "from main import app; print('OK')"` 실행

---

### [F-4] Vercel 빌드 실패: "Module not found"
**원인**: 로컬에 파일이 있지만 `git add` 안 됨 (untracked)  
**체크**: 커밋 전 `git status`로 untracked 파일 확인. import하는 파일은 반드시 커밋

---

### [F-5] Dockerfile libgdk-pixbuf 패키지명 오류
**원인**: `libgdk-pixbuf2.0-0` → Debian bookworm에서 `libgdk-pixbuf-xlib-2.0-0`으로 변경됨  
**현황**: 이미 수정됨. 패키지명 변경 시 `apt-cache search` 먼저 확인

---

## 커밋 전 필수 검증 (Pre-commit Checklist)

```bash
# 1. Frontend TypeScript 컴파일 (JSX 오류, 'use client' 누락 등 잡힘)
cd frontend && npx tsc --noEmit

# 2. Backend 앱 임포트 테스트 (시작 시 크래시 방지)
cd backend && uv run python -c "from main import app; print('Backend OK')"

# 3. Staged 파일 확인 (untracked import 방지)
git status

# 4. .env 파일 staged 여부 확인 (비밀키 누출 방지)
git diff --cached --name-only | grep -E '\.env'
```

**스크립트 실행**: `./scripts/validate.sh`  
**자동 설치**: `./scripts/install-hooks.sh` (한 번만 실행)

---

## 코딩 컨벤션

### Python (Backend)
- 모든 함수에 타입 힌트 필수
- 비동기 우선 (`asyncio.sleep`, `async def`)
- `print()` 금지 → `structlog` logger 사용
- 하드코딩 경로 금지 → `settings.output_dir` 등 config 사용
- 새 패키지 추가 시 `pyproject.toml`에만 추가, `uv sync` 실행
- **외부 패키지는 함수 내 lazy import** (최상위 import 시 미설치 패키지로 크래시 가능)

### TypeScript (Frontend)
- 훅 사용 파일은 반드시 `'use client';` 첫 줄
- `any` 금지 → `unknown` 또는 명확한 타입
- Server Components 우선, 필요할 때만 Client Component
- API 호출은 상대 경로 `/api/...` 사용 (next.config.ts rewrite 활용)
- `fetch` 사용, `axios` 사용 금지

### API 설계
- Frontend → Backend: `X-User-Id` 헤더로 사용자 UUID 전달
- Backend auth: `api/middleware/auth.py`의 `get_current_user_id` Depends 사용
- 파일 다운로드: `GET /api/files/{uuid}` (확장자 자동 탐색)

---

## 환경변수

### Frontend (`frontend/.env.local`)
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # 서버 전용, 절대 NEXT_PUBLIC_ 금지
NEXT_PUBLIC_BACKEND_URL=https://xxx.railway.app
```

### Backend (`backend/.env`)
```bash
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
BIZINFO_API_KEY=...              # 기업마당 오픈API 인증키
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
BACKEND_URL=https://xxx.railway.app  # 파일 다운로드 절대 URL 생성에 사용
REQUIRE_AUTH=false               # 운영 시 true
CORS_ORIGINS=http://localhost:3000,https://dock-flow-ten.vercel.app
```

---

## 개발 명령어

```bash
# 백엔드 로컬 실행
cd backend && uv run uvicorn main:app --reload --port 8000

# 프론트엔드 로컬 실행
cd frontend && npm run dev

# 백엔드 테스트
cd backend && uv run pytest tests/ -v

# 프론트엔드 타입 체크
cd frontend && npx tsc --noEmit

# 백엔드 린트
cd backend && uv run ruff check . && uv run ruff format --check .

# 전체 검증 (커밋 전)
./scripts/validate.sh
```

---

## 완료된 스프린트

- [x] **Sprint 1-2**: 인증(카카오+Supabase), 문서 생성(PPT/Excel/Word/PDF), 파일 업로드+RAG
- [x] **Sprint 3**: Mock 페이지 실데이터 연결 (workflows, announcements, approvals)
- [x] **Sprint 4**: 워크플로우 CRUD API + UI 실데이터 연결
- [x] **Sprint 5**: Supabase `require_auth=true` + RLS 정책 적용
- [x] **슬라이드 에디터**: AI 슬라이드 생성 + 비주얼 편집 + PDF/PPTX 내보내기

## 다음 스프린트 방향

- [ ] **Sprint 6**: 정부공고 파이프라인 버그 수정 (score fallback, 분석보고서 DOCX, 절대URL)
- [ ] **Sprint 7**: 공고 자동 수집 스케줄러 + 분석 중 SSE 진행 표시
- [ ] **Sprint 8**: 회사 프로필 설정 → 지원서 품질 개선
- [ ] **Sprint 9**: Cloudflare R2 파일 스토리지 연동

---

## 금지 사항

| 금지 | 대안 |
|------|------|
| `print()` | `structlog` logger |
| `axios` | `fetch` |
| 절대 URL `http://localhost:8000` | 상대경로 `/api/...` |
| `.env` 커밋 | `.gitignore` 확인 |
| 최상위 optional 패키지 import | 함수 내 lazy import + try/except |
| `any` 타입 | `unknown` 또는 명확한 타입 |
| `time.sleep()` | `asyncio.sleep()` |
| magic number | 상수 또는 config |
