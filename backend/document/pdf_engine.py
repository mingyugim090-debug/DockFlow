"""PDF 생성 엔진 — Jinja2 HTML 렌더링 + weasyprint PDF 변환"""

from pathlib import Path
from typing import Any

import structlog
from jinja2 import Environment, FileSystemLoader, select_autoescape

logger = structlog.get_logger(__name__)

# 템플릿 디렉터리 (이 파일 기준 상대 경로)
_TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "html"

# Jinja2 환경 (lazy init)
_jinja_env: Environment | None = None


def _get_jinja_env() -> Environment:
    global _jinja_env
    if _jinja_env is None:
        _jinja_env = Environment(
            loader=FileSystemLoader(str(_TEMPLATE_DIR)),
            autoescape=select_autoescape(["html"]),
        )
    return _jinja_env


class PdfEngine:
    """weasyprint 기반 PDF 생성 엔진"""

    def create_from_template(
        self,
        template_name: str,
        context: dict[str, Any],
        output_path: Path,
    ) -> dict:
        """Jinja2 HTML 템플릿 → PDF 생성

        Args:
            template_name: 템플릿 파일명 (예: "lease_contract.html")
            context: 템플릿에 전달할 변수 딕셔너리
            output_path: 저장 경로

        Returns:
            dict: {"size_bytes": int}
        """
        from weasyprint import HTML

        env = _get_jinja_env()
        template = env.get_template(template_name)
        html_content = template.render(**context)

        # weasyprint는 base_url을 설정해야 상대 경로 리소스를 찾을 수 있음
        HTML(
            string=html_content,
            base_url=str(_TEMPLATE_DIR),
        ).write_pdf(str(output_path))

        file_size = output_path.stat().st_size
        logger.info(
            "pdf_created",
            template=template_name,
            size_bytes=file_size,
            path=str(output_path),
        )

        return {"size_bytes": file_size}

    def create_from_html(self, html_content: str, output_path: Path) -> dict:
        """직접 HTML 문자열 → PDF 생성"""
        from weasyprint import HTML

        HTML(string=html_content, base_url=str(_TEMPLATE_DIR)).write_pdf(
            str(output_path)
        )

        file_size = output_path.stat().st_size
        logger.info("pdf_from_html_created", size_bytes=file_size)
        return {"size_bytes": file_size}
