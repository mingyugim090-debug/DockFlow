# WORKFLOWS.md — n8n 워크플로우 가이드

---

## n8n 접속

URL: http://localhost:5678
계정: admin / (`.env`의 `N8N_PASSWORD`)

---

## 워크플로우 목록

### WF-01: 이메일 → 계약서 자동 생성

**파일**: `n8n/workflows/email_to_contract.json`
**트리거**: Gmail 이메일 수신 (제목에 "계약서" 포함)
**출력**: 계약서 PDF → 발신자에게 자동 회신

```
Gmail Trigger
  ↓ (필터: 제목에 "계약서" 포함)
IF Node (임대 vs 매매 분기)
  ↓
Claude AI Node (계약 정보 추출)
  프롬프트: "이메일에서 계약 정보를 JSON으로 추출해줘:
  임대인, 임차인, 주소, 보증금, 월세, 계약 기간"
  ↓
HTTP Request (DocFlow API)
  POST /api/generate/contract
  Body: 추출된 JSON
  ↓
Wait (작업 완료까지 폴링)
  GET /api/jobs/{job_id}
  간격: 3초, 최대: 10회
  ↓
HTTP Request (파일 다운로드)
  GET /api/files/{file_id}
  ↓
Gmail Send
  To: 원래 발신자
  Subject: Re: {원래 제목} - 계약서 생성 완료
  Body: "계약서가 생성되었습니다. 첨부파일을 확인하세요."
  Attachment: 계약서 PDF
```

---

### WF-02: 주간 부동산 시장 보고서

**파일**: `n8n/workflows/weekly_report.json`
**트리거**: Cron (매주 월요일 오전 9시)
**출력**: 시장 동향 PPT → Google Drive 저장 + Slack 알림

```
Schedule Trigger (월요일 09:00)
  ↓
HTTP Request (Tavily 검색)
  query: "서울 아파트 시세 이번 주 동향"
  ↓
Code Node (검색 결과 정리)
  JS: 검색 결과 → 요약 텍스트 변환
  ↓
HTTP Request (DocFlow API)
  POST /api/generate
  {
    "instruction": "이번 주 서울 부동산 시장 동향 보고서 PPT 5슬라이드",
    "context": { "search_results": {{ $json.results }} }
  }
  ↓
Wait (완료 대기)
  ↓
HTTP Request (파일 다운로드)
  ↓
Google Drive (파일 업로드)
  폴더: /부동산보고서/2026
  파일명: {YYYY-MM-DD}_주간시장동향.pptx
  ↓
Slack (알림 발송)
  Channel: #부동산팀
  Message: "이번 주 시장 동향 보고서 업로드 완료 🏢\n{공유링크}"
```

---

### WF-03: 텔레그램 봇 인터페이스

**파일**: `n8n/workflows/telegram_bot.json`
**트리거**: Telegram 메시지 수신
**용도**: 모바일에서 간편하게 문서 생성 요청

```
Telegram Trigger
  ↓
IF Node (명령 분기)
  /ppt → PPT 생성 흐름
  /excel → 엑셀 생성 흐름
  /contract → 계약서 생성 흐름
  기타 → Claude AI로 자유 형식 처리
  ↓
Telegram Send ("요청을 받았습니다. 잠시 기다려주세요...")
  ↓
HTTP Request (DocFlow API)
  ↓
Wait
  ↓
Telegram Send (파일 또는 다운로드 링크 전송)
```

---

## n8n HTTP Request 노드 설정

DocFlow API 호출 시 공통 설정:

```
Method: POST
URL: http://backend:8000/api/generate
Headers:
  Content-Type: application/json
  X-API-Key: {{ $env.N8N_API_KEY }}
Body Type: JSON
```

Docker 환경에서 내부 통신은 `http://backend:8000` 사용
(localhost가 아닌 서비스명 사용)

---

## 워크플로우 가져오기/내보내기

```bash
# 워크플로우 내보내기 (백업)
curl -X GET \
  http://localhost:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: your-api-key" \
  | python3 -m json.tool > n8n/workflows/backup_$(date +%Y%m%d).json

# 워크플로우 가져오기
curl -X POST \
  http://localhost:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d @n8n/workflows/email_to_contract.json
```
