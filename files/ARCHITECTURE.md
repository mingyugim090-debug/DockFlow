# ARCHITECTURE.md — DocFlow AI 시스템 설계

---

## 시스템 개요

```
사용자 (자연어 명령)
        ↓
[Frontend — Next.js]  ←→  [n8n 워크플로우]
        ↓                        ↓
[Backend — FastAPI]  ←←←←←←←←←←←
        ↓
[Claude Agent — Tool Use 루프]
        ↓
[문서 엔진 — python-pptx / openpyxl / reportlab]
        ↓
[파일 저장 — 로컬 / R2]
```

---

## 레이어별 책임

### Layer 1: 진입점 (Entry Points)

| 진입점 | 방식 | 용도 |
|--------|------|------|
| 웹 UI | HTTP POST | 일반 사용자 인터랙티브 |
| n8n Webhook | HTTP POST | 외부 이벤트 트리거 |
| n8n 이메일 트리거 | Gmail API | 이메일 자동화 |
| n8n 스케줄러 | Cron | 정기 보고서 자동 생성 |
| 텔레그램 봇 | Webhook | 모바일 간편 요청 |

모든 진입점은 최종적으로 `POST /api/generate` 단일 엔드포인트로 수렴한다.

### Layer 2: 오케스트레이션 (FastAPI + Claude Agent)

`DocumentOrchestrator` 클래스가 다음을 담당:
1. 사용자 요청을 Claude에 전달
2. Claude가 선택한 툴 실행
3. 툴 결과를 Claude에 피드백
4. 완료까지 루프 반복 (최대 5회)
5. 최종 파일 정보 반환

### Layer 3: 도구 레이어 (Tools)

각 툴은 독립적인 파일로 관리:

```
agent/tools/
├── __init__.py     ← TOOL_REGISTRY 딕셔너리
├── ppt_tool.py     ← PPT 생성
├── excel_tool.py   ← 엑셀 생성
├── pdf_tool.py     ← PDF 생성
├── contract_tool.py ← 계약서 특화
└── search_tool.py  ← 웹 검색
```

각 툴 파일의 구조:
- `{NAME}_TOOL_SCHEMA` — Claude에 전달하는 JSON 스키마
- `handle_{name}()` — 실제 실행 함수 (async)

### Layer 4: 문서 엔진 (Document Engines)

툴과 분리된 순수 문서 생성 로직:

```
document/
├── ppt_engine.py     ← python-pptx 래퍼
├── excel_engine.py   ← openpyxl 래퍼
├── pdf_engine.py     ← reportlab 래퍼
└── contract_engine.py ← Jinja2 + weasyprint
```

엔진은 Claude/AI에 대한 의존성이 없다. 입력 JSON → 파일 출력만 담당.

---

## API 설계

### 핵심 엔드포인트

#### `POST /api/generate`
```json
요청:
{
  "instruction": "3분기 부동산 시장 보고서 PPT 5슬라이드",
  "format": "pptx",
  "context": {
    "company": "서울 부동산 중개",
    "date": "2026-04-02"
  }
}

응답 (202 Accepted → SSE 또는 polling):
{
  "job_id": "uuid",
  "status": "processing",
  "estimated_seconds": 15
}
```

#### `GET /api/jobs/{job_id}`
```json
응답 (완료):
{
  "job_id": "uuid",
  "status": "success",
  "files": [
    {
      "file_id": "uuid",
      "filename": "3분기_부동산시장_보고서.pptx",
      "format": "pptx",
      "download_url": "/api/files/{file_id}",
      "size_bytes": 245760
    }
  ],
  "message": "5슬라이드 PPT를 생성했습니다.",
  "duration_ms": 8240
}
```

#### `GET /api/files/{file_id}`
파일 다운로드 (Content-Disposition: attachment)

#### `POST /api/generate/contract` (공인중개사 특화)
```json
요청:
{
  "contract_type": "lease",
  "landlord": {"name": "홍길동", "id": "123456-1234567"},
  "tenant": {"name": "김철수", "id": "234567-2345678"},
  "property": {
    "address": "서울시 마포구 ...",
    "type": "아파트",
    "area_sqm": 84.5
  },
  "terms": {
    "deposit": 50000000,
    "monthly_rent": 1500000,
    "start_date": "2026-05-01",
    "end_date": "2028-04-30"
  }
}
```

---

## 데이터 흐름 상세

### PPT 생성 흐름

```
1. 클라이언트: POST /api/generate
   { "instruction": "3분기 실적 보고서 PPT" }

2. FastAPI: GenerateRequest 파싱 + 검증

3. DocumentOrchestrator.run() 호출
   → Claude API 첫 호출
   → Claude: "create_ppt 툴을 사용해야겠다"
   → tool_use 블록 반환:
     {
       "name": "create_ppt",
       "input": {
         "title": "2026 3분기 실적 보고서",
         "slides": [
           {"title": "목차", "layout": "content", "content": ["1. 매출 현황", "2. 지역별 분석"]},
           {"title": "매출 현황", "content": ["총 매출: 3.2억", "전분기 대비: +12%"]},
           ...
         ],
         "theme": "modern"
       }
     }

4. _execute_tools() → handle_create_ppt() 실행
   → PptEngine.create() 호출
   → ./outputs/{uuid}.pptx 파일 생성
   → tool_result 반환

5. Claude API 두 번째 호출 (결과 포함)
   → Claude: "파일이 생성되었습니다" (end_turn)

6. 응답 반환:
   { "file_id": "uuid", "download_url": "/api/files/uuid" }
```

---

## n8n 워크플로우 설계

### Workflow 1: 이메일 → 계약서 자동 생성

```
[Gmail Trigger]
  이메일 수신 (제목: "계약서 요청" 포함)
      ↓
[IF Node]
  조건: 이메일 본문에 "임대" 또는 "매매" 포함?
  Yes ↓         No → [종료]
[Claude AI Node]
  프롬프트: "이메일에서 계약 정보 JSON 추출:
  임대인, 임차인, 주소, 보증금, 월세, 기간"
      ↓
[HTTP Request Node]
  POST http://backend:8000/api/generate/contract
  Headers: { X-API-Key: ${N8N_API_KEY} }
  Body: { 추출된 JSON }
      ↓
[HTTP Request Node]
  GET /api/files/{file_id} → 파일 다운로드
      ↓
[Gmail Node]
  To: 발신자 이메일
  Subject: "계약서 생성 완료"
  Attachment: 다운로드한 파일
```

### Workflow 2: 매주 월요일 시장 분석 보고서

```
[Schedule Trigger: 매주 월요일 9:00]
      ↓
[HTTP Request: Tavily API]
  query: "이번 주 서울 아파트 시세 동향"
      ↓
[HTTP Request: DocFlow API]
  POST /api/generate
  { instruction: "부동산 주간 시장 동향 보고서 PPT, 검색 결과 포함", context: { 검색결과 } }
      ↓
[Google Drive Node]
  파일 업로드 → 공유 드라이브/보고서 폴더
      ↓
[Slack Node]
  "이번 주 시장 동향 보고서가 업로드되었습니다. {공유링크}"
```

---

## 보안 고려사항

### API 인증
- 웹 UI → API: JWT (추후 Supabase Auth)
- n8n → API: API Key (`X-API-Key` 헤더)
- API Key는 환경변수로만 관리, 코드에 하드코딩 금지

### 파일 보안
- 생성 파일은 UUID 기반 랜덤 경로 (`/outputs/{uuid}.pptx`)
- 직접 경로 추측 불가
- TTL 1시간 후 자동 삭제
- 파일 크기 50MB 제한

### 입력 검증
- Pydantic으로 모든 입력 검증
- SQL Injection 방어 (ORM 사용)
- 파일 업로드: 허용 확장자만 (`pptx`, `xlsx`, `pdf`)

---

## 확장성 고려

### 현재 (Phase 1~2)
- 단일 서버, 로컬 파일 저장
- 동시 요청: ~10개 (FastAPI 비동기)
- 충분한 수준의 소규모 서비스

### 추후 확장 시
- 파일 저장: Cloudflare R2 (무제한 확장)
- 작업 큐: Redis + Celery (긴 작업 비동기 처리)
- DB: Supabase PostgreSQL (사용자/이력 관리)
- CDN: Cloudflare (정적 자산)
- 멀티 리전: 필요 시 Fly.io 또는 Railway
