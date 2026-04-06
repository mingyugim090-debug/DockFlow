#!/usr/bin/env bash
# DocFlow AI — Git 훅 설치 스크립트
# 사용법: ./scripts/install-hooks.sh  (한 번만 실행)

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
GREEN='\033[0;32m'
NC='\033[0m'

echo "DocFlow AI — Git 훅 설치 중..."

# Git에 훅 디렉토리 등록
git config core.hooksPath .githooks

# 실행 권한 부여
chmod +x "$REPO_ROOT/.githooks/pre-commit"

echo -e "${GREEN}완료.${NC} .githooks/pre-commit 이 커밋 전 자동 실행됩니다."
echo ""
echo "수동 실행: ./scripts/validate.sh"
echo "훅 우회 (비상시만): git commit --no-verify"
