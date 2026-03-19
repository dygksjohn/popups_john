"""내부 챗봇 API 라우터.

기능:
- 관리자/내부용 챗봇 질의를 서비스 계층으로 전달한다.

설명:
- 라우터는 요청과 응답 형식만 관리한다.
- 실제 Bedrock 호출과 메시지 조립은 chatbot_service가 담당한다.

흐름:
- 요청 수신 -> 서비스 호출 -> 성공 응답 또는 에러 응답 반환
"""

import traceback

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from pupoo_ai.app.core.constants import INTERNAL_API_PREFIX
from pupoo_ai.app.core.logger import get_logger
from pupoo_ai.app.features.chatbot.dto.request import ChatRequest
from pupoo_ai.app.features.chatbot.service.chatbot_service import chat as chat_service

logger = get_logger(__name__)

router = APIRouter(
    prefix=f"{INTERNAL_API_PREFIX}/chatbot",
    tags=["chatbot"],
)


@router.post("/chat", summary="관리자 챗봇 메시지 전송")
async def handle_chat(request: ChatRequest):
    # 기능: 챗봇 요청을 서비스 계층에 전달하고 응답을 감싼다.
    # 설명: 예외가 발생하면 공통 에러 형식으로 감싸서 클라이언트에 전달한다.
    # 흐름: 요청 수신 -> chatbot_service 호출 -> 성공/실패 응답 반환.
    try:
        reply = await chat_service(request)
        return {"success": True, "code": "OK", "data": {"reply": reply}}
    except Exception as exc:
        logger.error("chatbot error: %s\n%s", exc, traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"success": False, "code": "ERROR", "data": {"reply": str(exc)}},
        )
