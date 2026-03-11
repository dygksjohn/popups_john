"""
금지어 필터링(모더레이션) API.
- X-Internal-Token 필수. 백엔드(Spring Boot)만 호출.
"""
from fastapi import APIRouter, Depends

from pupoo_ai.app.core.auth import verify_internal_token
from pupoo_ai.app.core.constants import INTERNAL_API_PREFIX

router = APIRouter(
    prefix=INTERNAL_API_PREFIX,
    tags=["moderation"],
    dependencies=[Depends(verify_internal_token)],
)


@router.post("/moderate")
async def moderate() -> dict:
    """
    모더레이션 요청 (Level 2/3 파이프라인 진입점).
    - Request body·실제 스코어링/ RAG 로직은 기술 조합별로 추가 예정.
    """
    return {"status": "ok", "action": "PASS", "message": "moderation endpoint ready"}
