"""내부 API 인증 유틸리티.

기능:
- 백엔드와 AI 서비스 간 내부 호출 토큰을 검증한다.

설명:
- 공개 사용자 인증이 아니라 내부 시스템 간 호출 보호용이다.
"""

from fastapi import Header

from pupoo_ai.app.core.config import settings
from pupoo_ai.app.core.constants import ERROR_UNAUTHORIZED, HEADER_INTERNAL_TOKEN
from pupoo_ai.app.core.exceptions import ApiException


async def verify_internal_token(
    internal_token: str | None = Header(default=None, alias=HEADER_INTERNAL_TOKEN),
) -> None:
    # 기능: 내부 토큰 헤더를 검증한다.
    # 설명: 값이 다르면 즉시 401 예외를 발생시켜 내부 API를 보호한다.
    # 흐름: 헤더 추출 -> 설정값 비교 -> 실패 시 ApiException 발생.
    if internal_token != settings.internal_token:
        raise ApiException(
            code=ERROR_UNAUTHORIZED,
            message="내부 인증에 실패했습니다.",
            status_code=401,
            errors=[],
        )
