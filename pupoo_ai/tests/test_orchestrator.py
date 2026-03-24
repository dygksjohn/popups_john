import sys
import unittest
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))

from pupoo_ai.app.features.chatbot.dto.request import (  # noqa: E402
    ChatContext,
    ExecutionContext,
    NoticeDraftContext,
    NotificationDraftContext,
)
from pupoo_ai.app.features.orchestrator.action_planner import ActionPlanner  # noqa: E402
from pupoo_ai.app.features.orchestrator.handlers import ExecuteActionHandler, SummaryActionHandler  # noqa: E402
from pupoo_ai.app.features.orchestrator.intent_analyzer import IntentAnalyzer  # noqa: E402


class IntentAnalyzerTest(unittest.TestCase):
    def setUp(self):
        self.analyzer = IntentAnalyzer()

    def test_congestion_summary_phrase(self):
        result = self.analyzer.analyze("지금 붐비는 곳 알려줘")
        self.assertIsNotNone(result)
        self.assertEqual(result.intent_type, "summary")
        self.assertEqual(result.target, "congestion")
        self.assertEqual(result.action_key, "summary_get")

    def test_notice_draft_phrase(self):
        result = self.analyzer.analyze("공지 하나 만들어줘")
        self.assertIsNotNone(result)
        self.assertEqual(result.intent_type, "draft")
        self.assertEqual(result.target, "notice")
        self.assertEqual(result.action_key, "prefill_notice_form")

    def test_event_notification_phrase(self):
        result = self.analyzer.analyze("행사 12번 알림 보내줘")
        self.assertIsNotNone(result)
        self.assertEqual(result.intent_type, "execute")
        self.assertEqual(result.action_key, "notification_event_send")
        self.assertEqual(result.confidence, "high")
        self.assertEqual(result.slots["eventId"], 12)
        self.assertEqual(result.slots["targetType"], "EVENT")
        self.assertEqual(result.slots["targetId"], 12)

    def test_broadcast_phrase(self):
        result = self.analyzer.analyze("전체 알림 보내")
        self.assertIsNotNone(result)
        self.assertEqual(result.intent_type, "execute")
        self.assertEqual(result.action_key, "notification_broadcast_send")

    def test_event_notification_without_event_id_is_low_confidence(self):
        result = self.analyzer.analyze("행사 알림 보내줘")
        self.assertIsNotNone(result)
        self.assertEqual(result.intent_type, "low_confidence")
        self.assertEqual(result.action_key, "low_confidence")

    def test_notice_update_without_target_is_low_confidence(self):
        result = self.analyzer.analyze("공지 수정해줘")
        self.assertIsNotNone(result)
        self.assertEqual(result.intent_type, "low_confidence")
        self.assertEqual(result.action_key, "low_confidence")

    def test_notice_related_phrase_is_ambiguous(self):
        result = self.analyzer.analyze("공지 관련 처리해줘")
        self.assertIsNotNone(result)
        self.assertEqual(result.intent_type, "ambiguous")
        self.assertEqual(result.action_key, "ambiguous")


class FakeBackendClient:
    def __init__(self):
        self.deleted_notification_id = None
        self.sent_event_body = None

    async def get_ai_summary(self):
        return {
            "congestion": {
                "ongoingEventCount": 2,
                "plannedEventCount": 3,
                "endedEventCount": 4,
                "todayCheckinCount": 21,
            },
            "applicants": {
                "eventRegistrations": {
                    "appliedCount": 10,
                    "approvedCount": 8,
                    "rejectedCount": 1,
                    "cancelledCount": 1,
                    "activeCount": 7,
                },
                "programApplies": {
                    "appliedCount": 6,
                    "waitingCount": 2,
                    "approvedCount": 3,
                    "rejectedCount": 1,
                    "cancelledCount": 0,
                    "checkedInCount": 2,
                    "activeCount": 3,
                },
            },
            "notices": {"publishedCount": 6, "draftCount": 3, "hiddenCount": 3},
            "notifications": {"draftCount": 5, "sentCount": 15},
            "refunds": {"totalCount": 9, "requestedCount": 3, "approvedCount": 2, "rejectedCount": 1, "completedCount": 3},
        }

    async def get_ai_capabilities(self):
        return {
            "actions": [
                {"action": "notice_create", "supported": True, "method": "POST", "path": "/api/admin/notices"},
                {"action": "notification_schedule_send", "supported": False, "description": "unsupported"},
            ]
        }

    async def delete_notification_draft(self, notification_id):
        self.deleted_notification_id = notification_id
        return {"message": "deleted"}

    async def update_notification_draft(self, notification_id, body):
        return {"id": notification_id, **body}

    async def send_notification(self, notification_id):
        return {"id": notification_id, "targetCount": 15}

    async def send_event_notification(self, body):
        self.sent_event_body = body
        return {"targetCount": 12}


class ExecuteActionHandlerTest(unittest.IsolatedAsyncioTestCase):
    async def test_event_notification_requires_event_id(self):
        context = ChatContext(
            notificationDraft=NotificationDraftContext(title="행사 안내", content="본문", alertMode="event"),
            notificationExecution=ExecutionContext(supported=False, supportedExecuteTypes=[]),
        )
        planned_action = ActionPlanner().plan(
            IntentAnalyzer().analyze("행사 알림 보내줘", context),
            context,
        )
        self.assertEqual(planned_action.intent_type, "low_confidence")

    async def test_broadcast_prepare_reports_missing_fields(self):
        context = ChatContext(
            notificationDraft=NotificationDraftContext(title="제목", content="", alertMode="important"),
            notificationExecution=ExecutionContext(supported=True, supportedExecuteTypes=["SEND_BROADCAST_NOTIFICATION"]),
        )
        planned_action = ActionPlanner().plan(
            IntentAnalyzer().analyze("전체 알림 보내", context),
            context,
        )
        response = ExecuteActionHandler().prepare(planned_action, context)
        self.assertEqual(response.message_type, "validation")
        self.assertEqual(response.actions[0].type, "PREFILL_FORM")
        self.assertEqual(response.actions[0].payload["execution"]["missingFields"], ["content"])

    async def test_confirm_notification_delete(self):
        client = FakeBackendClient()
        response = await ExecuteActionHandler().confirm(
            {"executeType": "DELETE_NOTIFICATION_DRAFT", "payload": {"notificationId": 5}},
            client,
        )
        self.assertEqual(client.deleted_notification_id, 5)
        self.assertIn("notificationId=5", response.message)

    async def test_confirm_event_notification_applies_defaults(self):
        client = FakeBackendClient()
        response = await ExecuteActionHandler().confirm(
            {
                "executeType": "SEND_EVENT_NOTIFICATION",
                "payload": {
                    "title": "행사 알림",
                    "content": "안내",
                    "alertMode": "event",
                    "eventId": 12,
                },
            },
            client,
        )
        self.assertEqual(client.sent_event_body["targetType"], "EVENT")
        self.assertEqual(client.sent_event_body["targetId"], 12)
        self.assertIn("12", response.message)

    async def test_notice_hide_confirmation_carries_action_key(self):
        context = ChatContext(
            noticeDraft=NoticeDraftContext(noticeId=7, title="운영 공지", content="본문", status="PUBLISHED"),
            noticeExecution=ExecutionContext(supported=True, executeType="SAVE_NOTICE", supportedExecuteTypes=["SAVE_NOTICE"]),
        )
        planned_action = ActionPlanner().plan(IntentAnalyzer().analyze("이 공지 숨겨줘", context), context)
        response = ExecuteActionHandler().prepare(planned_action, context)
        self.assertEqual(response.actions[0].payload["actionKey"], "notice_hide")

    async def test_event_execute_without_capability_is_unsupported_in_planner(self):
        context = ChatContext(
            notificationDraft=NotificationDraftContext(title="행사 안내", content="본문", alertMode="event"),
            notificationExecution=ExecutionContext(supported=False, supportedExecuteTypes=[]),
        )
        planned_action = ActionPlanner().plan(
            IntentAnalyzer().analyze("행사 12번 알림 보내줘", context),
            context,
        )
        self.assertEqual(planned_action.intent_type, "unsupported")
        self.assertEqual(planned_action.target, "unsupported_capability")


class SummaryActionHandlerTest(unittest.IsolatedAsyncioTestCase):
    async def test_capabilities_summary(self):
        client = FakeBackendClient()
        response = await SummaryActionHandler().handle(
            type("PlannedAction", (), {"target": "capabilities"})(),
            client,
        )
        self.assertEqual(response.actions[0].type, "SHOW_SUMMARY")
        self.assertEqual(response.actions[0].payload["summaryType"], "capabilities")


if __name__ == "__main__":
    unittest.main()
