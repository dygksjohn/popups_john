from __future__ import annotations

import json

from pupoo_ai.app.features.chatbot.dto.request import ChatContext, ChatRequest, NotificationDraftContext
from pupoo_ai.app.features.chatbot.dto.response import ChatResponse
from pupoo_ai.app.features.chatbot.service.bedrock_client import generate_structured_draft
from pupoo_ai.app.features.orchestrator.action_planner import PlannedAction
from pupoo_ai.app.features.orchestrator.backend_api_client import BackendApiClient, BackendApiError

VALID_NOTICE_STATUS = {"PUBLISHED", "DRAFT", "HIDDEN"}
EVENT_NOTIFICATION_SCOPES = {"INTEREST_SUBSCRIBERS", "EVENT_REGISTRANTS", "EVENT_PAYERS"}


class NavigationActionHandler:
    def handle(self, planned_action: PlannedAction) -> ChatResponse:
        targets = {
            "notice": {
                "page": "notice",
                "route": "/admin/board/notice",
                "message": "공지 작성 페이지로 이동할게요.",
            },
            "event": {
                "page": "eventManage",
                "route": "/admin/event",
                "message": "행사 등록 페이지로 이동할게요.",
            },
        }
        target = targets[planned_action.target]
        return ChatResponse(
            message=target["message"],
            actions=[
                {
                    "type": "NAVIGATE",
                    "payload": {
                        "page": target["page"],
                        "route": target["route"],
                    },
                }
            ],
        )


class SummaryActionHandler:
    async def handle(self, planned_action: PlannedAction, backend_client: BackendApiClient) -> ChatResponse:
        summary = await backend_client.get_ai_summary()

        if planned_action.target == "congestion":
            congestion = summary.get("congestion") or {}
            notices = summary.get("notices") or {}
            notifications = summary.get("notifications") or {}
            payload = {
                "summaryType": "congestion",
                "title": "혼잡도 요약",
                "items": [
                    {"label": "진행 중 행사", "value": int(congestion.get("ongoingCount") or 0)},
                    {"label": "예정 행사", "value": int(congestion.get("plannedCount") or 0)},
                    {"label": "종료 행사", "value": int(congestion.get("endedCount") or 0)},
                    {"label": "오늘 체크인", "value": int(congestion.get("todayCheckinCount") or 0)},
                ],
                "sections": [
                    {
                        "key": "notices",
                        "title": "공지 운영 현황",
                        "items": [
                            {"label": "전체 공지", "value": int(notices.get("totalCount") or 0)},
                            {"label": "상단 고정", "value": int(notices.get("pinnedCount") or 0)},
                            {"label": "게시 중", "value": int(notices.get("publishedCount") or 0)},
                            {"label": "임시 저장", "value": int(notices.get("draftCount") or 0)},
                        ],
                    },
                    {
                        "key": "notifications",
                        "title": "알림 운영 현황",
                        "items": [
                            {"label": "전체 알림", "value": int(notifications.get("totalCount") or 0)},
                            {"label": "초안", "value": int(notifications.get("draftCount") or 0)},
                            {"label": "발송 완료", "value": int(notifications.get("sentCount") or 0)},
                        ],
                    },
                ],
            }
            return ChatResponse(
                message=(
                    f"현재 진행 중 행사 {payload['items'][0]['value']}건, "
                    f"오늘 체크인 {payload['items'][3]['value']}건입니다."
                ),
                actions=[{"type": "SHOW_SUMMARY", "payload": payload}],
            )

        if planned_action.target == "applicants":
            applicants = summary.get("applicants") or {}
            event_registrations = applicants.get("eventRegistrations") or {}
            program_applies = applicants.get("programApplies") or {}
            payload = {
                "summaryType": "applicants",
                "title": "신청자 수 요약",
                "items": [
                    {
                        "label": "행사 신청 전체",
                        "value": int(event_registrations.get("appliedCount") or 0),
                    },
                    {
                        "label": "프로그램 신청 전체",
                        "value": int(program_applies.get("appliedCount") or 0),
                    },
                ],
                "sections": [
                    {
                        "key": "eventRegistrations",
                        "title": "행사 신청 현황",
                        "items": [
                            {"label": "신청", "value": int(event_registrations.get("appliedCount") or 0)},
                            {"label": "승인", "value": int(event_registrations.get("approvedCount") or 0)},
                            {"label": "반려", "value": int(event_registrations.get("rejectedCount") or 0)},
                            {"label": "취소", "value": int(event_registrations.get("cancelledCount") or 0)},
                            {"label": "활성", "value": int(event_registrations.get("activeCount") or 0)},
                        ],
                    },
                    {
                        "key": "programApplies",
                        "title": "프로그램 신청 현황",
                        "items": [
                            {"label": "신청", "value": int(program_applies.get("appliedCount") or 0)},
                            {"label": "대기", "value": int(program_applies.get("waitingCount") or 0)},
                            {"label": "승인", "value": int(program_applies.get("approvedCount") or 0)},
                            {"label": "반려", "value": int(program_applies.get("rejectedCount") or 0)},
                            {"label": "취소", "value": int(program_applies.get("cancelledCount") or 0)},
                            {"label": "체크인", "value": int(program_applies.get("checkedInCount") or 0)},
                            {"label": "활성", "value": int(program_applies.get("activeCount") or 0)},
                        ],
                    },
                ],
            }
            return ChatResponse(
                message=(
                    f"신청자 수를 보면 행사 신청 {payload['sections'][0]['items'][0]['value']}건, "
                    f"프로그램 신청 {payload['sections'][1]['items'][0]['value']}건입니다."
                ),
                actions=[{"type": "SHOW_SUMMARY", "payload": payload}],
            )

        refunds = summary.get("refunds") or {}
        notices = summary.get("notices") or {}
        notifications = summary.get("notifications") or {}
        payload = {
            "summaryType": "refund",
            "title": "환불 현황 요약",
            "items": [
                {"label": "전체 환불", "value": int(refunds.get("totalCount") or 0)},
                {"label": "요청", "value": int(refunds.get("requestedCount") or 0)},
                {"label": "승인", "value": int(refunds.get("approvedCount") or 0)},
                {"label": "반려", "value": int(refunds.get("rejectedCount") or 0)},
                {"label": "완료", "value": int(refunds.get("completedCount") or 0)},
            ],
            "sections": [
                {
                    "key": "notices",
                    "title": "공지 운영 현황",
                    "items": [
                        {"label": "게시 중", "value": int(notices.get("publishedCount") or 0)},
                        {"label": "임시 저장", "value": int(notices.get("draftCount") or 0)},
                        {"label": "숨김", "value": int(notices.get("hiddenCount") or 0)},
                    ],
                },
                {
                    "key": "notifications",
                    "title": "알림 운영 현황",
                    "items": [
                        {"label": "초안", "value": int(notifications.get("draftCount") or 0)},
                        {"label": "발송 완료", "value": int(notifications.get("sentCount") or 0)},
                    ],
                },
            ],
        }
        return ChatResponse(
            message=(
                f"환불은 전체 {payload['items'][0]['value']}건이며 "
                f"요청 {payload['items'][1]['value']}건, 승인 {payload['items'][2]['value']}건, 완료 {payload['items'][4]['value']}건입니다."
            ),
            actions=[{"type": "SHOW_SUMMARY", "payload": payload}],
        )


class DraftActionHandler:
    async def handle(self, planned_action: PlannedAction, request: ChatRequest) -> ChatResponse:
        if planned_action.target == "notice":
            draft = await self._build_notice_draft(request.message)
            return ChatResponse(
                message="공지 초안을 준비했어요. 저장 전에는 화면에서 상태와 내용을 한 번 더 확인해 주세요.",
                actions=[
                    {
                        "type": "PREFILL_FORM",
                        "payload": {
                            "formType": "notice",
                            "page": "notice",
                            "route": "/admin/board/notice",
                            "formData": draft,
                            "execution": {
                                "supported": True,
                                "executeType": "SAVE_NOTICE",
                                "targetType": "NOTICE",
                                "status": draft.get("status"),
                                "supportedExecuteTypes": ["SAVE_NOTICE"],
                            },
                        },
                    }
                ],
            )

        draft = await self._build_notification_draft(request.message)
        execution = self._build_notification_execution(draft)
        return ChatResponse(
            message=(
                "알림 문구 초안을 준비했어요. "
                "지원되는 발송 방식만 화면에서 확인한 뒤 실행할 수 있습니다."
            ),
            actions=[
                {
                    "type": "PREFILL_FORM",
                    "payload": {
                        "formType": "notification",
                        "page": "alertManage",
                        "route": "/admin/participant/alert",
                        "formData": draft,
                        "execution": execution,
                    },
                }
            ],
        )

    async def _build_notice_draft(self, user_message: str) -> dict:
        prompt = (
            "관리자 공지 초안을 JSON으로 생성한다. "
            "키는 title, content, pinned, scope, status만 사용한다. "
            "scope는 ALL 또는 EVENT, status는 DRAFT만 사용한다. "
            "content는 줄바꿈이 자연스러운 공지문으로 작성한다.\n"
            f"사용자 요청: {user_message}"
        )
        fallback = {
            "title": "행사 운영 안내",
            "content": "안녕하세요.\n행사 운영 관련 안내 사항을 전달드립니다.\n내용을 확인하시고 이용에 참고 부탁드립니다.",
            "pinned": False,
            "scope": "ALL",
            "status": "DRAFT",
        }
        return await self._generate_json(prompt, fallback)

    async def _build_notification_draft(self, user_message: str) -> dict:
        prompt = (
            "관리자 알림 초안을 JSON으로 생성한다. "
            "키는 title, content, alertMode, recipientScopes, specialTargetKey만 사용한다. "
            "기본 alertMode는 event, recipientScopes 기본값은 [\"INTEREST_SUBSCRIBERS\"] 이다.\n"
            f"사용자 요청: {user_message}"
        )
        fallback = {
            "title": "행사 안내 알림",
            "content": "행사 관련 새로운 안내가 등록되었습니다. 자세한 내용은 관리자 공지를 확인해 주세요.",
            "alertMode": "event",
            "recipientScopes": ["INTEREST_SUBSCRIBERS"],
            "specialTargetKey": "",
        }
        return await self._generate_json(prompt, fallback)

    async def _generate_json(self, prompt: str, fallback: dict) -> dict:
        try:
            raw = await generate_structured_draft(prompt)
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                merged = dict(fallback)
                merged.update({key: value for key, value in parsed.items() if value is not None})
                return merged
        except Exception:
            return fallback
        return fallback

    def _build_notification_execution(self, draft: dict) -> dict:
        draft_context = NotificationDraftContext.model_validate(draft)
        return _build_notification_execution_payload(draft_context)


class UnsupportedActionHandler:
    def handle(self, planned_action: PlannedAction, context: ChatContext) -> ChatResponse:
        if planned_action.target != "schedule_notification":
            return ChatResponse(
                message="현재 요청한 기능은 backend 계약 기준으로 지원되지 않습니다.",
                messageType="unsupported",
                actions=[],
            )

        actions = []
        if context.notification_draft is not None and context.notification_draft.title.strip():
            actions.append(
                {
                    "type": "PREFILL_FORM",
                    "payload": {
                        "formType": "notification",
                        "page": "alertManage",
                        "route": "/admin/participant/alert",
                        "formData": context.notification_draft.model_dump(by_alias=True),
                        "execution": {
                            "supported": False,
                            "requestedAction": "SCHEDULE_NOTIFICATION",
                            "reason": "예약 발송은 backend에서 지원하지 않습니다. 현재는 즉시 발송만 가능합니다.",
                            "unsupportedActions": ["SCHEDULE_NOTIFICATION"],
                            "supportedExecuteTypes": [],
                        },
                    },
                }
            )

        return ChatResponse(
            message=(
                "알림 예약 발송은 현재 지원되지 않습니다. "
                "admin_notification은 DRAFT / SENT 구조이며 scheduled_at 필드가 없습니다."
            ),
            messageType="unsupported",
            actions=actions,
        )


class ExecuteActionHandler:
    def prepare(self, planned_action: PlannedAction, context: ChatContext) -> ChatResponse:
        if planned_action.target == "save_notice":
            if context.notice_draft is None or not context.notice_draft.title.strip():
                return ChatResponse(
                    message="저장할 공지 초안이 없습니다. 먼저 공지 초안을 만들거나 화면에서 내용을 확인해 주세요."
                )

            notice_capability = ((planned_action.metadata or {}).get("capabilities") or {}).get("notice") or {}
            if "SAVE_NOTICE" not in (notice_capability.get("supportedExecuteTypes") or []):
                return self.unsupported("현재 공지 저장은 실행 가능한 상태가 아닙니다.")

            payload = {
                "type": "SAVE_NOTICE",
                "executeType": "SAVE_NOTICE",
                "targetType": "NOTICE",
                "payload": context.notice_draft.model_dump(by_alias=True),
            }
            return ChatResponse(
                message=f"'{context.notice_draft.title}' 공지를 저장할까요?",
                actions=[{"type": "CONFIRM_EXECUTE", "payload": payload}],
            )

        if planned_action.target in {
            "send_notification",
            "send_notification_draft",
            "send_event_notification",
            "send_broadcast_notification",
        }:
            if context.notification_draft is None or not context.notification_draft.title.strip():
                return ChatResponse(
                    message="발송할 알림 초안이 없습니다. 먼저 알림 문구를 만들거나 화면의 초안을 확인해 주세요."
                )

            execute_type = self._resolve_notification_execute_type(planned_action, context)
            if execute_type is None:
                return self.unsupported(
                    "현재 알림 초안은 backend capability 기준으로 바로 실행할 수 없습니다. 화면에서 대상과 발송 방식을 먼저 확인해 주세요."
                )

            label = self._resolve_notification_label(execute_type)
            payload = {
                "type": execute_type,
                "executeType": execute_type,
                "targetType": self._resolve_notification_target_type(execute_type),
                "payload": context.notification_draft.model_dump(by_alias=True),
            }
            return ChatResponse(
                message=f"'{context.notification_draft.title}' 알림을 {label}할까요?",
                actions=[{"type": "CONFIRM_EXECUTE", "payload": payload}],
            )

        return self.unsupported("현재 요청한 실행 액션은 backend capability가 없어 진행할 수 없습니다.")

    def unsupported(self, message: str) -> ChatResponse:
        return ChatResponse(message=message, messageType="unsupported", actions=[])

    async def confirm(self, confirmation: dict, backend_client: BackendApiClient) -> ChatResponse:
        confirmation_type = str(
            confirmation.get("executeType") or confirmation.get("type") or ""
        ).upper()
        payload = confirmation.get("payload") or {}

        if confirmation_type == "SAVE_NOTICE":
            status = str(payload.get("status") or "DRAFT").upper()
            if status not in VALID_NOTICE_STATUS:
                status = "DRAFT"

            body = {
                "title": payload.get("title", ""),
                "content": payload.get("content", ""),
                "pinned": bool(payload.get("pinned", False)),
                "scope": payload.get("scope") or "ALL",
                "eventId": payload.get("eventId"),
                "status": status,
            }
            notice_id = payload.get("noticeId")
            saved = (
                await backend_client.update_notice(int(notice_id), body)
                if notice_id
                else await backend_client.create_notice(body)
            )
            saved_notice = {
                **payload,
                "noticeId": saved.get("noticeId") or notice_id,
                "status": str(saved.get("status") or status),
            }
            return ChatResponse(
                message=(
                    f"공지 저장이 완료되었습니다. noticeId={saved_notice.get('noticeId')}, "
                    f"status={saved_notice.get('status')}"
                ),
                actions=[
                    {
                        "type": "PREFILL_FORM",
                        "payload": {
                            "formType": "notice",
                            "page": "notice",
                            "route": "/admin/board/notice",
                            "formData": saved_notice,
                            "execution": {
                                "supported": True,
                                "executeType": "SAVE_NOTICE",
                                "targetType": "NOTICE",
                                "status": saved_notice.get("status"),
                                "supportedExecuteTypes": ["SAVE_NOTICE"],
                            },
                        },
                    }
                ],
            )

        if confirmation_type == "SEND_NOTIFICATION_DRAFT":
            notification_id = payload.get("notificationId")
            if not notification_id:
                return self.unsupported("저장된 알림 초안이 없어서 draft 발송을 실행할 수 없습니다.")

            draft_body = self._build_notification_draft_body(payload)
            draft = await backend_client.update_notification_draft(int(notification_id), draft_body)
            sent = await backend_client.send_notification(int(draft.get("id") or notification_id))
            return ChatResponse(
                message=self._build_notification_success_message("저장된 초안 발송", sent),
                actions=[
                    {
                        "type": "PREFILL_FORM",
                        "payload": {
                            "formType": "notification",
                            "page": "alertManage",
                            "route": "/admin/participant/alert",
                            "formData": payload,
                            "execution": {
                                "supported": False,
                                "executeType": "SEND_NOTIFICATION_DRAFT",
                                "targetType": "NOTIFICATION_DRAFT",
                                "reason": "저장된 초안 발송이 완료되었습니다. 다시 발송하려면 화면에서 내용을 확인한 뒤 새로 요청해 주세요.",
                                "supportedExecuteTypes": [],
                                "unsupportedActions": ["SCHEDULE_NOTIFICATION"],
                            },
                        },
                    }
                ],
            )

        if confirmation_type == "SEND_EVENT_NOTIFICATION":
            event_payload = self._build_event_notification_body(payload)
            sent = await backend_client.send_event_notification(event_payload)
            return ChatResponse(
                message=self._build_notification_success_message("이벤트 알림 발송", sent),
                actions=[
                    {
                        "type": "PREFILL_FORM",
                        "payload": {
                            "formType": "notification",
                            "page": "alertManage",
                            "route": "/admin/participant/alert",
                            "formData": payload,
                            "execution": {
                                "supported": False,
                                "executeType": "SEND_EVENT_NOTIFICATION",
                                "targetType": "EVENT_NOTIFICATION",
                                "reason": "이벤트 알림 발송이 완료되었습니다. 다시 발송하려면 화면에서 대상과 문구를 다시 확인해 주세요.",
                                "supportedExecuteTypes": [],
                                "unsupportedActions": ["SCHEDULE_NOTIFICATION"],
                            },
                        },
                    }
                ],
            )

        if confirmation_type == "SEND_BROADCAST_NOTIFICATION":
            broadcast_payload = self._build_broadcast_notification_body(payload)
            sent = await backend_client.send_broadcast_notification(broadcast_payload)
            return ChatResponse(
                message=self._build_notification_success_message("전체 알림 발송", sent),
                actions=[
                    {
                        "type": "PREFILL_FORM",
                        "payload": {
                            "formType": "notification",
                            "page": "alertManage",
                            "route": "/admin/participant/alert",
                            "formData": payload,
                            "execution": {
                                "supported": False,
                                "executeType": "SEND_BROADCAST_NOTIFICATION",
                                "targetType": "BROADCAST_NOTIFICATION",
                                "reason": "전체 알림 발송이 완료되었습니다. 다시 발송하려면 화면에서 문구를 다시 확인해 주세요.",
                                "supportedExecuteTypes": [],
                                "unsupportedActions": ["SCHEDULE_NOTIFICATION"],
                            },
                        },
                    }
                ],
            )

        if confirmation_type == "SCHEDULE_NOTIFICATION":
            return self.unsupported("알림 예약 발송은 backend 미지원 기능이라 실행할 수 없습니다.")

        raise BackendApiError("지원하지 않는 확인 요청입니다.")

    def _resolve_notification_execute_type(
        self,
        planned_action: PlannedAction,
        context: ChatContext,
    ) -> str | None:
        notification_capability = ((planned_action.metadata or {}).get("capabilities") or {}).get("notification") or {}
        supported_execute_types = notification_capability.get("supportedExecuteTypes") or []
        target_to_type = {
            "send_notification_draft": "SEND_NOTIFICATION_DRAFT",
            "send_event_notification": "SEND_EVENT_NOTIFICATION",
            "send_broadcast_notification": "SEND_BROADCAST_NOTIFICATION",
        }

        if planned_action.target in target_to_type:
            execute_type = target_to_type[planned_action.target]
            return execute_type if execute_type in supported_execute_types else None

        if len(supported_execute_types) == 1:
            return supported_execute_types[0]

        if context.notification_draft is None:
            return None

        inferred = _infer_notification_execute_type(context.notification_draft)
        if inferred in supported_execute_types:
            return inferred
        return None

    def _resolve_notification_target_type(self, execute_type: str) -> str:
        mapping = {
            "SEND_NOTIFICATION_DRAFT": "NOTIFICATION_DRAFT",
            "SEND_EVENT_NOTIFICATION": "EVENT_NOTIFICATION",
            "SEND_BROADCAST_NOTIFICATION": "BROADCAST_NOTIFICATION",
        }
        return mapping.get(execute_type, "NOTIFICATION")

    def _resolve_notification_label(self, execute_type: str) -> str:
        mapping = {
            "SEND_NOTIFICATION_DRAFT": "저장된 초안 발송",
            "SEND_EVENT_NOTIFICATION": "이벤트 알림 발송",
            "SEND_BROADCAST_NOTIFICATION": "전체 알림 발송",
        }
        return mapping.get(execute_type, "알림 발송")

    def _build_notification_draft_body(self, payload: dict) -> dict:
        return {
            "title": payload.get("title", ""),
            "content": payload.get("content", ""),
            "alertMode": payload.get("alertMode") or "event",
            "eventId": payload.get("eventId"),
            "eventName": payload.get("eventName") or "",
            "eventStatus": payload.get("eventStatus") or "",
            "alertTargetLabel": payload.get("alertTargetLabel") or "",
            "specialTargetKey": payload.get("specialTargetKey") or "",
            "recipientScope": payload.get("recipientScope"),
            "recipientScopes": payload.get("recipientScopes") or [],
        }

    def _build_event_notification_body(self, payload: dict) -> dict:
        event_id = payload.get("eventId")
        if event_id is None:
            raise BackendApiError("이벤트 알림 발송에는 eventId가 필요합니다.")

        recipient_scopes = [
            scope
            for scope in (payload.get("recipientScopes") or [])
            if str(scope).upper() in EVENT_NOTIFICATION_SCOPES
        ]
        recipient_scope = payload.get("recipientScope")
        if not recipient_scopes and recipient_scope in EVENT_NOTIFICATION_SCOPES:
            recipient_scopes = [recipient_scope]
        if not recipient_scopes:
            recipient_scopes = ["INTEREST_SUBSCRIBERS"]

        return {
            "type": payload.get("notificationType") or "EVENT",
            "title": payload.get("title", ""),
            "content": payload.get("content", ""),
            "targetType": payload.get("targetType") or "EVENT",
            "targetId": payload.get("targetId") or event_id,
            "eventId": event_id,
            "channels": payload.get("channels") or ["APP"],
            "recipientScope": recipient_scopes[0],
            "recipientScopes": recipient_scopes,
        }

    def _build_broadcast_notification_body(self, payload: dict) -> dict:
        notification_type = payload.get("notificationType")
        alert_mode = str(payload.get("alertMode") or "").lower()
        if not notification_type:
            notification_type = "SYSTEM" if alert_mode == "system" else "NOTICE"

        return {
            "type": notification_type,
            "title": payload.get("title", ""),
            "content": payload.get("content", ""),
            "targetType": payload.get("targetType") or notification_type,
            "targetId": payload.get("targetId") or 0,
            "channels": payload.get("channels") or ["APP"],
        }

    def _build_notification_success_message(self, prefix: str, response: dict) -> str:
        target_count = response.get("targetCount")
        if target_count is None:
            return f"{prefix}이 완료되었습니다."
        return f"{prefix}이 완료되었습니다. 발송 대상 수는 {target_count}명입니다."


def _infer_notification_execute_type(draft: NotificationDraftContext) -> str | None:
    alert_mode = str(draft.alert_mode or "").lower()
    if draft.notification_id is not None:
        return "SEND_NOTIFICATION_DRAFT"
    if alert_mode == "event" and draft.event_id is not None:
        return "SEND_EVENT_NOTIFICATION"
    if alert_mode in {"important", "system", "broadcast"}:
        return "SEND_BROADCAST_NOTIFICATION"
    return None


def _build_notification_execution_payload(draft: NotificationDraftContext) -> dict:
    execute_type = _infer_notification_execute_type(draft)
    if execute_type is None:
        return {
            "supported": False,
            "reason": "현재 초안은 backend 계약 기준으로 바로 발송할 수 없습니다.",
            "unsupportedActions": ["SCHEDULE_NOTIFICATION"],
            "supportedExecuteTypes": [],
        }

    target_type_map = {
        "SEND_NOTIFICATION_DRAFT": "NOTIFICATION_DRAFT",
        "SEND_EVENT_NOTIFICATION": "EVENT_NOTIFICATION",
        "SEND_BROADCAST_NOTIFICATION": "BROADCAST_NOTIFICATION",
    }
    return {
        "supported": True,
        "executeType": execute_type,
        "targetType": target_type_map[execute_type],
        "status": draft.status,
        "supportedExecuteTypes": [execute_type],
        "unsupportedActions": ["SCHEDULE_NOTIFICATION"],
    }
