"""챗봇 서비스 오케스트레이션."""

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
    intent = IntentAnalyzer().analyze(request.message, request.context)
    backend_client = BackendApiClient(authorization)
    execute_handler = ExecuteActionHandler()

    if request.confirmation is not None:
        return await execute_handler.confirm(request.confirmation.model_dump(), backend_client)

    if intent is not None:
        if intent.intent_type == "ambiguous":
            return ChatResponse(
                message="원하시는 작업을 한 번만 더 골라 주세요. 누리가 가장 가까운 흐름으로 이어드릴게요.",
                messageType="ambiguous",
                actions=[],
            )
        if intent.intent_type == "low_confidence":
            return ChatResponse(
                message="요청을 정확히 이해하지 못했어요. 어떤 작업을 원하시는지 조금만 더 알려 주세요.",
                messageType="low_confidence",
                actions=[],
            )

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
        reply_text = "무엇을 도와드릴까요? 조회, 화면 이동, 공지나 알림 초안 작성까지 바로 도와드릴게요."
    return ChatResponse(message=reply_text, actions=[])
