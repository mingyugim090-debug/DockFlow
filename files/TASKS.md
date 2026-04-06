# TASKS.md — DocFlow AI 개발 태스크

> 상태: [ ] 대기 / [~] 진행중 / [x] 완료 / [!] 블로커
> 업데이트할 때마다 날짜 기록

---

## 현재 스프린트 (Phase 1 — MVP Core)

### 🔴 P0 — 이번 주 반드시 완료

- [x] **백엔드 프로젝트 초기화** (2026-04-03)
  - [x] `pyproject.toml` 설정 (openai, python-pptx, openpyxl, python-docx, jinja2, weasyprint)
  - [x] FastAPI 앱 기본 구조 (`main.py`, `core/config.py`)
  - [x] `.env.example` + `core/config.py` (pydantic-settings, OpenAI API)
  - [x] 헬스체크 엔드포인트 `GET /health`
  - [x] Docker 기본 설정 (`Dockerfile`, `docker-compose.yml`)

- [x] **OpenAI Function Calling 오케스트레이터 구현** (2026-04-03)
  - [x] `agent/orchestrator.py` — Function Calling 루프
  - [x] 시스템 프롬프트 (`agent/prompts/system.py`) — PPT/Excel/Word/PDF/검색 가이드 포함
  - [x] Tool 실행 디스패처 (`agent/tools/__init__.py`)
  - [x] 기본 에러 핸들링 + 재시도 로직

- [x] **PPT 생성 툴 (1호 기능)** (2026-04-03)
  - [x] `document/ppt_engine.py` — python-pptx 래퍼
  - [x] `agent/tools/ppt_tool.py`
  - [x] 슬라이드 레이아웃 3종: `title_only`, `content`, `two_column`
  - [x] 테마 4종: `modern`, `classic`, `minimal`, `dark`
  - [x] `POST /api/generate` 통합 엔드포인트

- [x] **기본 파일 다운로드** (2026-04-03)
  - [x] 생성 파일 임시 저장 (`OUTPUT_DIR`)
  - [x] `GET /api/files/{file_id}` 다운로드 엔드포인트
  - [x] 파일 만료 처리 (1시간 후 자동 삭제)

### 🟡 P1 — 이번 스프린트 내 완료

- [x] **엑셀 생성 툴** (2026-04-03)
  - [x] `document/excel_engine.py` — openpyxl 래퍼
  - [x] `agent/tools/excel_tool.py`
  - [x] 헤더 스타일링, 열 너비 자동 조정
  - [x] 합계 행 자동 추가 옵션

- [x] **워드 생성 툴** (2026-04-03)
  - [x] `document/word_engine.py` — python-docx 래퍼
  - [x] `agent/tools/word_tool.py`
  - [x] heading / paragraph / list 블록 지원

- [x] **PDF/계약서 생성 툴** (2026-04-03)
  - [x] `document/pdf_engine.py` — Jinja2 + weasyprint
  - [x] `agent/tools/pdf_tool.py`
  - [x] `templates/html/lease_contract.html` — 임대차계약서 표준 양식
  - [x] 전세/월세 계약 유형 지원
  - ⚠️ weasyprint는 Windows에서 GTK 런타임 필요 (배포 서버에서 동작)

- [x] **Tavily 웹 검색 툴** (2026-04-03)
  - [x] `agent/tools/search_tool.py`
  - [x] API 키 미설정 시 graceful fallback

- [x] **SSE 스트리밍** (2026-04-03)
  - [x] `POST /api/generate/stream` — Server-Sent Events
  - [x] progress / complete / error 이벤트

- [x] **통합 테스트** (2026-04-03)
  - [x] `tests/test_engines.py` — PPT, Excel, Word, PDF 엔진 테스트 (12 passed)
  - [x] `tests/test_tools.py` — Tool 레지스트리, 핸들러, 검색 모킹 (7 passed)

- [ ] **프론트엔드 SSE 연동**
  - [ ] `POST /api/generate/stream` 호출 → EventSource 수신
  - [ ] progress 단계별 UI 업데이트
  - [ ] 완료 후 파일 다운로드 버튼 표시

---

## Phase 2 — Agent 고도화 (2~3주차)

### 🟡 P1

- [ ] **웹 검색 툴 연동**
  - [ ] Tavily API 연결 (`agent/tools/search_tool.py`)
  - [ ] "최신 서울 아파트 시세 포함해서 보고서 만들어줘" 동작 확인
  - [ ] 검색 결과 → 문서 반영 파이프라인

- [ ] **PDF/계약서 생성**
  - [ ] `document/contract_engine.py` — 임대차계약서 전용
  - [ ] Jinja2 HTML 템플릿 (계약서 양식)
  - [ ] weasyprint PDF 변환
  - [ ] `POST /api/generate/contract`
  - [ ] 필수 필드: 임대인/임차인/주소/보증금/월세/기간

- [ ] **멀티턴 대화 (수정 기능)**
  - [ ] 대화 히스토리 관리 (`ConversationManager`)
  - [ ] "3페이지 제목 바꿔줘", "월세 50만원으로 수정해줘" 동작
  - [ ] 세션 ID 기반 상태 관리

- [ ] **n8n 연동**
  - [ ] n8n Docker Compose 추가
  - [ ] 기본 웹훅 워크플로우 — Webhook → HTTP Request → 파일 생성
  - [ ] n8n → FastAPI 인증 (API Key)
  - [ ] 워크플로우 JSON 파일 저장 (`n8n/workflows/`)

### 🟢 P2

- [ ] **파일 업로드 → 기반 문서 생성**
  - [ ] `POST /api/upload` — 기존 PPT/엑셀/PDF 업로드
  - [ ] 기존 파일 분석 → 새 문서 생성 기반으로 활용
  - [ ] "이 계약서 양식으로 새로 작성해줘"

- [ ] **스트리밍 진행 상황**
  - [ ] SSE(Server-Sent Events) 엔드포인트
  - [ ] 단계별 상태: `분석중 → 구조 설계 → 파일 생성 → 완료`
  - [ ] 프론트엔드 진행 바 연동

---

## Phase 3 — 도메인 특화 (3~4주차)

- [ ] **공인중개사 특화 기능**
  - [ ] 임대차계약서 자동완성 (법정 표준 양식 기반)
  - [ ] 매물 소개 PPT 템플릿 (사진 슬롯 포함)
  - [ ] 월세 수익 정산 엑셀 (자동 합계/세금 계산)
  - [ ] 관리비 명세서 PDF

- [ ] **템플릿 라이브러리**
  - [ ] 업종별 템플릿 카탈로그 UI
  - [ ] 템플릿 저장/불러오기 API
  - [ ] 사용자 커스텀 템플릿 저장

- [ ] **이메일 자동화 (n8n)**
  - [ ] Gmail Trigger → 계약 요청 감지
  - [ ] 자동 계약서 생성 → 이메일 첨부 발송
  - [ ] 처리 완료 알림

---

## Phase 4 — 서비스화 (5~8주차)

- [ ] **사용자 인증**
  - [ ] Supabase Auth 연동
  - [ ] JWT 기반 API 보호
  - [ ] 회원가입/로그인 UI

- [ ] **파일 영구 저장**
  - [ ] Cloudflare R2 연동
  - [ ] 사용자별 파일 이력
  - [ ] 공유 링크 생성

- [ ] **결제 (구독)**
  - [ ] 토스페이먼츠 연동
  - [ ] Free/Pro 플랜 구분
  - [ ] 사용량 제한 (월 N회)

- [ ] **외부 연동 MCP**
  - [ ] Google Drive MCP
  - [ ] Notion MCP
  - [ ] Slack 알림

---

## 버그 & 기술 부채

> 발견 즉시 여기에 추가

- [ ] (발견 시 추가)

---

## 완료된 태스크

> 완료 시 날짜와 함께 이동

- [x] 프로젝트 컨셉 확정 (2026-04-02)
- [x] 기술 스택 선정 (2026-04-02)
- [x] 아키텍처 설계 (2026-04-02)
- [x] 개발 문서 준비 (2026-04-02)
- [x] Phase 1 MVP Core 개발 (2026-04-03)

---

## 메모 / 결정 사항

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-02 | python-pptx 선택 (pptx 생성) | 세밀한 레이아웃 제어 가능, 한국어 폰트 지원 |
| 2026-04-02 | n8n은 파이프라인만, 문서 생성은 FastAPI | n8n으로 binary 파일 처리 한계 |
| 2026-04-02 | Phase 1은 공인중개사 단일 도메인 집중 | 범용보다 특화가 초기 PMF에 유리 |
| 2026-04-02 | uv 패키지 매니저 선택 | pip/poetry보다 빠르고 lock 파일 안정적 |
| 2026-04-03 | Anthropic → OpenAI API로 변경 | 사용자 요청, config.py/orchestrator.py 이미 OpenAI 기반 |
| 2026-04-03 | PDF는 Jinja2 + weasyprint 선택 | HTML 템플릿 커스터마이즈 용이, CSS 기반 스타일링 |
| 2026-04-03 | weasyprint Windows에서 GTK 필요 | 개발은 Windows, 배포는 Linux Docker → 운영 환경에서 정상 동작 |
