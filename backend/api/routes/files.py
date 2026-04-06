"""파일 업로드 / 다운로드 라우트"""

import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

import structlog

from core.config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api", tags=["files"])


def _extract_text(path: Path, filename: str, content: bytes) -> str:
    """파일 내용에서 텍스트 추출 (형식별 처리)"""
    ext = Path(filename).suffix.lower()
    try:
        if ext == ".docx":
            from docx import Document  # type: ignore
            doc = Document(path)
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

        elif ext == ".xlsx":
            import openpyxl  # type: ignore
            wb = openpyxl.load_workbook(path, data_only=True)
            rows: list[str] = []
            for sheet in wb.worksheets:
                rows.append(f"[시트: {sheet.title}]")
                for row in sheet.iter_rows(values_only=True):
                    row_text = " | ".join(str(c) for c in row if c is not None)
                    if row_text.strip():
                        rows.append(row_text)
                    if len(rows) > 200:
                        break
            return "\n".join(rows)

        elif ext == ".pptx":
            from pptx import Presentation  # type: ignore
            prs = Presentation(path)
            texts: list[str] = []
            for i, slide in enumerate(prs.slides, 1):
                texts.append(f"[슬라이드 {i}]")
                for shape in slide.shapes:
                    if hasattr(shape, "text") and shape.text.strip():
                        texts.append(shape.text)
            return "\n".join(texts)

        elif ext in (".txt", ".md", ".csv"):
            return content.decode("utf-8", errors="ignore")

        else:
            return f"[파일 업로드됨: {filename}]"

    except Exception as exc:
        logger.warning("text_extraction_failed", filename=filename, error=str(exc))
        return f"[파일 업로드됨: {filename} — 텍스트 추출 불가]"

# 확장자 → MIME 타입 매핑
MIME_TYPES = {
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pdf": "application/pdf",
}


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """파일 업로드 및 텍스트 추출

    업로드된 파일을 저장하고 텍스트 내용을 추출하여 반환합니다.
    이후 /api/generate/async 호출 시 extracted_text를 context에 포함해 사용합니다.
    """
    upload_id = str(uuid.uuid4())
    upload_dir = settings.upload_dir
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename or "upload").name
    save_path = upload_dir / f"{upload_id}_{safe_name}"

    content = await file.read()
    save_path.write_bytes(content)

    extracted = _extract_text(save_path, safe_name, content)
    # AI 컨텍스트 한도: 최대 4000자
    extracted_trimmed = extracted[:4000]

    logger.info("file_uploaded", upload_id=upload_id, filename=safe_name, size=len(content))

    return {
        "upload_id": upload_id,
        "filename": safe_name,
        "size_bytes": len(content),
        "extracted_text": extracted_trimmed,
    }


@router.get("/files/{file_id}")
async def download_file(file_id: str):
    """생성된 파일 다운로드

    UUID 기반 파일 경로로 접근합니다.
    파일은 생성 후 1시간 뒤 자동 삭제됩니다.
    """
    # 지원 확장자 탐색
    for ext in MIME_TYPES:
        file_path = settings.output_dir / f"{file_id}{ext}"
        if file_path.exists():
            media_type = MIME_TYPES[ext]

            logger.info(
                "file_download",
                file_id=file_id,
                ext=ext,
                size=file_path.stat().st_size,
            )

            return FileResponse(
                path=str(file_path),
                media_type=media_type,
                filename=f"docflow_{file_id[:8]}{ext}",
                headers={
                    "Content-Disposition": f'attachment; filename="docflow_{file_id[:8]}{ext}"',
                },
            )

    raise HTTPException(
        status_code=404,
        detail="파일을 찾을 수 없습니다. 만료되었거나 존재하지 않는 파일입니다.",
    )
