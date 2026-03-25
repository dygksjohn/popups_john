"""내부 모더레이션 API 라우터."""

import asyncio
import logging

from fastapi import APIRouter, Depends

from pupoo_ai.app.core.auth import verify_internal_token
from pupoo_ai.app.core.config import settings
from pupoo_ai.app.core.constants import INTERNAL_API_PREFIX
from pupoo_ai.app.features.moderation.rag_service import moderate_with_rag
from pupoo_ai.app.features.moderation.schemas import ModerateRequest, ModerateResponse

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix=INTERNAL_API_PREFIX,
    tags=["moderation"],
    dependencies=[Depends(verify_internal_token)],
)


def _block_response(reason: str, stack: str) -> ModerateResponse:
    return ModerateResponse(
        result="BLOCK",
        action="BLOCK",
        reason=reason,
        score=None,
        ai_score=None,
        stack=stack,
        flagged_phrases=None,
        inferred_phrases=None,
    )


@router.post("/moderate", response_model=ModerateResponse)
async def moderate(body: ModerateRequest) -> ModerateResponse:
    content = (body.content or body.text or "").strip()
    board_type = (body.board_type or body.content_type or "").strip() or None
    metadata = dict(body.metadata or {})
    if body.board_id is not None:
        metadata.setdefault("boardId", body.board_id)
    if board_type:
        metadata.setdefault("boardType", board_type)

    if not content:
        return _block_response("검사할 내용이 비어 있어 등록을 막았어요.", "validation")

    try:
        result, score, reason, stack, flagged_phrases, inferred_phrases = await asyncio.wait_for(
            asyncio.to_thread(moderate_with_rag, content, board_type, metadata),
            timeout=settings.moderation_timeout_seconds,
        )
    except asyncio.TimeoutError:
        logger.warning("Moderation timed out. board_type=%s metadata=%s", board_type, metadata)
        return _block_response("금칙어 검사 시간이 초과되어 등록을 막았어요.", "timeout")
    except Exception:
        logger.exception("Moderation failed unexpectedly. board_type=%s metadata=%s", board_type, metadata)
        return _block_response("금칙어 검사를 완료하지 못해 등록을 막았어요.", "error")

    normalized = "PASS" if str(result or "").upper() == "PASS" else "BLOCK"
    return ModerateResponse(
        result=normalized,
        action=normalized,
        reason=reason,
        score=score,
        ai_score=score,
        stack=stack,
        flagged_phrases=flagged_phrases,
        inferred_phrases=inferred_phrases,
    )
