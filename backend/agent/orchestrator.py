"""OpenAI Function Calling 기반 문서 생성 오케스트레이터"""

import json
from typing import Any

from openai import AsyncOpenAI
import structlog

from agent.prompts.system import SYSTEM_PROMPT
from agent.tools import TOOL_REGISTRY, get_all_tool_schemas

logger = structlog.get_logger(__name__)


class DocumentOrchestrator:
    """OpenAI Function Calling 기반 문서 생성 오케스트레이터.

    사용자의 자연어 명령을 OpenAI 모델에 전달하고,
    모델이 선택한 함수(Tool)를 실행하여 문서를 생성한다.
    """

    def __init__(self, api_key: str | None = None):
        from core.config import settings

        self.client = AsyncOpenAI(api_key=api_key or settings.openai_api_key)
        self.model_name = settings.default_model
        self.max_iterations = 5

    async def run(
        self,
        instruction: str,
        context: dict[str, Any] | None = None,
        tools: list[dict] | None = None,
    ) -> dict[str, Any]:
        """OpenAI Function Calling 루프 실행

        Args:
            instruction: 사용자 자연어 명령
            context: 추가 컨텍스트
            tools: 도구 스키마 목록 (None이면 전체)

        Returns:
            dict: {"status", "files", "message"}
        """
        tool_schemas = tools or get_all_tool_schemas()
        result: dict[str, Any] = {"status": "pending", "files": [], "message": ""}

        # OpenAI Tool 포맷 빌드
        openai_tools = self._build_openai_tools(tool_schemas)

        # 초기 메시지 설정
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": self._build_message(instruction, context or {})},
        ]

        logger.info("openai_agent_start", model=self.model_name, instruction=instruction[:80])

        # ── RAG 컨텍스트 주입 ──
        # upload_id가 있으면 관련 청크를 검색하여 context에 추가
        if context and context.get("upload_id"):
            try:
                from rag.embedder import embed_single
                from rag.store import search_similar

                query_vector = await embed_single(instruction)
                relevant_chunks = await search_similar(
                    query_vector=query_vector,
                    upload_id=context["upload_id"],
                    top_k=5,
                )
                if relevant_chunks:
                    context["retrieved_chunks"] = "\n\n---\n\n".join(relevant_chunks)
                    logger.info(
                        "rag_chunks_injected",
                        upload_id=context["upload_id"],
                        chunk_count=len(relevant_chunks),
                    )
            except Exception as exc:
                logger.warning("rag_retrieval_failed", error=str(exc))

        for iteration in range(self.max_iterations):
            logger.info("agent_iteration", iteration=iteration + 1)

            # OpenAI API 호출
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                tools=openai_tools,
                temperature=0.7,
            )

            response_message = response.choices[0].message
            # API 응답을 히스토리에 추가
            messages.append(response_message)

            logger.info(
                "openai_response",
                finish_reason=response.choices[0].finish_reason,
            )

            # ── 함수 호출 체크 ──
            tool_calls = response_message.tool_calls
            if not tool_calls:
                # 더 이상 함수 호출 안함 -> 완료
                result["status"] = "success"
                result["message"] = response_message.content or "문서가 성공적으로 생성되었습니다."
                break

            # ── 함수 실행 ──
            for tool_call in tool_calls:
                fn_name = tool_call.function.name
                
                # 인자 파싱
                try:
                    fn_args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    fn_args = {}

                logger.info("function_called", name=fn_name, args_keys=list(fn_args.keys()))

                try:
                    handler = TOOL_REGISTRY.get(fn_name)
                    if not handler:
                        raise ValueError(f"알 수 없는 함수: {fn_name}")

                    output = await handler(fn_args)

                    # 생성 파일 추적
                    if isinstance(output, dict) and output.get("file"):
                        result["files"].append(output["file"])

                    logger.info("function_success", name=fn_name)

                    # 함수 실행 결과를 다음 턴 메시지로 추가
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": fn_name,
                        "content": json.dumps({"result": output}, ensure_ascii=False),
                    })

                except Exception as e:
                    logger.error("function_failed", name=fn_name, error=str(e))
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": fn_name,
                        "content": json.dumps({"error": str(e)}, ensure_ascii=False),
                    })

        if result["status"] == "pending":
            result["status"] = "failed"
            result["message"] = "최대 반복 횟수를 초과했습니다."

        return result

    def _build_openai_tools(self, tool_schemas: list[dict]) -> list[dict]:
        """일반 딕셔너리 스키마를 OpenAI Tool 형식으로 변환"""
        tools = []
        for schema in tool_schemas:
            # Anthropic('input_schema')와 표준 JSON Schema('parameters') 호환 처리
            parameters = schema.get("input_schema") or schema.get("parameters", {"type": "object", "properties": {}})

            tools.append({
                "type": "function",
                "function": {
                    "name": schema["name"],
                    "description": schema.get("description", ""),
                    "parameters": parameters,
                }
            })
        return tools

    def _build_message(self, instruction: str, context: dict[str, Any]) -> str:
        """초기 사용자 메시지 구성"""
        content = instruction
        if context:
            context_str = json.dumps(context, ensure_ascii=False, indent=2)
            content += f"\n\n추가 정보:\n{context_str}"
        return content
