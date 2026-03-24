from dataclasses import dataclass, field

from pupoo_ai.app.features.chatbot.dto.request import ChatContext
from pupoo_ai.app.features.orchestrator.intent_analyzer import IntentResult


@dataclass(slots=True)
class PlannedAction:
    intent_type: str
    target: str
    action_key: str
    requires_confirmation: bool = False
    metadata: dict = field(default_factory=dict)


class ActionPlanner:
    def plan(self, intent: IntentResult, context: ChatContext) -> PlannedAction:
        metadata = {
            "current_page": context.current_page,
            "route": context.route,
            "action_key": intent.action_key,
            "slots": dict(intent.slots or {}),
            "score": intent.score,
            "confidence": intent.confidence,
            "capabilities": {
                "notice": self._resolve_notice_capabilities(context),
                "notification": self._resolve_notification_capabilities(context),
            },
        }

        if context.notice_draft is not None:
            metadata["notice_draft"] = context.notice_draft.model_dump(by_alias=True)
        if context.notice_execution is not None:
            metadata["notice_execution"] = context.notice_execution.model_dump(by_alias=True)
        if context.notification_draft is not None:
            metadata["notification_draft"] = context.notification_draft.model_dump(by_alias=True)
        if context.notification_execution is not None:
            metadata["notification_execution"] = context.notification_execution.model_dump(by_alias=True)

        planned_action = PlannedAction(
            intent_type=intent.intent_type,
            target=intent.target,
            action_key=intent.action_key,
            requires_confirmation=intent.requires_confirmation,
            metadata=metadata,
        )
        return self._apply_capability_gate(planned_action)

    def _apply_capability_gate(self, planned_action: PlannedAction) -> PlannedAction:
        if planned_action.intent_type != "execute":
            return planned_action

        metadata = planned_action.metadata or {}
        action_key = planned_action.action_key
        notice_capability = (metadata.get("capabilities") or {}).get("notice") or {}
        notification_capability = (metadata.get("capabilities") or {}).get("notification") or {}

        if action_key in {"notice_create", "notice_update", "notice_hide"}:
            if "SAVE_NOTICE" in (notice_capability.get("supportedExecuteTypes") or []):
                return planned_action
            metadata["unsupportedReason"] = "현재 공지 상태로는 저장 실행을 바로 지원하지 않습니다."
            return PlannedAction("unsupported", "unsupported_capability", action_key, False, metadata)

        notification_type_map = {
            "notification_draft_delete": None,
            "notification_draft_send": "SEND_NOTIFICATION_DRAFT",
            "notification_event_send": "SEND_EVENT_NOTIFICATION",
            "notification_broadcast_send": "SEND_BROADCAST_NOTIFICATION",
        }
        required_execute_type = notification_type_map.get(action_key)
        if action_key == "notification_draft_delete":
            has_notification_id = bool((metadata.get("slots") or {}).get("notificationId") or (metadata.get("notification_draft") or {}).get("notificationId"))
            if has_notification_id:
                return planned_action
            metadata["unsupportedReason"] = "현재 알림 초안이 연결되지 않아 삭제 실행을 바로 지원하지 않습니다."
            return PlannedAction("unsupported", "unsupported_capability", action_key, False, metadata)

        if required_execute_type and required_execute_type in (notification_capability.get("supportedExecuteTypes") or []):
            return planned_action

        if required_execute_type:
            metadata["unsupportedReason"] = "현재 초안 상태로는 요청한 알림 실행을 바로 지원하지 않습니다."
            return PlannedAction("unsupported", "unsupported_capability", action_key, False, metadata)

        return planned_action

    def _resolve_notice_capabilities(self, context: ChatContext) -> dict:
        execution = (
            context.notice_execution.model_dump(by_alias=True)
            if context.notice_execution is not None
            else {}
        )
        supported_execute_types = list(execution.get("supportedExecuteTypes") or [])
        if context.notice_draft is not None and "SAVE_NOTICE" not in supported_execute_types:
            supported_execute_types.append("SAVE_NOTICE")

        return {
            "canConfirm": bool(supported_execute_types),
            "supportedExecuteTypes": supported_execute_types,
        }

    def _resolve_notification_capabilities(self, context: ChatContext) -> dict:
        execution = (
            context.notification_execution.model_dump(by_alias=True)
            if context.notification_execution is not None
            else {}
        )
        supported_execute_types = list(execution.get("supportedExecuteTypes") or [])

        draft = context.notification_draft
        if draft is not None and not supported_execute_types:
            alert_mode = str(draft.alert_mode or "").lower()
            if draft.notification_id is not None:
                supported_execute_types.append("SEND_NOTIFICATION_DRAFT")
            elif alert_mode == "event" and draft.event_id is not None:
                supported_execute_types.append("SEND_EVENT_NOTIFICATION")
            elif alert_mode in {"important", "system", "broadcast"}:
                supported_execute_types.append("SEND_BROADCAST_NOTIFICATION")

        return {
            "canConfirm": bool(supported_execute_types),
            "supportedExecuteTypes": supported_execute_types,
            "requestedAction": execution.get("requestedAction"),
            "reason": execution.get("reason"),
        }
