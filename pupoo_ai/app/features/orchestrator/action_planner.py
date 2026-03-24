from dataclasses import dataclass, field

from pupoo_ai.app.features.chatbot.dto.request import ChatContext
from pupoo_ai.app.features.orchestrator.intent_analyzer import IntentResult


@dataclass(slots=True)
class PlannedAction:
    intent_type: str
    target: str
    requires_confirmation: bool = False
    metadata: dict = field(default_factory=dict)


class ActionPlanner:
    def plan(self, intent: IntentResult, context: ChatContext) -> PlannedAction:
        metadata = {
            "current_page": context.current_page,
            "route": context.route,
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

        return PlannedAction(
            intent_type=intent.intent_type,
            target=intent.target,
            requires_confirmation=intent.requires_confirmation,
            metadata=metadata,
        )

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
