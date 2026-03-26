import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

sys.path.append(str(Path(__file__).resolve().parents[2]))

from pupoo_ai.app.api.routers.chatbot import (  # noqa: E402
    handle_internal_admin_chat,
    handle_user_chat,
)
from pupoo_ai.app.features.chatbot.dto.request import ChatContext, ChatRequest  # noqa: E402
from pupoo_ai.app.features.chatbot.dto.response import ChatResponse  # noqa: E402
from pupoo_ai.app.features.chatbot.prompts.system import USER_SYSTEM_PROMPT  # noqa: E402
from pupoo_ai.app.features.chatbot.service.chatbot_service import chat  # noqa: E402


class ChatbotRouterRoleTest(unittest.IsolatedAsyncioTestCase):
    async def test_public_user_route_forces_user_role(self):
        request = ChatRequest(message="행사 안내 도와줘", context=ChatContext(role="admin"))

        async def fake_chat_service(forced_request, authorization=None):
            self.assertEqual(forced_request.context.role, "user")
            return ChatResponse(message="사용자 안내", actions=[])

        with patch(
            "pupoo_ai.app.api.routers.chatbot.chat_service",
            new=AsyncMock(side_effect=fake_chat_service),
        ):
            response = await handle_user_chat(request, authorization=None)

        self.assertTrue(response["success"])
        self.assertEqual(response["data"]["message"], "사용자 안내")

    async def test_internal_admin_route_forces_admin_role(self):
        request = ChatRequest(message="공지 작성 도와줘", context=ChatContext(role="user"))

        async def fake_chat_service(forced_request, authorization=None):
            self.assertEqual(forced_request.context.role, "admin")
            return ChatResponse(message="관리자 안내", actions=[])

        with patch(
            "pupoo_ai.app.api.routers.chatbot.chat_service",
            new=AsyncMock(side_effect=fake_chat_service),
        ):
            response = await handle_internal_admin_chat(request, authorization="Bearer token")

        self.assertTrue(response["success"])
        self.assertEqual(response["data"]["message"], "관리자 안내")


class ChatbotServiceRoleTest(unittest.IsolatedAsyncioTestCase):
    async def test_default_context_uses_user_prompt(self):
        request = ChatRequest(message="행사 위치 알려줘")

        with patch(
            "pupoo_ai.app.features.chatbot.service.chatbot_service.invoke_bedrock",
            new=AsyncMock(return_value=""),
        ) as mocked_invoke:
            response = await chat(request)

        self.assertIn("무엇을 도와드릴까요?", response.message)
        self.assertEqual(
            mocked_invoke.await_args.kwargs["system_prompt"],
            USER_SYSTEM_PROMPT,
        )


if __name__ == "__main__":
    unittest.main()
