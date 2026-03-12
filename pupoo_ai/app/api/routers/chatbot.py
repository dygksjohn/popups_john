import traceback

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from pupoo_ai.app.core.constants import INTERNAL_API_PREFIX
from pupoo_ai.app.core.logger import get_logger
from pupoo_ai.app.features.chatbot.dto.request import ChatRequest
from pupoo_ai.app.features.chatbot.dto.response import ChatResponse
from pupoo_ai.app.features.chatbot.service.chatbot_service import chat as chat_service

logger = get_logger(__name__)

router = APIRouter(
    prefix=f"{INTERNAL_API_PREFIX}/chatbot",
    tags=["chatbot"],
)


@router.post("/chat", summary="관리자 챗봇 메시지 전송")
async def handle_chat(request: ChatRequest):
    try:
        reply = await chat_service(request)
        return {"success": True, "code": "OK", "data": {"reply": reply}}
    except Exception as e:
        logger.error("chatbot error: %s\n%s", e, traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"success": False, "code": "ERROR", "data": {"reply": str(e)}},
        )
