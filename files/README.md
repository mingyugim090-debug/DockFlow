# DocFlow AI

> **"말로 시키면 파일이 나온다"** — LLM + Agent 기반 올인원 문서 자동화 서비스

공인중개사, 세무사, 총무팀 등 오피스 업무의 **PPT·엑셀·계약서·보고서**를 자연어 명령 하나로 자동 생성합니다.

---

## 핵심 기능

| 기능 | 입력 예시 | 출력 |
|------|----------|------|
| PPT 자동 생성 | "3분기 부동산 시장 보고서 5슬라이드" | `.pptx` 파일 |
| 엑셀 자동 생성 | "임대 현황 정산 엑셀 만들어줘" | `.xlsx` 파일 |
| 계약서 생성 | "홍길동-김철수 임대차계약서 작성" | `.pdf` 파일 |
| 이메일 자동화 | 계약 요청 이메일 수신 → 계약서 발송 | 자동 처리 |
| 정기 보고서 | 매주 월요일 시장 동향 자동 생성 | 슬랙/이메일 |

---

## 빠른 시작

### 사전 준비
- Python 3.11+
- Node.js 20+
- Docker Desktop
- Anthropic API 키

### 1. 저장소 클론 및 환경 설정

```bash
git clone https://github.com/your-org/docflow-ai.git
cd docflow-ai
cp .env.example .env
# .env 파일을 열어 API 키 입력
```

### 2. Docker로 전체 실행

```bash
docker-compose up -d
```

| 서비스 | URL |
|--------|-----|
| 웹 UI | http://localhost:3000 |
| API 서버 | http://localhost:8000 |
| API 문서 | http://localhost:8000/docs |
| n8n | http://localhost:5678 |

### 3. 로컬 개발 환경

```bash
# 백엔드
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000

# 프론트엔드 (새 터미널)
cd frontend
pnpm install
pnpm dev
```

---

## 기술 스택

```
Backend:   Python 3.11 · FastAPI · Claude API · python-pptx · openpyxl
Frontend:  Next.js 14 · TypeScript · Tailwind CSS
자동화:    n8n (self-hosted)
AI:        Anthropic Claude Sonnet 4 (Tool Use)
```

---

## 프로젝트 구조

```
docflow-ai/
├── CLAUDE.md        ← Claude Code 지시서
├── TASKS.md         ← 개발 태스크
├── SKILLS.md        ← 기술 패턴 레퍼런스
├── ARCHITECTURE.md  ← 시스템 설계
├── backend/         ← FastAPI 서버
├── frontend/        ← Next.js 앱
├── n8n/             ← 워크플로우 정의
└── docs/            ← 상세 문서
```

---

## 개발 참여

개발을 시작하기 전에 반드시 순서대로 읽기:
1. `CLAUDE.md` — 코딩 규칙과 아키텍처 지시
2. `TASKS.md` — 현재 우선순위 확인
3. `ARCHITECTURE.md` — 시스템 설계 상세
4. `SKILLS.md` — 코드 패턴 레퍼런스

---

## 라이선스

MIT © 2026 DocFlow AI Team
