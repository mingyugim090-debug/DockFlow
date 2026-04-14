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

    사용자의 자연어 명령을 AI 모델에 전달하고,
    모델이 선택한 함수(Tool)를 실행하여 문서를 생성한다.

    작업 유형에 따라 로컬 모델(Gemma)과 클라우드 모델을 자동으로 선택한다.
    """

    def __init__(self, api_key: str | None = None):
        from core.config import settings

        self.api_key = api_key or settings.openai_api_key
        self.model_name = settings.default_model
        self.max_iterations = 5

    def _make_client(self, base_url: str | None = None, api_key: str | None = None) -> AsyncOpenAI:
        """OpenAI 호환 클라이언트 생성 (로컬 base_url 지원)"""
        return AsyncOpenAI(
            api_key=api_key or self.api_key,
            base_url=base_url,
        )

    async def run(
        self,
        instruction: str,
        context: dict[str, Any] | None = None,
        tools: list[dict] | None = None,
        system_prompt: str | None = None,
        task_type: str = "slide_design",
    ) -> dict[str, Any]:
        """Function Calling 루프 실행

        Args:
            instruction: 사용자 자연어 명령
            context: 추가 컨텍스트
            tools: 도구 스키마 목록 (None이면 전체)
            system_prompt: 커스텀 시스템 프롬프트 (미제공 시 기본값 사용)
            task_type: 작업 유형 (model_router.TaskType 값)

        Returns:
            dict: {"status", "files", "message", "tool_results"}
        """
        from agent.model_router import TaskType, get_model_config

        # 작업 유형 → 모델 설정 결정
        try:
            task = TaskType(task_type)
        except ValueError:
            task = TaskType.SLIDE_DESIGN

        model_cfg = get_model_config(task)
        client = self._make_client(
            base_url=model_cfg.get("base_url"),
            api_key=model_cfg.get("api_key"),
        )
        model_name = model_cfg["model"]
        temperature = model_cfg.get("temperature", 0.7)

        tool_schemas = tools or get_all_tool_schemas()
        result: dict[str, Any] = {
            "status": "pending",
            "files": [],
            "message": "",
            "tool_results": {},
        }

        # OpenAI Tool 포맷 빌드
        openai_tools = self._build_openai_tools(tool_schemas)

        # 시스템 프롬프트 결정
        sys_prompt = system_prompt or SYSTEM_PROMPT

        # 초기 메시지 설정
        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": self._build_message(instruction, context or {})},
        ]

        logger.info(
            "orchestrator_start",
            model=model_name,
            task=task_type,
            instruction=instruction[:80],
        )

        # ── RAG 컨텍스트 주입 ──
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
                    # 메시지 재구성 (RAG 청크 포함)
                    messages[-1]["content"] = self._build_message(instruction, context)
            except Exception as exc:
                logger.warning("rag_retrieval_failed", error=str(exc))

        for iteration in range(self.max_iterations):
            logger.info("agent_iteration", iteration=iteration + 1)

            # AI API 호출
            response = await client.chat.completions.create(
                model=model_name,
                messages=messages,
                tools=openai_tools,
                temperature=temperature,
            )

            response_message = response.choices[0].message
            messages.append(response_message)

            logger.info(
                "agent_response",
                finish_reason=response.choices[0].finish_reason,
            )

            # ── 함수 호출 체크 ──
            tool_calls = response_message.tool_calls
            if not tool_calls:
                result["status"] = "success"
                result["message"] = response_message.content or "문서가 성공적으로 생성되었습니다."
                break

            # ── 함수 실행 ──
            for tool_call in tool_calls:
                fn_name = tool_call.function.name

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

                    # 파일 추적
                    if isinstance(output, dict) and output.get("file"):
                        result["files"].append(output["file"])

                    # tool_results에도 저장 (slides 라우터에서 참조)
                    result["tool_results"][fn_name] = output

                    logger.info("function_success", name=fn_name)

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
        """딕셔너리 스키마를 OpenAI Tool 형식으로 변환"""
        tools = []
        for schema in tool_schemas:
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
