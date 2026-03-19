"""내부 모더레이션 API 라우터.

기능:
- 백엔드가 호출하는 사전 차단용 AI moderation 엔드포인트를 제공한다.

설명:
- 이 라우터는 저장 전 텍스트 검사를 담당한다.
- 신고 접수 후 관리자 승인으로 상태를 바꾸는 신고 기반 모더레이션과는 별도 흐름이다.

흐름:
- 내부 토큰 검증 -> RAG 기반 정책 검색/판단 -> 구조화된 PASS/BLOCK 응답 반환
"""

from fastapi import APIRouter, Depends

from pupoo_ai.app.core.auth import verify_internal_token
from pupoo_ai.app.core.constants import INTERNAL_API_PREFIX
from pupoo_ai.app.features.moderation.rag_service import moderate_with_rag
from pupoo_ai.app.features.moderation.schemas import ModerateRequest, ModerateResponse

router = APIRouter(
    prefix=INTERNAL_API_PREFIX,
    tags=["moderation"],
    dependencies=[Depends(verify_internal_token)],
)


@router.post("/moderate", response_model=ModerateResponse)
async def moderate(body: ModerateRequest) -> ModerateResponse:
    # 기능: 입력 텍스트의 정책 위반 여부를 사전 차단 기준으로 판단한다.
    # 설명: 정책 문서 검색 결과와 LLM 판단을 묶어 백엔드가 바로 사용할 응답으로 변환한다.
    # 흐름: 요청 수신 -> moderate_with_rag 호출 -> 응답 모델 구성.
    action, ai_score, reason, stack, flagged_phrases, inferred_phrases = moderate_with_rag(body.text)
    return ModerateResponse(
        action=action,
        ai_score=ai_score,
        reason=reason,
        stack=stack,
        flagged_phrases=flagged_phrases,
        inferred_phrases=inferred_phrases,
    )
