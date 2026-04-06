FROM python:3.11-slim

# WeasyPrint 시스템 의존성 (GTK, Pango, Cairo) — Linux에서 PDF 생성에 필요
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# uv 설치
RUN pip install uv

# 의존성 복사 및 설치
COPY pyproject.toml .
RUN uv sync --no-dev

# 소스 코드 복사
COPY . .

# 출력 디렉토리 생성
RUN mkdir -p outputs uploads

# 서버 실행 — Railway는 PORT 환경변수를 주입함
EXPOSE 8000
CMD uv run uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
