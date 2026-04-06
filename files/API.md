# API.md — DocFlow AI API 명세

Base URL: `http://localhost:8000`
인증: `X-API-Key: {your-key}` (n8n 연동 시)

---

## 엔드포인트 목록

### 헬스체크
```
GET /health
→ { "status": "ok", "version": "0.1.0" }
```

---

### 문서 생성 (통합)

```
POST /api/generate
Content-Type: application/json

{
  "instruction": "string (필수) — 자연어 명령",
  "format": "pptx | xlsx | pdf | contract (선택, 기본: pptx)",
  "context": { ... 추가 정보 },
  "session_id": "string (선택) — 멀티턴 세션"
}

→ 202 Accepted
{
  "job_id": "uuid",
  "status": "processing"
}
```

---

### PPT 생성 (직접 호출)

```
POST /api/generate/ppt
{
  "title": "프레젠테이션 제목",
  "slides": [
    {
      "title": "슬라이드 제목",
      "layout": "content | two_column | title_only",
      "content": ["항목1", "항목2"],
      "notes": "발표자 노트"
    }
  ],
  "theme": "modern | classic | minimal | dark"
}
```

---

### 엑셀 생성 (직접 호출)

```
POST /api/generate/excel
{
  "filename": "파일명",
  "sheets": [
    {
      "name": "시트명",
      "headers": ["열1", "열2", "열3"],
      "rows": [
        ["값1", "값2", "값3"],
        ["값4", "값5", "값6"]
      ]
    }
  ],
  "add_total_row": true
}
```

---

### 계약서 생성 (공인중개사 특화)

```
POST /api/generate/contract
{
  "contract_type": "lease | sale | management",
  "landlord": {
    "name": "임대인 이름",
    "id_number": "주민등록번호",
    "address": "주소",
    "phone": "연락처"
  },
  "tenant": {
    "name": "임차인 이름",
    "id_number": "주민등록번호",
    "address": "주소",
    "phone": "연락처"
  },
  "property": {
    "address": "물건 소재지",
    "type": "아파트 | 오피스텔 | 단독주택 | 상가",
    "area_sqm": 84.5,
    "floor": 5,
    "total_floors": 15
  },
  "terms": {
    "deposit": 50000000,
    "monthly_rent": 1500000,
    "management_fee": 150000,
    "start_date": "2026-05-01",
    "end_date": "2028-04-30"
  }
}
```

---

### 작업 상태 조회

```
GET /api/jobs/{job_id}

→ 처리 중:
{
  "job_id": "uuid",
  "status": "processing",
  "progress": "파일 생성 중..."
}

→ 완료:
{
  "job_id": "uuid",
  "status": "success",
  "files": [
    {
      "file_id": "uuid",
      "filename": "보고서.pptx",
      "format": "pptx",
      "download_url": "/api/files/{file_id}",
      "size_bytes": 245760,
      "expires_at": "2026-04-02T11:00:00Z"
    }
  ],
  "message": "생성 완료 메시지",
  "duration_ms": 8240
}

→ 실패:
{
  "job_id": "uuid",
  "status": "failed",
  "error": "오류 메시지"
}
```

---

### 파일 다운로드

```
GET /api/files/{file_id}
→ 파일 바이너리 (Content-Disposition: attachment)
→ 404: 만료되었거나 존재하지 않는 파일
```

---

### 파일 업로드 (기존 파일 기반 생성)

```
POST /api/upload
Content-Type: multipart/form-data
file: [파일] (pptx, xlsx, pdf만 허용, 최대 50MB)

→ {
  "upload_id": "uuid",
  "filename": "원본파일명",
  "size_bytes": 102400
}
```

---

## 에러 코드

| 코드 | 의미 |
|------|------|
| 400 | 잘못된 요청 (Pydantic 검증 실패) |
| 403 | 인증 실패 (API Key 오류) |
| 404 | 파일/작업 없음 또는 만료 |
| 422 | 유효성 오류 (필수 필드 누락) |
| 500 | 서버 내부 오류 (Claude API 실패 등) |
| 503 | Claude API 일시적 오류 (재시도 가능) |
