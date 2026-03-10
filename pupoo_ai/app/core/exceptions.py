from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from pupoo_ai.app.core.constants import (
    ERROR_INTERNAL,
    ERROR_VALIDATION,
    HEADER_TRACE_ID,
)
from pupoo_ai.app.core.logger import get_logger, get_trace_id

logger = get_logger(__name__)


class ApiException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int,
        errors: list[Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.errors = errors or []


def _sanitize_error_value(value: Any) -> Any:
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, list):
        return [_sanitize_error_value(item) for item in value]
    if isinstance(value, tuple):
        return [_sanitize_error_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _sanitize_error_value(item) for key, item in value.items()}
    return str(value)


def _resolve_trace_id(request: Request) -> str:
    return getattr(request.state, "trace_id", None) or get_trace_id()


def _error_response(
    request: Request,
    *,
    code: str,
    message: str,
    status_code: int,
    errors: list[Any] | None = None,
) -> JSONResponse:
    trace_id = _resolve_trace_id(request)
    response = JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "code": code,
            "message": message,
            "traceId": trace_id,
            "errors": errors or [],
        },
    )
    response.headers[HEADER_TRACE_ID] = trace_id
    return response


async def api_exception_handler(request: Request, exc: ApiException) -> JSONResponse:
    return _error_response(
        request,
        code=exc.code,
        message=exc.message,
        status_code=exc.status_code,
        errors=exc.errors,
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    sanitized_errors = [_sanitize_error_value(item) for item in exc.errors()]
    return _error_response(
        request,
        code=ERROR_VALIDATION,
        message="\uc694\uccad \uac12\uc774 \uc62c\ubc14\ub974\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.",
        status_code=422,
        errors=sanitized_errors,
    )


async def internal_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception: %s", exc)
    return _error_response(
        request,
        code=ERROR_INTERNAL,
        message="\ub0b4\ubd80 \uc11c\ubc84 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.",
        status_code=500,
        errors=[],
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(ApiException, api_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, internal_exception_handler)
