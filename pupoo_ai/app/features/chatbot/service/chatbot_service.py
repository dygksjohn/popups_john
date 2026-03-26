"""챗봇 서비스 오케스트레이션."""

from pupoo_ai.app.features.chatbot.dto.request import ChatRequest
from pupoo_ai.app.features.chatbot.dto.response import ChatResponse
from pupoo_ai.app.features.chatbot.prompts.system import SYSTEM_PROMPT, USER_SYSTEM_PROMPT
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

USER_FALLBACK_MESSAGE = (
    "무엇을 도와드릴까요? 행사, 로그인, 결제, 환불, 체크인 같은 이용 방법을 안내해 드릴게요."
)
ADMIN_FALLBACK_MESSAGE = (
    "무엇을 도와드릴까요? 운영 요약, 화면 이동, 공지나 알림 초안 준비까지 도와드릴게요."
)


def _is_user_role(request: ChatRequest) -> bool:
    return getattr(request.context, "role", "user") == "user"


async def _user_chat(request: ChatRequest) -> ChatResponse:
    """사용자 챗봇은 일반 안내와 질문 응답만 처리한다."""
    history = list(request.history)
    while history and history[0].role == "assistant":
        history.pop(0)

    messages = [
        {"role": message.role, "content": [{"text": message.content}]}
        for message in history
    ]
    messages.append({"role": "user", "content": [{"text": request.message}]})
    reply = await invoke_bedrock(messages, system_prompt=USER_SYSTEM_PROMPT)
    reply_text = str(reply or "").strip() or USER_FALLBACK_MESSAGE
    return ChatResponse(message=reply_text, actions=[])


async def chat(request: ChatRequest, authorization: str | None = None) -> ChatResponse:
    if _is_user_role(request):
        return await _user_chat(request)

    intent = IntentAnalyzer().analyze(request.message, request.context)
    backend_client = BackendApiClient(authorization)
    execute_handler = ExecuteActionHandler()

    if request.confirmation is not None:
        return await execute_handler.confirm(
            request.confirmation.model_dump(),
            backend_client,
        )

    if intent is not None:
        if intent.intent_type == "ambiguous":
            return ChatResponse(
                message="원하시는 작업이 여러 가지로 해석될 수 있어요. 어떤 작업인지 한 번만 더 구체적으로 알려 주세요.",
                messageType="ambiguous",
                actions=[],
            )
        if intent.intent_type == "low_confidence":
            return ChatResponse(
                message="요청을 정확히 이해하지 못했습니다. 필요한 작업을 조금 더 자세히 알려 주세요.",
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

    messages = [
        {"role": message.role, "content": [{"text": message.content}]}
        for message in history
    ]
    messages.append({"role": "user", "content": [{"text": request.message}]})
    reply = await invoke_bedrock(messages, system_prompt=SYSTEM_PROMPT)
    reply_text = str(reply or "").strip() or ADMIN_FALLBACK_MESSAGE
    return ChatResponse(message=reply_text, actions=[])
