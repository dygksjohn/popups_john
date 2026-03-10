from fastapi import Header

from pupoo_ai.app.core.config import settings
from pupoo_ai.app.core.constants import (
    ERROR_UNAUTHORIZED,
    HEADER_INTERNAL_TOKEN,
)
from pupoo_ai.app.core.exceptions import ApiException


async def verify_internal_token(
    internal_token: str | None = Header(default=None, alias=HEADER_INTERNAL_TOKEN),
) -> None:
    if internal_token != settings.internal_token:
        raise ApiException(
            code=ERROR_UNAUTHORIZED,
            message="\ub0b4\ubd80 \uc778\uc99d\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
            status_code=401,
            errors=[],
        )
