"""챗봇 서비스 계층."""

from pupoo_ai.app.features.chatbot.dto.request import ChatRequest
from pupoo_ai.app.features.chatbot.dto.response import ChatResponse
from pupoo_ai.app.features.chatbot.service.bedrock_client import invoke_bedrock
from pupoo_ai.app.features.orchestrator.action_planner import ActionPlanner
from pupoo_ai.app.features.orchestrator.backend_api_client import BackendApiClient
from pupoo_ai.app.features.orchestrator.handlers import (
    DraftActionHandler,
    ExecuteActionHandler,
    NavigationActionHandler,
    SummaryActionHandler,
    UnsupportedActionHandler,
)
from pupoo_ai.app.features.orchestrator.intent_analyzer import IntentAnalyzer


async def chat(request: ChatRequest, authorization: str | None = None) -> ChatResponse:
    intent = IntentAnalyzer().analyze(request.message)
    backend_client = BackendApiClient(authorization)
    execute_handler = ExecuteActionHandler()

    if request.confirmation is not None:
        return await execute_handler.confirm(request.confirmation.model_dump(), backend_client)

    if intent is not None:
        planned_action = ActionPlanner().plan(intent, request.context)
        if planned_action.intent_type == "navigation":
            return NavigationActionHandler().handle(planned_action)
        if planned_action.intent_type == "summary":
            return await SummaryActionHandler().handle(planned_action, backend_client)
        if planned_action.intent_type == "draft":
            return await DraftActionHandler().handle(planned_action, request)
        if planned_action.intent_type == "unsupported":
            return UnsupportedActionHandler().handle(planned_action, request.context)
        if planned_action.intent_type == "execute":
            return execute_handler.prepare(planned_action, request.context)

    history = list(request.history)
    while history and history[0].role == "assistant":
        history.pop(0)

    messages = [{"role": message.role, "content": [{"text": message.content}]} for message in history]
    messages.append({"role": "user", "content": [{"text": request.message}]})
    reply = await invoke_bedrock(messages)
    reply_text = str(reply or "").strip()
    if not reply_text:
        reply_text = "운영 업무를 이어서 도와드릴게요. 이동, 요약, 초안 생성, 실행이 필요하면 말씀해 주세요."
    return ChatResponse(message=reply_text, actions=[])
