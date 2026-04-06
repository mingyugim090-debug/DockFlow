"""PDF/계약서 생성 Tool — OpenAI Function Calling 정의 + 핸들러"""

import uuid
from typing import Any

import structlog

logger = structlog.get_logger(__name__)

# ── Tool 스키마 ──
PDF_TOOL_SCHEMA = {
    "name": "create_pdf_contract",
    "description": (
        "부동산 임대차 계약서 PDF를 생성합니다. "
        "임대인, 임차인, 부동산 정보, 보증금/월세, 계약 기간을 입력하세요. "
        "표준 임대차계약서 양식으로 출력됩니다."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "contract_type": {
                "type": "string",
                "enum": ["jeonse", "monthly"],
                "description": "계약 유형 — jeonse(전세), monthly(월세)",
            },
            "property_address": {
                "type": "string",
                "description": "부동산 소재지 (예: 서울특별시 강남구 테헤란로 123)",
            },
            "building_area": {
                "type": "string",
                "description": "건물 면적 (예: 84.5)",
            },
            "deposit_krw": {
                "type": "string",
                "description": "보증금 한글 표기 (예: 금 삼억원 정)",
            },
            "monthly_rent_krw": {
                "type": "string",
                "description": "월세 한글 표기 (예: 금 오십만원 정) — monthly 계약 시 필수",
            },
            "rent_payment_day": {
                "type": "string",
                "description": "월세 납부일 (예: 매월 10일)",
            },
            "start_date": {
                "type": "string",
                "description": "임대 시작일 (예: 2026년 5월 1일)",
            },
            "end_date": {
                "type": "string",
                "description": "임대 종료일 (예: 2028년 4월 30일)",
            },
            "period_months": {
                "type": "string",
                "description": "계약 기간 (개월) (예: 24)",
            },
            "landlord_name": {
                "type": "string",
                "description": "임대인 성명",
            },
            "landlord_address": {
                "type": "string",
                "description": "임대인 주소",
            },
            "landlord_phone": {
                "type": "string",
                "description": "임대인 연락처",
            },
            "tenant_name": {
                "type": "string",
                "description": "임차인 성명",
            },
            "tenant_address": {
                "type": "string",
                "description": "임차인 주소",
            },
            "tenant_phone": {
                "type": "string",
                "description": "임차인 연락처",
            },
            "contract_date": {
                "type": "string",
                "description": "계약 체결일 (예: 2026년 4월 15일)",
            },
            "special_terms": {
                "type": "string",
                "description": "특약 사항 (선택)",
            },
            "agent_name": {
                "type": "string",
                "description": "공인중개사 성명 (선택)",
            },
            "agent_office": {
                "type": "string",
                "description": "공인중개사 사무소명 (선택)",
            },
            "agent_phone": {
                "type": "string",
                "description": "공인중개사 연락처 (선택)",
            },
        },
        "required": [
            "contract_type",
            "property_address",
            "deposit_krw",
            "start_date",
            "end_date",
            "landlord_name",
            "tenant_name",
            "contract_date",
        ],
    },
}


async def handle_create_pdf_contract(tool_input: dict[str, Any]) -> dict:
    """임대차계약서 PDF 생성 핸들러

    Args:
        tool_input: OpenAI Function Calling에서 전달받은 인자

    Returns:
        dict: 생성 결과 (file_id, filename, download_url 등)
    """
    import asyncio
    from document.pdf_engine import PdfEngine
    from core.config import settings

    file_id = str(uuid.uuid4())
    contract_type = tool_input.get("contract_type", "monthly")
    landlord = tool_input.get("landlord_name", "임대인")
    tenant = tool_input.get("tenant_name", "임차인")

    filename = f"임대차계약서_{landlord}_{tenant}.pdf"
    output_path = settings.output_dir / f"{file_id}.pdf"

    # 기본값 보완
    context: dict[str, Any] = {
        "contract_type": contract_type,
        "property_address": tool_input.get("property_address", ""),
        "building_area": tool_input.get("building_area", "-"),
        "land_area": tool_input.get("land_area", "-"),
        "land_category": tool_input.get("land_category", "대"),
        "building_structure": tool_input.get("building_structure", "철근콘크리트/주거용"),
        "lease_area": tool_input.get("lease_area", "위 건물 전부"),
        "deposit_krw": tool_input.get("deposit_krw", ""),
        "deposit_amount": tool_input.get("deposit_amount", ""),
        "monthly_rent_krw": tool_input.get("monthly_rent_krw", ""),
        "rent_payment_day": tool_input.get("rent_payment_day", "말일"),
        "start_date": tool_input.get("start_date", ""),
        "end_date": tool_input.get("end_date", ""),
        "period_months": tool_input.get("period_months", "24"),
        "contract_deposit_krw": tool_input.get("contract_deposit_krw", ""),
        "interim_deposit_krw": tool_input.get("interim_deposit_krw", "없음"),
        "remaining_deposit_krw": tool_input.get("remaining_deposit_krw", "잔액 전부"),
        "landlord_name": tool_input.get("landlord_name", ""),
        "landlord_address": tool_input.get("landlord_address", ""),
        "landlord_phone": tool_input.get("landlord_phone", ""),
        "landlord_id": tool_input.get("landlord_id", ""),
        "tenant_name": tool_input.get("tenant_name", ""),
        "tenant_address": tool_input.get("tenant_address", ""),
        "tenant_phone": tool_input.get("tenant_phone", ""),
        "tenant_id": tool_input.get("tenant_id", ""),
        "contract_date": tool_input.get("contract_date", ""),
        "special_terms": tool_input.get("special_terms", ""),
        "agent_name": tool_input.get("agent_name", ""),
        "agent_office": tool_input.get("agent_office", ""),
        "agent_phone": tool_input.get("agent_phone", ""),
        "agent_office_address": tool_input.get("agent_office_address", ""),
        "agent_reg_no": tool_input.get("agent_reg_no", ""),
    }

    engine = PdfEngine()
    # weasyprint는 blocking I/O → executor에서 실행
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: engine.create_from_template("lease_contract.html", context, output_path),
    )

    logger.info("pdf_tool_complete", file_id=file_id, filename=filename)

    return {
        "success": True,
        "file": {
            "file_id": file_id,
            "filename": filename,
            "format": "pdf",
            "download_url": f"/api/files/{file_id}",
            "size_bytes": result["size_bytes"],
        },
    }
