"""관리자 챗봇 API 라우터."""

import traceback

from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse

from pupoo_ai.app.core.constants import INTERNAL_API_PREFIX
from pupoo_ai.app.core.logger import get_logger
from pupoo_ai.app.features.chatbot.dto.request import ChatRequest
from pupoo_ai.app.features.chatbot.service.chatbot_service import chat as chat_service

logger = get_logger(__name__)

router = APIRouter(tags=["chatbot"])


@router.post("/api/chatbot/chat", summary="관리자 챗봇 메시지 전송")
@router.post(f"{INTERNAL_API_PREFIX}/chatbot/chat", summary="관리자 챗봇 메시지 전송")
async def handle_chat(request: ChatRequest, authorization: str | None = Header(default=None)):
    try:
        response = await chat_service(request, authorization=authorization)
        return {"success": True, "code": "OK", "data": response.model_dump(by_alias=True)}
    except Exception as exc:
        logger.error("chatbot error: %s\n%s", exc, traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "code": "ERROR",
                "data": {"message": str(exc), "actions": []},
            },
        )
