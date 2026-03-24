"""관리자 챗봇 API 라우터."""

import traceback

from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse

from pupoo_ai.app.core.constants import INTERNAL_API_PREFIX
from pupoo_ai.app.core.logger import get_logger
from pupoo_ai.app.features.chatbot.dto.request import ChatRequest
from pupoo_ai.app.features.chatbot.service.chatbot_service import chat as chat_service
from pupoo_ai.app.features.orchestrator.backend_api_client import BackendApiError

logger = get_logger(__name__)

router = APIRouter(tags=["chatbot"])


@router.post("/api/chatbot/chat", summary="관리자 챗봇 메시지 전송")
@router.post(f"{INTERNAL_API_PREFIX}/chatbot/chat", summary="관리자 챗봇 메시지 전송")
async def handle_chat(request: ChatRequest, authorization: str | None = Header(default=None)):
    try:
        response = await chat_service(request, authorization=authorization)
        return {"success": True, "code": "OK", "data": response.model_dump(by_alias=True)}
    except BackendApiError as exc:
        status_code = exc.status_code or 500
        message_type = {
            400: "validation",
            401: "unauthorized",
            403: "forbidden",
            404: "not_found",
        }.get(status_code, "error")
        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "code": f"BACKEND_{status_code}",
                "data": {"message": str(exc), "messageType": message_type, "actions": []},
            },
        )
    except ValueError as exc:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "code": "VALIDATION_ERROR",
                "data": {"message": str(exc), "messageType": "validation", "actions": []},
            },
        )
    except Exception as exc:
        logger.error("chatbot error: %s\n%s", exc, traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "code": "ERROR",
                "data": {"message": str(exc), "messageType": "error", "actions": []},
            },
        )
