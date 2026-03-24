from __future__ import annotations

from typing import Any

import httpx

from pupoo_ai.app.core.config import settings


class BackendApiError(Exception):
    """Backend API 호출 실패."""

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


class BackendApiClient:
    """관리자 오케스트레이션용 backend HTTP client."""

    def __init__(self, authorization: str | None = None):
        self._base_url = settings.backend_base_url.rstrip("/")
        self._authorization = authorization

    async def get_ai_summary(self) -> dict[str, Any]:
        return await self._request("GET", "/api/admin/ai/summary")

    async def get_ai_capabilities(self) -> dict[str, Any]:
        return await self._request("GET", "/api/admin/ai/capabilities")

    async def create_notice(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", "/api/admin/notices", json=payload)

    async def update_notice(self, notice_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("PATCH", f"/api/admin/notices/{notice_id}", json=payload)

    async def create_notification_draft(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", "/api/admin/notifications", json=payload)

    async def update_notification_draft(self, notification_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("PUT", f"/api/admin/notifications/{notification_id}", json=payload)

    async def delete_notification_draft(self, notification_id: int) -> dict[str, Any]:
        return await self._request("DELETE", f"/api/admin/notifications/{notification_id}")

    async def send_notification(self, notification_id: int) -> dict[str, Any]:
        return await self._request("POST", f"/api/admin/notifications/{notification_id}/send")

    async def send_event_notification(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", "/api/admin/notifications/event", json=payload)

    async def send_broadcast_notification(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", "/api/admin/notifications/broadcast", json=payload)

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not self._base_url:
            raise BackendApiError("PUPOO_AI_BACKEND_BASE_URL 설정이 필요합니다.")

        headers = {"Content-Type": "application/json"}
        if self._authorization:
            headers["Authorization"] = self._authorization

        async with httpx.AsyncClient(base_url=self._base_url, timeout=settings.backend_timeout_seconds) as client:
            response = await client.request(method, path, params=params, json=json, headers=headers)

        try:
            body = response.json()
        except ValueError as exc:  # pragma: no cover
            raise BackendApiError("backend 응답을 해석하지 못했습니다.", status_code=response.status_code) from exc

        if response.is_success:
            return body.get("data", body)

        message = (
            body.get("error", {}).get("message")
            or body.get("message")
            or body.get("data", {}).get("message")
            or "backend 요청에 실패했습니다."
        )
        raise BackendApiError(str(message), status_code=response.status_code)
