"""문서 생성 라우트 — 핵심 API 엔드포인트"""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

import structlog

from agent.orchestrator import DocumentOrchestrator
from agent.tools import get_all_tool_schemas, get_tool_schemas_for_format
from api.middleware.auth import get_current_user_id
from core.config import settings
from models.request import GenerateRequest
from models.response import (
    DocumentResponse,
    ErrorResponse,
    FileInfo,
    JobResponse,
    JobStatusResponse,
)

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api", tags=["generate"])

# ── 인메모리 작업 저장소 (Phase 1: 추후 Redis/DB로 교체) ──
_jobs: dict[str, dict] = {}


async def _save_document_to_supabase(
    user_id: str,
    file_info: dict,
    instruction: str,
) -> None:
    """Supabase documents 테이블에 문서 메타데이터 저장 (non-blocking)"""
    if user_id == "anonymous" or not settings.supabase_url or not settings.supabase_service_key:
        return

    try:
        from supabase import create_client  # type: ignore
        client = create_client(settings.supabase_url, settings.supabase_service_key)
        client.from_("documents").insert({
            "user_id": user_id,
            "file_id": file_info["file_id"],
            "filename": file_info["filename"],
            "format": file_info["format"],
            "instruction": instruction[:500],  # 최대 500자
            "size_bytes": file_info.get("size_bytes", 0),
        }).execute()
        logger.info("document_saved_to_supabase", file_id=file_info["file_id"], user_id=user_id)
    except Exception as e:
        logger.error("supabase_save_failed", error=str(e))
        # 저장 실패해도 문서 생성 결과는 유지


@router.post(
    "/generate",
    response_model=DocumentResponse,
    responses={500: {"model": ErrorResponse}},
)
async def generate_document(
    request: GenerateRequest,
    user_id: str = Depends(get_current_user_id),
):
    """통합 문서 생성 (동기 모드)

    자연어 명령을 받아 AI 에이전트가 적절한 문서를 생성합니다.
    """
    logger.info(
        "generate_request",
        instruction=request.instruction[:100],
        format=request.format,
        user_id=user_id,
    )

    try:
        orchestrator = DocumentOrchestrator()
        tools = get_tool_schemas_for_format(request.format)

        result = await orchestrator.run(
            instruction=request.instruction,
            context=request.context,
            tools=tools,
        )

        if result["status"] != "success" or not result["files"]:
            raise HTTPException(
                status_code=500,
                detail=result.get("message", "문서 생성에 실패했습니다."),
            )

        file_info = result["files"][0]

        # Supabase에 문서 메타데이터 저장 (실패해도 응답은 정상 반환)
        await _save_document_to_supabase(user_id, file_info, request.instruction)

        return DocumentResponse(
            file_id=file_info["file_id"],
            filename=file_info["filename"],
            format=file_info["format"],
            download_url=file_info["download_url"],
            created_at=datetime.now(timezone.utc).isoformat(),
            message=result.get("message", "문서가 성공적으로 생성되었습니다."),
            metadata={
                "size_bytes": file_info.get("size_bytes", 0),
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("generate_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"문서 생성 오류: {str(e)}")


@router.post(
    "/generate/async",
    response_model=JobResponse,
    status_code=202,
)
async def generate_document_async(
    request: GenerateRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
):
    """비동기 문서 생성 (202 Accepted → 폴링)

    긴 작업은 백그라운드에서 처리하고 job_id를 즉시 반환합니다.
    """
    job_id = str(uuid.uuid4())

    _jobs[job_id] = {
        "status": "processing",
        "files": [],
        "message": "",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "user_id": user_id,
    }

    background_tasks.add_task(_run_generation_job, job_id, request, user_id)

    return JobResponse(job_id=job_id, status="processing")


@router.get(
    "/jobs/{job_id}",
    response_model=JobStatusResponse,
)
async def get_job_status(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """작업 상태 조회"""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")

    files = [FileInfo(**f) for f in job.get("files", [])]

    return JobStatusResponse(
        job_id=job_id,
        status=job["status"],
        files=files,
        message=job.get("message", ""),
        duration_ms=job.get("duration_ms"),
        error=job.get("error"),
        progress=job.get("progress"),
    )


async def _run_generation_job(
    job_id: str,
    request: GenerateRequest,
    user_id: str,
):
    """백그라운드 생성 작업 실행"""
    import time

    start = time.time()

    try:
        _jobs[job_id]["progress"] = "AI 분석 중..."

        orchestrator = DocumentOrchestrator()
        tools = get_tool_schemas_for_format(request.format)

        result = await orchestrator.run(
            instruction=request.instruction,
            context=request.context,
            tools=tools,
        )

        elapsed_ms = int((time.time() - start) * 1000)

        _jobs[job_id].update({
            "status": result["status"],
            "files": result.get("files", []),
            "message": result.get("message", ""),
            "duration_ms": elapsed_ms,
        })

        # 성공 시 Supabase에 저장
        if result["status"] == "success" and result.get("files"):
            await _save_document_to_supabase(user_id, result["files"][0], request.instruction)

    except Exception as e:
        logger.error("job_failed", job_id=job_id, error=str(e))
        _jobs[job_id].update({
            "status": "failed",
            "error": str(e),
            "duration_ms": int((time.time() - start) * 1000),
        })


def _sse_event(event: str, data: dict) -> str:
    """SSE 이벤트 포맷 문자열 생성"""
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/generate/stream")
async def generate_document_stream(
    request: GenerateRequest,
    user_id: str = Depends(get_current_user_id),
):
    """SSE 스트리밍 문서 생성

    진행 상황을 Server-Sent Events로 실시간 전달합니다.
    클라이언트는 `text/event-stream`으로 수신합니다.

    이벤트 종류:
    - `progress`: 진행 상황 메시지 {"step": str, "message": str}
    - `complete`: 생성 완료 {"file_id": str, "filename": str, ...}
    - `error`: 오류 {"message": str}
    """

    async def event_generator() -> AsyncGenerator[str, None]:
        steps = [
            ("analyzing", "요청 분석 중..."),
            ("planning", "문서 구조 설계 중..."),
            ("generating", "파일 생성 중..."),
        ]

        try:
            for step, message in steps[:2]:
                yield _sse_event("progress", {"step": step, "message": message})
                await asyncio.sleep(0.3)

            yield _sse_event("progress", {"step": "generating", "message": "파일 생성 중..."})

            orchestrator = DocumentOrchestrator()
            tools = get_tool_schemas_for_format(request.format)

            result = await orchestrator.run(
                instruction=request.instruction,
                context=request.context,
                tools=tools,
            )

            if result["status"] != "success" or not result["files"]:
                yield _sse_event(
                    "error",
                    {"message": result.get("message", "문서 생성에 실패했습니다.")},
                )
                return

            file_info = result["files"][0]

            # Supabase 저장 (비동기, 스트림 응답에 영향 없도록)
            await _save_document_to_supabase(user_id, file_info, request.instruction)

            yield _sse_event(
                "complete",
                {
                    "file_id": file_info["file_id"],
                    "filename": file_info["filename"],
                    "format": file_info["format"],
                    "download_url": file_info["download_url"],
                    "message": result.get("message", "문서가 성공적으로 생성되었습니다."),
                },
            )

        except Exception as e:
            logger.error("stream_generate_failed", error=str(e))
            yield _sse_event("error", {"message": f"오류가 발생했습니다: {str(e)}"})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
