"""Agent Tool 단위 테스트"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class TestToolRegistry:
    def test_all_tools_registered(self):
        from agent.tools import TOOL_REGISTRY, get_all_tool_schemas

        assert "create_ppt" in TOOL_REGISTRY
        assert "create_excel" in TOOL_REGISTRY
        assert "create_word" in TOOL_REGISTRY
        assert "create_pdf_contract" in TOOL_REGISTRY
        assert "web_search" in TOOL_REGISTRY

        schemas = get_all_tool_schemas()
        assert len(schemas) == 5

    def test_schema_format(self):
        from agent.tools import get_all_tool_schemas

        for schema in get_all_tool_schemas():
            assert "name" in schema
            assert "description" in schema
            assert "input_schema" in schema
            assert schema["input_schema"]["type"] == "object"

    def test_format_routing(self):
        from agent.tools import get_tool_schemas_for_format

        ppt_tools = get_tool_schemas_for_format("pptx")
        tool_names = [t["name"] for t in ppt_tools]
        assert "create_ppt" in tool_names

        excel_tools = get_tool_schemas_for_format("xlsx")
        tool_names = [t["name"] for t in excel_tools]
        assert "create_excel" in tool_names

        contract_tools = get_tool_schemas_for_format("contract")
        tool_names = [t["name"] for t in contract_tools]
        assert "create_pdf_contract" in tool_names


class TestPptTool:
    @pytest.mark.asyncio
    async def test_handle_create_ppt(self, tmp_path, monkeypatch):
        monkeypatch.setattr(
            "core.config.settings.output_dir", tmp_path
        )

        from agent.tools.ppt_tool import handle_create_ppt

        result = await handle_create_ppt({
            "title": "테스트 PPT",
            "slides": [
                {"title": "슬라이드 1", "content": ["내용 1", "내용 2"]},
            ],
            "theme": "modern",
        })

        assert result["success"] is True
        assert result["file"]["format"] == "pptx"
        assert result["file"]["file_id"]
        assert result["file"]["download_url"].startswith("/api/files/")


class TestExcelTool:
    @pytest.mark.asyncio
    async def test_handle_create_excel(self, tmp_path, monkeypatch):
        monkeypatch.setattr(
            "core.config.settings.output_dir", tmp_path
        )

        from agent.tools.excel_tool import handle_create_excel

        result = await handle_create_excel({
            "filename": "테스트",
            "sheets": [
                {
                    "name": "시트1",
                    "headers": ["이름", "금액"],
                    "rows": [["홍길동", 100000]],
                }
            ],
            "add_total_row": True,
        })

        assert result["success"] is True
        assert result["file"]["format"] == "xlsx"


class TestSearchTool:
    @pytest.mark.asyncio
    async def test_search_without_api_key(self, monkeypatch):
        monkeypatch.setattr("core.config.settings.tavily_api_key", "")

        from agent.tools.search_tool import handle_web_search

        result = await handle_web_search({"query": "테스트 검색"})

        assert result["success"] is False
        assert "API 키" in result["summary"]

    @pytest.mark.asyncio
    async def test_search_with_mock(self, monkeypatch):
        monkeypatch.setattr("core.config.settings.tavily_api_key", "test-key")

        mock_response = MagicMock()
        mock_response.json.return_value = {
            "answer": "테스트 답변",
            "results": [
                {"title": "결과1", "url": "http://example.com", "content": "내용1"},
            ],
        }
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=None)
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client_cls.return_value = mock_client

            from agent.tools.search_tool import handle_web_search
            result = await handle_web_search({"query": "테스트", "max_results": 3})

        assert result["success"] is True
        assert len(result["results"]) == 1
        assert result["summary"] == "테스트 답변"
