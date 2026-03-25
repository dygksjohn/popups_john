from unittest.mock import AsyncMock, patch

import pytest

from pupoo_ai.app.api.routers.chatbot import handle_internal_admin_chat, handle_user_chat
from pupoo_ai.app.features.chatbot.dto.request import ChatContext, ChatRequest
from pupoo_ai.app.features.chatbot.dto.response import ChatResponse
from pupoo_ai.app.features.chatbot.prompts.system import SYSTEM_PROMPT, USER_SYSTEM_PROMPT
from pupoo_ai.app.features.chatbot.service.chatbot_service import chat


@pytest.mark.asyncio
async def test_user_route_does_not_fall_into_admin_path():
    request = ChatRequest(message="행사 안내 도와줘", context=ChatContext(role="admin"))

    async def fake_chat_service(forced_request, authorization=None):
        assert forced_request.context.role == "user"
        return ChatResponse(message="사용자 안내", actions=[])

    with patch(
        "pupoo_ai.app.api.routers.chatbot.chat_service",
        new=AsyncMock(side_effect=fake_chat_service),
    ):
        response = await handle_user_chat(request, authorization=None)

    assert response["success"] is True
    assert response["data"]["message"] == "사용자 안내"


@pytest.mark.asyncio
async def test_admin_route_does_not_fall_into_user_path():
    request = ChatRequest(message="공지 초안 작성 도와줘", context=ChatContext(role="user"))

    async def fake_chat_service(forced_request, authorization=None):
        assert forced_request.context.role == "admin"
        return ChatResponse(message="관리자 안내", actions=[])

    with patch(
        "pupoo_ai.app.api.routers.chatbot.chat_service",
        new=AsyncMock(side_effect=fake_chat_service),
    ):
        response = await handle_internal_admin_chat(request, authorization="Bearer token")

    assert response["success"] is True
    assert response["data"]["message"] == "관리자 안내"


@pytest.mark.asyncio
async def test_user_service_uses_user_prompt():
    request = ChatRequest(message="행사 위치 알려줘")

    with patch(
        "pupoo_ai.app.features.chatbot.service.chatbot_service.invoke_bedrock",
        new=AsyncMock(return_value=""),
    ) as mocked_invoke:
        response = await chat(request)

    assert "무엇을 도와드릴까요?" in response.message
    assert mocked_invoke.await_args.kwargs["system_prompt"] == USER_SYSTEM_PROMPT


@pytest.mark.asyncio
async def test_admin_service_uses_admin_prompt():
    request = ChatRequest(
        message="운영 현황 요약해줘",
        context=ChatContext(role="admin"),
    )

    with patch(
        "pupoo_ai.app.features.chatbot.service.chatbot_service.IntentAnalyzer.analyze",
        return_value=None,
    ), patch(
        "pupoo_ai.app.features.chatbot.service.chatbot_service.invoke_bedrock",
        new=AsyncMock(return_value=""),
    ) as mocked_invoke:
        response = await chat(request)

    assert "무엇을 도와드릴까요?" in response.message
    assert mocked_invoke.await_args.kwargs["system_prompt"] == SYSTEM_PROMPT
