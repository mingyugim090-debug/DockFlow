"""환경변수 설정 — pydantic-settings 기반"""

from pathlib import Path
from typing import Any
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── AI ──
    openai_api_key: str = ""
    tavily_api_key: str = ""

    # ── 클라우드 모델 ──
    default_model: str = "gpt-4o"
    fast_model: str = "gpt-4o-mini"

    # ── 로컬 모델 (Ollama / gemma4) ──
    local_model_enabled: bool = True
    local_model_base_url: str = "http://localhost:11434/v1"
    local_model_name: str = "gemma4:e4b"
    local_model_api_key: str = "ollama"
    local_model_temperature: float = 0.1

    # ── 외부 API ──
    bizinfo_api_key: str = ""  # 기업마당 공고 수집 인증키

    # ── 파일 저장 ──
    output_dir: Path = Path("./outputs")
    upload_dir: Path = Path("./uploads")
    max_file_size_mb: int = 50
    file_ttl_hours: int = 1

    # ── 서버 ──
    backend_port: int = 8000
    frontend_port: int = 3000
    debug: bool = False
    cors_origins: str = "http://localhost:3000,https://dock-flow-ten.vercel.app"

    # ── n8n ──
    n8n_api_key: str = ""

    # ── Supabase ──
    supabase_url: str = ""
    supabase_service_key: str = ""

    # ── 인증 ──
    require_auth: bool = True  # 운영 기본값 True. 로컬은 .env에서 REQUIRE_AUTH=false

    @property
    def local_model(self) -> dict[str, Any]:
        """로컬 모델 설정을 딕셔너리로 반환한다."""
        return {
            "enabled": self.local_model_enabled,
            "base_url": self.local_model_base_url,
            "model": self.local_model_name,
            "api_key": self.local_model_api_key,
            "temperature": self.local_model_temperature,
        }

    def model_post_init(self, __context) -> None:
        """시작 시 필수 디렉토리 자동 생성"""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)


settings = Settings()
