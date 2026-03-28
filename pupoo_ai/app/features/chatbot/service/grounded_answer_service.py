from __future__ import annotations

from datetime import datetime
import re
from typing import Any

from pupoo_ai.app.features.orchestrator.backend_api_client import BackendApiClient, BackendApiError

_CURRENT_KEYWORDS = ("\uc624\ub298", "\uc9c0\uae08", "\ud604\uc7ac", "\uc9c4\ud589", "\uc6b4\uc601", "ongoing")
_UPCOMING_KEYWORDS = ("\uc608\uc815", "\ub2e4\uac00\uc624\ub294", "\ub2e4\uc74c", "upcoming")
_ENDED_KEYWORDS = ("\uc885\ub8cc", "\ub05d\ub09c", "\uc9c0\ub09c", "\ub9c8\uac10", "ended")
_EVENT_KEYWORDS = ("\ud589\uc0ac", "\uc774\ubca4\ud2b8", "\ubc15\ub78c\ud68c", "\ucd95\uc81c", "\uc5d1\uc2a4\ud3ec", "\ud398\uc5b4")
_LOCATION_KEYWORDS = ("\uc7a5\uc18c", "\uc704\uce58", "\uc5b4\ub514")
_SCHEDULE_KEYWORDS = ("\uc77c\uc815", "\ub0a0\uc9dc", "\uc2dc\uac04", "\uc5b8\uc81c", "\uae30\uac04")
_NOTICE_KEYWORDS = ("\uacf5\uc9c0", "\uc548\ub0b4", "\uc54c\ub9bc", "\uc8fc\ucc28")
_FAQ_KEYWORDS = (
    "faq",
    "\uc790\uc8fc \ubb3b\ub294",
    "\uc9c8\ubb38",
    "\ud658\ubd88",
    "\uacb0\uc81c",
    "\uccb4\ud06c\uc778",
    "\ub85c\uadf8\uc778",
    "\ud68c\uc6d0\uac00\uc785",
    "\ub9c8\uc774\ud398\uc774\uc9c0",
    "qr",
)
_SUMMARY_KEYWORDS = ("\uc694\uc57d", "\ud604\ud669", "\uc0c1\ud669", "\uba87 \uac1c", "\uac1c\uc218", "\ud1b5\uacc4", "\uccb4\ud06c\uc778")
_RECOMMEND_KEYWORDS = ("\ucd94\ucc9c", "\ud3ec\uc778\ud2b8", "\uac15\uc870", "\uc7a5\uc810")
_KEYWORD_CANDIDATES = (
    "\uc8fc\ucc28",
    "\ud658\ubd88",
    "\uacb0\uc81c",
    "\uccb4\ud06c\uc778",
    "\ub85c\uadf8\uc778",
    "\ud68c\uc6d0\uac00\uc785",
    "\ub9c8\uc774\ud398\uc774\uc9c0",
    "QR",
    "\ud589\uc0ac",
    "\uacf5\uc9c0",
)


def _contains_any(text: str, keywords: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(keyword.lower() in lowered for keyword in keywords)


def _normalize(text: str) -> str:
    return re.sub(r"[^0-9a-zA-Z\uAC00-\uD7A3]+", "", text).lower()


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value))
    except ValueError:
        return None


def _format_datetime(value: Any) -> str:
    parsed = _parse_datetime(value)
    if parsed is None:
        return "-"
    return f"{parsed.year}\ub144 {parsed.month}\uc6d4 {parsed.day}\uc77c {parsed:%H:%M}"


def _trim_text(text: Any, limit: int = 90) -> str:
    content = " ".join(str(text or "").split())
    if len(content) <= limit:
        return content
    return f"{content[: limit - 1]}..."


class GroundedAnswerService:
    def __init__(self, backend_client: BackendApiClient):
        self._backend_client = backend_client

    async def answer_user(self, message: str) -> str | None:
        try:
            if self._is_event_query(message):
                event = await self._select_event(message)
                if event is not None:
                    return self._build_user_event_response(
                        event,
                        prefer_current=_contains_any(message, _CURRENT_KEYWORDS),
                    )

            if _contains_any(message, _NOTICE_KEYWORDS):
                notice = await self._select_notice(message)
                if notice is not None:
                    return self._build_user_notice_response(notice)

            if _contains_any(message, _FAQ_KEYWORDS):
                faq = await self._select_faq(message)
                if faq is not None:
                    return self._build_user_faq_response(faq)
        except BackendApiError:
            return None

        return None

    async def answer_admin(self, message: str) -> str | None:
        try:
            if self._is_admin_event_summary_query(message):
                summary = await self._backend_client.get_ai_summary()
                event = await self._select_event(message)
                if event is not None:
                    return self._build_admin_summary_response(message, event, summary)

            if _contains_any(message, _NOTICE_KEYWORDS):
                notice = await self._select_notice(message)
                if notice is not None:
                    return self._build_admin_notice_response(notice)
        except BackendApiError:
            return None

        return None

    def _is_event_query(self, message: str) -> bool:
        return _contains_any(message, _EVENT_KEYWORDS) or _contains_any(
            message,
            _LOCATION_KEYWORDS + _SCHEDULE_KEYWORDS,
        )

    def _is_admin_event_summary_query(self, message: str) -> bool:
        return self._is_event_query(message) and (
            _contains_any(message, _SUMMARY_KEYWORDS)
            or _contains_any(message, _RECOMMEND_KEYWORDS)
            or _contains_any(message, _CURRENT_KEYWORDS)
        )

    async def _select_event(self, message: str) -> dict[str, Any] | None:
        events = await self._backend_client.list_events(size=30)
        if not events:
            return None

        matched = self._match_event_by_name(message, events)
        if matched is not None:
            return matched

        if _contains_any(message, _CURRENT_KEYWORDS):
            return self._pick_by_status(events, "ONGOING") or self._pick_by_status(events, "PLANNED")
        if _contains_any(message, _UPCOMING_KEYWORDS):
            return self._pick_by_status(events, "PLANNED") or self._pick_by_status(events, "ONGOING")
        if _contains_any(message, _ENDED_KEYWORDS):
            return self._pick_by_status(events, "ENDED")
        return self._pick_by_status(events, "ONGOING") or self._pick_by_status(events, "PLANNED") or events[0]

    async def _select_notice(self, message: str) -> dict[str, Any] | None:
        keyword = await self._extract_keyword(message)
        notices = await self._backend_client.list_notices(keyword=keyword, size=5)
        if not notices:
            return None
        return max(
            notices,
            key=lambda item: (
                self._score_notice_match(message, keyword, item),
                bool(item.get("pinned")),
                str(item.get("updatedAt") or ""),
            ),
        )

    async def _select_faq(self, message: str) -> dict[str, Any] | None:
        keyword = await self._extract_keyword(message)
        faqs = await self._backend_client.list_faqs(keyword=keyword, size=5)
        if not faqs:
            return None
        selected = max(
            faqs,
            key=lambda item: (
                self._score_text_match(
                    message,
                    keyword,
                    (
                        str(item.get("title") or ""),
                        str(item.get("createdAt") or ""),
                    ),
                ),
                str(item.get("createdAt") or ""),
            ),
        )
        return await self._backend_client.get_faq(int(selected["postId"]))

    async def _extract_keyword(self, message: str) -> str | None:
        events = await self._backend_client.list_events(size=30)
        matched = self._match_event_by_name(message, events)
        if matched is not None:
            return str(matched.get("eventName") or "")

        for candidate in _KEYWORD_CANDIDATES:
            if candidate.lower() in message.lower():
                return candidate
        return None

    def _match_event_by_name(
        self,
        message: str,
        events: list[dict[str, Any]],
    ) -> dict[str, Any] | None:
        normalized_message = _normalize(message)
        for event in events:
            event_name = str(event.get("eventName") or "")
            if event_name and _normalize(event_name) in normalized_message:
                return event
        return None

    def _pick_by_status(self, events: list[dict[str, Any]], status: str) -> dict[str, Any] | None:
        filtered = [event for event in events if str(event.get("status") or "").upper() == status]
        if not filtered:
            return None

        if status == "PLANNED":
            filtered.sort(key=lambda item: _parse_datetime(item.get("startAt")) or datetime.max)
        elif status == "ENDED":
            filtered.sort(
                key=lambda item: _parse_datetime(item.get("endAt")) or datetime.min,
                reverse=True,
            )
        else:
            filtered.sort(key=lambda item: _parse_datetime(item.get("endAt")) or datetime.max)
        return filtered[0]

    def _score_notice_match(self, message: str, keyword: str | None, notice: dict[str, Any]) -> int:
        return self._score_text_match(
            message,
            keyword,
            (
                str(notice.get("title") or ""),
                str(notice.get("content") or ""),
                str(notice.get("eventName") or ""),
            ),
        )

    def _score_text_match(
        self,
        message: str,
        keyword: str | None,
        fields: tuple[str, ...],
    ) -> int:
        normalized_message = _normalize(message)
        score = 0
        candidates = [candidate for candidate in (keyword, *self._message_terms(message)) if candidate]
        weighted_fields = tuple(enumerate(fields))

        for index, field in weighted_fields:
            normalized_field = _normalize(field)
            if not normalized_field:
                continue

            for candidate in candidates:
                normalized_candidate = _normalize(candidate)
                if not normalized_candidate:
                    continue
                if normalized_candidate in normalized_field:
                    score += max(1, 6 - index * 2)
                if normalized_field and normalized_field in normalized_message:
                    score += 2

        return score

    def _message_terms(self, message: str) -> tuple[str, ...]:
        terms = []
        for candidate in _KEYWORD_CANDIDATES:
            if candidate.lower() in message.lower():
                terms.append(candidate)
        return tuple(dict.fromkeys(terms))

    def _build_user_event_response(self, event: dict[str, Any], *, prefer_current: bool) -> str:
        status = str(event.get("status") or "")
        name = str(event.get("eventName") or "\ud589\uc0ac")
        location = str(event.get("location") or "\uc7a5\uc18c \uc815\ubcf4 \uc5c6\uc74c")
        period = (
            f"{_format_datetime(event.get('startAt'))}\ubd80\ud130 "
            f"{_format_datetime(event.get('endAt'))}\uae4c\uc9c0"
        )

        if prefer_current and status != "ONGOING":
            return (
                "\ud604\uc7ac \uc9c4\ud589 \uc911\uc778 \ud589\uc0ac\ub294 \ubc14\ub85c \ud655\uc778\ub418\uc9c0 "
                f"\uc54a\uc558\uc2b5\ub2c8\ub2e4. \uac00\uc7a5 \uac00\uae4c\uc6b4 \ud589\uc0ac\ub294 {name}\uc774\uace0 "
                f"\uc7a5\uc18c\ub294 {location}\uc785\ub2c8\ub2e4. \uc77c\uc815\uc740 {period}\uc785\ub2c8\ub2e4."
            )

        return f"{name} \ud589\uc0ac\uac00 \ud655\uc778\ub410\uace0 \uc7a5\uc18c\ub294 {location}\uc785\ub2c8\ub2e4. \uc77c\uc815\uc740 {period}\uc785\ub2c8\ub2e4."

    def _build_user_notice_response(self, notice: dict[str, Any]) -> str:
        title = str(notice.get("title") or "\ucd5c\uc2e0 \uacf5\uc9c0")
        content = _trim_text(notice.get("content") or "")
        event_name = str(notice.get("eventName") or "")
        if event_name:
            return (
                f"\uac00\uc7a5 \uba3c\uc800 \ud655\uc778\ud560 \uacf5\uc9c0\ub294 '{title}'\uc785\ub2c8\ub2e4. "
                f"{event_name} \uad00\ub828 \uc548\ub0b4\uc774\uace0 \ud575\uc2ec \ub0b4\uc6a9\uc740 {content}"
            )
        return f"\uac00\uc7a5 \uba3c\uc800 \ud655\uc778\ud560 \uacf5\uc9c0\ub294 '{title}'\uc785\ub2c8\ub2e4. \ud575\uc2ec \ub0b4\uc6a9\uc740 {content}"

    def _build_user_faq_response(self, faq: dict[str, Any]) -> str:
        title = str(faq.get("title") or "\uad00\ub828 FAQ")
        answer = _trim_text(faq.get("answerContent") or faq.get("content") or "")
        return f"\uad00\ub828 FAQ\ub85c\ub294 '{title}'\uac00 \uc788\uc2b5\ub2c8\ub2e4. \ub2f5\ubcc0 \ud575\uc2ec\uc740 {answer}"

    def _build_admin_summary_response(
        self,
        message: str,
        event: dict[str, Any],
        summary: dict[str, Any],
    ) -> str:
        congestion = summary.get("congestion") or {}
        ongoing_count = int(congestion.get("ongoingEventCount") or 0)
        today_checkins = int(congestion.get("todayCheckinCount") or 0)
        name = str(event.get("eventName") or "\ud589\uc0ac")
        location = str(event.get("location") or "\uc7a5\uc18c \uc815\ubcf4 \uc5c6\uc74c")
        period = (
            f"{_format_datetime(event.get('startAt'))}\ubd80\ud130 "
            f"{_format_datetime(event.get('endAt'))}\uae4c\uc9c0"
        )
        description = _trim_text(
            event.get("description")
            or "\ud589\uc0ac \uc18c\uac1c \uc815\ubcf4\ub294 \ubcc4\ub3c4\ub85c \ud655\uc778\uc774 \ud544\uc694\ud569\ub2c8\ub2e4.",
            limit=80,
        )

        if _contains_any(message, _RECOMMEND_KEYWORDS):
            return (
                f"\ud604\uc7ac \uc6b4\uc601 \uc911\uc778 \ud589\uc0ac \uc608\uc2dc\ub85c\ub294 {name}\uac00 \uc788\uace0 "
                f"\uc7a5\uc18c\ub294 {location}, \uc77c\uc815\uc740 {period}\uc785\ub2c8\ub2e4. "
                f"\uc6b4\uc601 \uc548\ub0b4\uc5d0\uc11c \uac15\uc870\ud560 \ucd94\ucc9c \ud3ec\uc778\ud2b8\ub294 {description}"
            )

        return (
            f"\ud604\uc7ac \uc9c4\ud589 \uc911\uc778 \ud589\uc0ac\ub294 {ongoing_count}\uac74\uc774\uace0 "
            f"\uc624\ub298 \uccb4\ud06c\uc778\uc740 {today_checkins}\uac74\uc785\ub2c8\ub2e4. "
            f"\ub300\ud45c \uc608\uc2dc\ub85c\ub294 {name}\uac00 \uc788\uc73c\uba70 \uc7a5\uc18c\ub294 {location}, "
            f"\uc77c\uc815\uc740 {period}\uc785\ub2c8\ub2e4."
        )

    def _build_admin_notice_response(self, notice: dict[str, Any]) -> str:
        title = str(notice.get("title") or "\ucd5c\uc2e0 \uacf5\uc9c0")
        content = _trim_text(notice.get("content") or "")
        return (
            f"\uad00\ub9ac\uc6a9 \ucc38\uace0 \uacf5\uc9c0\ub294 '{title}'\uc785\ub2c8\ub2e4. "
            f"\ubc14\ub85c \uacf5\uc720\ud560 \ud575\uc2ec \ubb38\uad6c\ub294 {content}"
        )
