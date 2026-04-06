#!/bin/bash
# DocFlow AI 프로젝트 초기화 스크립트
# 사용법: bash scripts/init.sh

set -e

echo "==================================="
echo "  DocFlow AI 초기화 시작"
echo "==================================="

# 1. .env 파일 생성
if [ ! -f ".env" ]; then
  echo "→ .env 파일 생성 중..."
  cp .env.example .env
  echo "  ⚠️  .env 파일에 API 키를 입력하세요"
else
  echo "→ .env 파일 이미 존재"
fi

# 2. 필요 디렉토리 생성
echo "→ 디렉토리 생성 중..."
mkdir -p outputs uploads backend/tests frontend/public n8n/workflows

# 3. 백엔드 의존성 설치
echo "→ 백엔드 의존성 설치 중..."
cd backend
if command -v uv &> /dev/null; then
  uv sync
else
  echo "  ⚠️  uv가 없습니다. pip 사용"
  pip install -r requirements.txt
fi
cd ..

# 4. 프론트엔드 의존성 설치
echo "→ 프론트엔드 의존성 설치 중..."
cd frontend
if command -v pnpm &> /dev/null; then
  pnpm install
else
  npm install
fi
cd ..

echo ""
echo "==================================="
echo "  초기화 완료!"
echo "==================================="
echo ""
echo "다음 명령어로 개발 서버를 시작하세요:"
echo ""
echo "  # Docker 전체 실행"
echo "  docker-compose up -d"
echo ""
echo "  # 개별 실행"
echo "  cd backend && uv run uvicorn main:app --reload"
echo "  cd frontend && pnpm dev"
echo ""
echo "  # API 문서"
echo "  open http://localhost:8000/docs"
