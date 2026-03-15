"""
금지어 필터링(모더레이션) API.
- X-Internal-Token 필수. 백엔드(Spring Boot)만 호출.
- 등록 시점 Level 3: RAG(watsonx.ai + Milvus) 기반 판정.
"""
from fastapi import APIRouter, Depends

from pupoo_ai.app.core.auth import verify_internal_token
from pupoo_ai.app.core.constants import INTERNAL_API_PREFIX
from pupoo_ai.app.features.moderation.schemas import ModerateRequest, ModerateResponse
from pupoo_ai.app.features.moderation.rag_service import moderate_with_rag

router = APIRouter(
    prefix=INTERNAL_API_PREFIX,
    tags=["moderation"],
    dependencies=[Depends(verify_internal_token)],
)


@router.post("/moderate", response_model=ModerateResponse)
async def moderate(body: ModerateRequest) -> ModerateResponse:
    """
    모더레이션 요청.
    - RAG 파이프라인(watsonx.ai + Milvus) 기반 검색 결과를 바탕으로
      PASS / REVIEW 액션과 근거(reason)를 반환한다.
    """
    action, ai_score, reason, stack = moderate_with_rag(body.text)
    return ModerateResponse(
        action=action,
        ai_score=ai_score,
        reason=reason,
        stack=stack,
    )
