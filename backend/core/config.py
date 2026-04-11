"""환경변수 설정 — pydantic-settings 기반"""

from pathlib import Path
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

    # ── 모델 ──
    default_model: str = "gpt-4o"
    fast_model: str = "gpt-4o-mini"

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

    def model_post_init(self, __context) -> None:
        """시작 시 필수 디렉토리 자동 생성"""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)


settings = Settings()
