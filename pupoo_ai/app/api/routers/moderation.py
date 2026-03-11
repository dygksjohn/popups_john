"""
금지어 필터링(모더레이션) API.
- X-Internal-Token 필수. 백엔드(Spring Boot)만 호출.
- 조합 6: HateBERT + Redis → 독성 점수 후 임계값 기준 PASS/REVIEW.
"""
from fastapi import APIRouter, Depends

from pupoo_ai.app.core.auth import verify_internal_token
from pupoo_ai.app.core.config import settings
from pupoo_ai.app.core.constants import INTERNAL_API_PREFIX
from pupoo_ai.app.features.moderation.hatebert_redis import get_abuse_score
from pupoo_ai.app.features.moderation.schemas import ModerateRequest, ModerateResponse

router = APIRouter(
    prefix=INTERNAL_API_PREFIX,
    tags=["moderation"],
    dependencies=[Depends(verify_internal_token)],
)


@router.post("/moderate", response_model=ModerateResponse)
async def moderate(body: ModerateRequest) -> ModerateResponse:
    """
    모더레이션 요청 (조합 6: HateBERT + Redis).
    - text에 대해 혐오/욕설 점수 조회(캐시 적용), moderation_threshold 이상이면 REVIEW.
    - transformers 미설치 시 score=0으로 PASS 반환.
    """
    try:
        score = await get_abuse_score(body.text)
    except Exception:
        score = 0.0
    threshold = settings.moderation_threshold

    if score >= threshold:
        return ModerateResponse(
            action="REVIEW",
            ai_score=round(score, 4),
            reason=f"혐오/욕설 점수 {score:.2f} (임계값 {threshold})",
            stack="hatebert_redis",
        )

    return ModerateResponse(
        action="PASS",
        ai_score=round(score, 4),
        reason=None,
        stack="hatebert_redis",
    )
