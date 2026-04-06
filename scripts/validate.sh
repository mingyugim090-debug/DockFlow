#!/usr/bin/env bash
# DocFlow AI — 전체 검증 스크립트 (push 전 실행 권장)
# 사용법: ./scripts/validate.sh [--full]
#
# 기본: TypeScript + Python 임포트 (빠름 ~30초)
# --full: + ruff lint + pytest (느림 ~2분)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS="${GREEN}✓${NC}"
FAIL="${RED}✗${NC}"
INFO="${BLUE}→${NC}"

FULL_MODE=false
[[ "$1" == "--full" ]] && FULL_MODE=true

ERRORS=0
REPO_ROOT="$(git rev-parse --show-toplevel)"

# uv 명령어 찾기 (Windows PATH에 없을 수 있음)
_find_uv() {
  if command -v uv &>/dev/null; then
    echo "uv"
  else
    local candidates=(
      "$HOME/AppData/Local/Python/pythoncore-3.14-64/Scripts/uv.exe"
      "$HOME/AppData/Local/Python/pythoncore-3.12-64/Scripts/uv.exe"
      "$HOME/AppData/Roaming/Python/Scripts/uv.exe"
      "$HOME/.cargo/bin/uv"
      "$HOME/.local/bin/uv"
    )
    for c in "${candidates[@]}"; do
      [ -x "$c" ] && echo "$c" && return
    done
    echo ""
  fi
}
UV=$(_find_uv)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DocFlow AI 검증 스크립트"
if $FULL_MODE; then echo "  모드: FULL (lint + test 포함)"; else echo "  모드: 기본 (빠른 검증)"; fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ──────────────────────────────────────────
# [1] Frontend: TypeScript 컴파일
# ──────────────────────────────────────────
echo ""
echo -e "${INFO} [Frontend] TypeScript 컴파일..."
cd "$REPO_ROOT/frontend"

if npx tsc --noEmit 2>&1; then
  echo -e "   $PASS tsc --noEmit 통과"
else
  echo -e "   $FAIL TypeScript 오류 발생"
  echo "     체크리스트:"
  echo "       □ 훅 사용 파일 첫 줄에 'use client'; 있는가?"
  echo "       □ JSX 삼항 연산자 닫기: )} → }"
  echo "       □ import한 파일이 실제로 존재하고 git에 있는가?"
  ERRORS=$((ERRORS + 1))
fi

# ──────────────────────────────────────────
# [2] Frontend: Next.js lint (--full 시만)
# ──────────────────────────────────────────
if $FULL_MODE; then
  echo ""
  echo -e "${INFO} [Frontend] Next.js lint..."
  if npx next lint 2>&1; then
    echo -e "   $PASS next lint 통과"
  else
    echo -e "   $FAIL lint 오류 (경고는 무시 가능, 에러는 수정 필요)"
    ERRORS=$((ERRORS + 1))
  fi
fi

# ──────────────────────────────────────────
# [3] Backend: Python 앱 임포트 테스트
# ──────────────────────────────────────────
echo ""
echo -e "${INFO} [Backend] Python 앱 임포트 테스트..."
cd "$REPO_ROOT/backend"

if [ -z "$UV" ]; then
  echo -e "   ${YELLOW}[건너뜀]${NC} uv를 찾을 수 없습니다. PATH에 uv를 추가하세요."
  echo "     위치: $(command -v uv 2>/dev/null || echo '없음')"
else
  if "$UV" run --no-sync python -c "
from main import app
print('라우터 수:', len(app.routes))
print('앱 임포트 OK')
" 2>&1; then
    echo -e "   $PASS Backend 임포트 성공"
  else
    echo -e "   $FAIL Backend 임포트 실패 — Railway 배포 시 healthcheck 실패 예상"
    echo "     체크리스트:"
    echo "       □ 최상위 import에 pyproject.toml에 없는 패키지 없는가?"
    echo "       □ main.py에 등록한 라우터 파일이 실제로 존재하는가?"
    echo "       □ 문법 오류 없는가?"
    ERRORS=$((ERRORS + 1))
  fi
fi

# ──────────────────────────────────────────
# [4] Backend: ruff lint (--full 시만)
# ──────────────────────────────────────────
if $FULL_MODE && [ -n "$UV" ]; then
  echo ""
  echo -e "${INFO} [Backend] ruff lint..."
  if "$UV" run ruff check . 2>&1; then
    echo -e "   $PASS ruff 통과"
  else
    echo -e "   $FAIL ruff 오류 ($UV run ruff check --fix . 로 자동 수정 가능)"
    ERRORS=$((ERRORS + 1))
  fi
fi

# ──────────────────────────────────────────
# [5] Backend: pytest (--full 시만)
# ──────────────────────────────────────────
if $FULL_MODE && [ -n "$UV" ]; then
  echo ""
  echo -e "${INFO} [Backend] pytest..."
  if "$UV" run pytest tests/ -v --tb=short 2>&1; then
    echo -e "   $PASS 테스트 통과"
  else
    echo -e "   $FAIL 테스트 실패"
    ERRORS=$((ERRORS + 1))
  fi
fi

# ──────────────────────────────────────────
# [6] Git: untracked 파일 경고
# ──────────────────────────────────────────
echo ""
echo -e "${INFO} [Git] Untracked 파일 확인..."
cd "$REPO_ROOT"

UNTRACKED=$(git status --porcelain | grep '^??' | grep -E '\.(py|ts|tsx)$' | head -10 || true)
if [ -n "$UNTRACKED" ]; then
  echo -e "   ${YELLOW}[경고]${NC} Untracked .py/.ts/.tsx 파일이 있습니다:"
  echo "$UNTRACKED" | sed 's/^/          /'
  echo "          이 파일들이 import되고 있다면 반드시 git add 하세요"
else
  echo -e "   $PASS Untracked 코드 파일 없음"
fi

# ──────────────────────────────────────────
# 결과
# ──────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}검증 실패: ${ERRORS}개 오류${NC}"
  echo "오류를 수정한 후 다시 실행하세요."
  exit 1
else
  echo -e "${GREEN}모든 검증 통과${NC} — 커밋/푸시 준비 완료"
  if ! $FULL_MODE; then
    echo "더 철저한 검사: ./scripts/validate.sh --full"
  fi
  exit 0
fi
