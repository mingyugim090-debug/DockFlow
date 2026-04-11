"""DocFlow AI — FastAPI 메인 앱"""

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 라이프사이클 — 시작/종료 시 처리"""
    logger.info(
        "docflow_api_starting",
        port=settings.backend_port,
        debug=settings.debug,
    )
    yield
    logger.info("docflow_api_shutting_down")


app = FastAPI(
    title="DocFlow AI API",
    description="LLM + Agent 기반 올인원 문서 자동화 서비스",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS 미들웨어 ──
origins = [origin.strip() for origin in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 라우터 등록 ──
from api.routes.health import router as health_router
from api.routes.generate import router as generate_router
from api.routes.files import router as files_router
from api.routes.documents import router as documents_router
from api.routes.slides import router as slides_router
from api.routes.workflows import router as workflows_router

app.include_router(health_router)
app.include_router(generate_router)
app.include_router(files_router)
app.include_router(documents_router)
app.include_router(slides_router)
app.include_router(workflows_router)


@app.get("/")
async def root():
    """루트 엔드포인트 — API 안내"""
    return {
        "service": "DocFlow AI",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }
