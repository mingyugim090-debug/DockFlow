FROM python:3.11-slim

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

# 서버 실행
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
