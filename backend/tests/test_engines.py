"""문서 생성 엔진 단위 테스트"""

import pytest
from pathlib import Path
import tempfile


class TestPptEngine:
    def test_create_basic(self):
        from document.ppt_engine import PptEngine

        engine = PptEngine(theme="modern")
        with tempfile.NamedTemporaryFile(suffix=".pptx", delete=False) as f:
            output_path = Path(f.name)

        result = engine.create(
            title="테스트 프레젠테이션",
            slides=[
                {"title": "슬라이드 1", "content": ["항목 1", "항목 2"], "layout": "content"},
                {"title": "슬라이드 2", "layout": "title_only"},
            ],
            output_path=output_path,
        )

        assert output_path.exists()
        # 타이틀 슬라이드 1장 + 콘텐츠 슬라이드 2장 = 3
        assert result["slide_count"] == 3
        assert result["size_bytes"] > 0
        output_path.unlink(missing_ok=True)

    def test_create_dark_theme(self):
        from document.ppt_engine import PptEngine

        engine = PptEngine(theme="dark")
        with tempfile.NamedTemporaryFile(suffix=".pptx", delete=False) as f:
            output_path = Path(f.name)

        result = engine.create(
            title="다크 테마",
            slides=[{"title": "제목만", "layout": "title_only"}],
            output_path=output_path,
        )

        assert output_path.exists()
        output_path.unlink(missing_ok=True)


class TestExcelEngine:
    def test_create_basic(self):
        from document.excel_engine import ExcelEngine

        engine = ExcelEngine()
        with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as f:
            output_path = Path(f.name)

        result = engine.create(
            sheets=[
                {
                    "name": "임대 현황",
                    "headers": ["호수", "임차인", "보증금", "월세"],
                    "rows": [
                        ["101호", "홍길동", 50000000, 500000],
                        ["102호", "김철수", 100000000, 0],
                    ],
                }
            ],
            output_path=output_path,
            add_total_row=True,
        )

        assert output_path.exists()
        assert result["sheet_count"] == 1
        assert result["total_rows"] == 2
        output_path.unlink(missing_ok=True)

    def test_create_multi_sheet(self):
        from document.excel_engine import ExcelEngine

        engine = ExcelEngine()
        with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as f:
            output_path = Path(f.name)

        result = engine.create(
            sheets=[
                {"name": "시트1", "headers": ["A", "B"], "rows": [["1", "2"]]},
                {"name": "시트2", "headers": ["C", "D"], "rows": [["3", "4"]]},
            ],
            output_path=output_path,
            add_total_row=False,
        )

        assert result["sheet_count"] == 2
        output_path.unlink(missing_ok=True)


class TestWordEngine:
    def test_create_basic(self):
        from document.word_engine import WordEngine

        engine = WordEngine()
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as f:
            output_path = Path(f.name)

        result = engine.create(
            title="테스트 문서",
            content_blocks=[
                {"type": "heading", "text": "1장. 개요", "level": 1},
                {"type": "paragraph", "text": "본 문서는 테스트용입니다."},
                {"type": "list", "text": "항목 1"},
                {"type": "list", "text": "항목 2"},
            ],
            output_path=output_path,
        )

        assert output_path.exists()
        assert result["block_count"] == 4
        assert result["size_bytes"] > 0
        output_path.unlink(missing_ok=True)


class TestPdfEngine:
    @pytest.mark.skipif(
        __import__("sys").platform == "win32",
        reason="weasyprint은 Windows에서 GTK 런타임 필요 (배포 환경인 Linux에서만 실행)",
    )
    def test_create_from_template(self):
        from document.pdf_engine import PdfEngine

        engine = PdfEngine()
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            output_path = Path(f.name)

        context = {
            "contract_type": "monthly",
            "property_address": "서울특별시 강남구 테헤란로 123",
            "building_area": "84.5",
            "land_area": "50",
            "land_category": "대",
            "building_structure": "철근콘크리트/주거용",
            "lease_area": "위 건물 전부",
            "deposit_krw": "금 오천만원 정",
            "deposit_amount": "",
            "monthly_rent_krw": "금 오십만원 정",
            "rent_payment_day": "매월 10일",
            "start_date": "2026년 5월 1일",
            "end_date": "2028년 4월 30일",
            "period_months": "24",
            "contract_deposit_krw": "금 오백만원 정",
            "interim_deposit_krw": "없음",
            "remaining_deposit_krw": "잔액 전부",
            "landlord_name": "홍길동",
            "landlord_address": "서울시 서초구 서초동 123",
            "landlord_phone": "010-1234-5678",
            "landlord_id": "",
            "tenant_name": "김철수",
            "tenant_address": "서울시 마포구 공덕동 456",
            "tenant_phone": "010-9876-5432",
            "tenant_id": "",
            "contract_date": "2026년 4월 15일",
            "special_terms": "반려동물 금지\n원상복구 의무",
            "agent_name": "",
            "agent_office": "",
            "agent_phone": "",
            "agent_office_address": "",
            "agent_reg_no": "",
        }

        result = engine.create_from_template(
            template_name="lease_contract.html",
            context=context,
            output_path=output_path,
        )

        assert output_path.exists()
        assert result["size_bytes"] > 0
        output_path.unlink(missing_ok=True)
