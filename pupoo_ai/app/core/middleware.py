from uuid import uuid4

from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from pupoo_ai.app.core.constants import HEADER_TRACE_ID
from pupoo_ai.app.core.logger import reset_trace_id, set_trace_id


class TraceIdMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        trace_id = Headers(scope=scope).get(HEADER_TRACE_ID) or str(uuid4())
        scope.setdefault("state", {})["trace_id"] = trace_id
        token = set_trace_id(trace_id)

        async def send_with_trace(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = message.setdefault("headers", [])
                mutable_headers = MutableHeaders(raw=headers)
                mutable_headers[HEADER_TRACE_ID] = trace_id
            await send(message)

        try:
            await self.app(scope, receive, send_with_trace)
        finally:
            reset_trace_id(token)
