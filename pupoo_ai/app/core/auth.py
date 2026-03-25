"""내부 API 인증 유틸리티."""

from fastapi import Header

from pupoo_ai.app.core.config import settings
from pupoo_ai.app.core.constants import ERROR_UNAUTHORIZED, HEADER_INTERNAL_TOKEN
from pupoo_ai.app.core.exceptions import ApiException


async def verify_internal_token(
    internal_token: str | None = Header(default=None, alias=HEADER_INTERNAL_TOKEN),
) -> None:
    if internal_token != settings.internal_token:
        raise ApiException(
            code=ERROR_UNAUTHORIZED,
            message="내부 인증에 실패했어요.",
            status_code=403,
            errors=[],
        )
