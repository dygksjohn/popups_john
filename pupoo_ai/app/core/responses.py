from typing import Any

from fastapi.responses import JSONResponse

from pupoo_ai.app.core.constants import HEADER_TRACE_ID, SUCCESS_CODE
from pupoo_ai.app.core.logger import get_trace_id

SUCCESS_MESSAGE = "\uc815\uc0c1 \ucc98\ub9ac\ub418\uc5c8\uc2b5\ub2c8\ub2e4."


def success_response(data: Any = None) -> JSONResponse:
    trace_id = get_trace_id()
    response = JSONResponse(
        status_code=200,
        content={
            "success": True,
            "code": SUCCESS_CODE,
            "message": SUCCESS_MESSAGE,
            "traceId": trace_id,
            "data": data,
        },
    )
    response.headers[HEADER_TRACE_ID] = trace_id
    return response
