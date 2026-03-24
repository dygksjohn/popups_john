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
from pupoo_ai.app.features.orchestrator.handlers import (  # noqa: E402
    ExecuteActionHandler,
    SummaryActionHandler,
)
from pupoo_ai.app.features.orchestrator.intent_analyzer import IntentAnalyzer  # noqa: E402


class IntentAnalyzerTest(unittest.TestCase):
    def setUp(self):
        self.analyzer = IntentAnalyzer()

    def test_notice_navigation_intent(self):
        result = self.analyzer.analyze("공지 작성 페이지로 이동")
        self.assertIsNotNone(result)
        self.assertEqual(result.intent_type, "navigation")
        self.assertEqual(result.target, "notice")

    def test_applicants_summary_intent(self):
        result = self.analyzer.analyze("신청자수 요약")
        self.assertIsNotNone(result)
        self.assertEqual(result.intent_type, "summary")
        self.assertEqual(result.target, "applicants")

    def test_schedule_notification_is_unsupported(self):
        result = self.analyzer.analyze("알림 예약 발송")
        self.assertIsNotNone(result)
        self.assertEqual(result.intent_type, "unsupported")
        self.assertEqual(result.target, "schedule_notification")


class ExecuteActionHandlerPrepareTest(unittest.TestCase):
    def test_prepare_notice_confirmation(self):
        context = ChatContext(
            noticeDraft=NoticeDraftContext(
                title="행사 공지",
                content="공지 내용",
                pinned=False,
                scope="ALL",
                status="DRAFT",
            ),
            noticeExecution=ExecutionContext(
                supported=True,
                executeType="SAVE_NOTICE",
                supportedExecuteTypes=["SAVE_NOTICE"],
            ),
        )
        planned_action = ActionPlanner().plan(
            IntentAnalyzer().analyze("공지 저장"),
            context,
        )
        response = ExecuteActionHandler().prepare(planned_action=planned_action, context=context)

        self.assertEqual(response.actions[0].type, "CONFIRM_EXECUTE")
        self.assertEqual(response.actions[0].payload["executeType"], "SAVE_NOTICE")

    def test_prepare_event_notification_confirmation(self):
        context = ChatContext(
            notificationDraft=NotificationDraftContext(
                title="행사 알림",
                content="알림 내용",
                targetType="EVENT",
                targetId=12,
                alertMode="event",
                eventId=12,
                recipientScopes=["INTEREST_SUBSCRIBERS"],
            ),
            notificationExecution=ExecutionContext(
                supported=True,
                executeType="SEND_EVENT_NOTIFICATION",
                targetType="EVENT_NOTIFICATION",
                supportedExecuteTypes=["SEND_EVENT_NOTIFICATION"],
            ),
        )
        planned_action = ActionPlanner().plan(
            IntentAnalyzer().analyze("이벤트 알림 발송"),
            context,
        )
        response = ExecuteActionHandler().prepare(planned_action=planned_action, context=context)

        self.assertEqual(response.actions[0].payload["executeType"], "SEND_EVENT_NOTIFICATION")
        self.assertEqual(response.actions[0].payload["targetType"], "EVENT_NOTIFICATION")

    def test_prepare_broadcast_notification_confirmation(self):
        context = ChatContext(
            notificationDraft=NotificationDraftContext(
                title="전체 공지 알림",
                content="알림 내용",
                alertMode="important",
            ),
            notificationExecution=ExecutionContext(
                supported=True,
                executeType="SEND_BROADCAST_NOTIFICATION",
                targetType="BROADCAST_NOTIFICATION",
                supportedExecuteTypes=["SEND_BROADCAST_NOTIFICATION"],
            ),
        )
        planned_action = ActionPlanner().plan(
            IntentAnalyzer().analyze("전체 알림 발송"),
            context,
        )
        response = ExecuteActionHandler().prepare(planned_action=planned_action, context=context)

        self.assertEqual(response.actions[0].payload["executeType"], "SEND_BROADCAST_NOTIFICATION")

    def test_prepare_unknown_execute_is_unsupported(self):
        response = ExecuteActionHandler().prepare(
            planned_action=type("PlannedAction", (), {"target": "schedule_notification", "metadata": {}})(),
            context=ChatContext(),
        )
        self.assertEqual(response.message_type, "unsupported")


class FakeBackendClient:
    def __init__(self):
        self.created_notice_body = None
        self.updated_notice_body = None
        self.sent_event_body = None
        self.sent_broadcast_body = None

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
            "notices": {
                "publishedCount": 6,
                "draftCount": 3,
                "hiddenCount": 3,
            },
            "notifications": {
                "draftCount": 5,
                "sentCount": 15,
            },
            "refunds": {
                "totalCount": 9,
                "requestedCount": 3,
                "approvedCount": 2,
                "rejectedCount": 1,
                "completedCount": 3,
            },
        }

    async def create_notice(self, body):
        self.created_notice_body = body
        return {"noticeId": 99, "status": body["status"]}

    async def update_notice(self, notice_id, body):
        self.updated_notice_body = {"noticeId": notice_id, **body}
        return {"noticeId": notice_id, "status": body["status"]}

    async def update_notification_draft(self, notification_id, body):
        return {"id": notification_id, **body}

    async def send_notification(self, notification_id):
        return {"id": notification_id, "targetCount": 15}

    async def send_event_notification(self, body):
        self.sent_event_body = body
        return {"targetCount": 12}

    async def send_broadcast_notification(self, body):
        self.sent_broadcast_body = body
        return {"targetCount": 230}


class ExecuteActionHandlerConfirmTest(unittest.IsolatedAsyncioTestCase):
    async def test_confirm_notice_hide_status(self):
        client = FakeBackendClient()
        response = await ExecuteActionHandler().confirm(
            {"executeType": "SAVE_NOTICE", "payload": {"title": "숨김 공지", "status": "HIDDEN"}},
            client,
        )

        self.assertEqual(client.created_notice_body["status"], "HIDDEN")
        self.assertIn("status=HIDDEN", response.message)
        self.assertEqual(response.actions[0].payload["formData"]["status"], "HIDDEN")

    async def test_confirm_notice_publish_status(self):
        client = FakeBackendClient()
        response = await ExecuteActionHandler().confirm(
            {
                "executeType": "SAVE_NOTICE",
                "payload": {"noticeId": 3, "title": "게시 공지", "status": "PUBLISHED"},
            },
            client,
        )

        self.assertEqual(client.updated_notice_body["status"], "PUBLISHED")
        self.assertNotIn("scope", client.updated_notice_body)
        self.assertNotIn("eventId", client.updated_notice_body)
        self.assertIn("noticeId=3", response.message)
        self.assertEqual(response.actions[0].payload["formData"]["noticeId"], 3)

    async def test_confirm_event_notification(self):
        client = FakeBackendClient()
        response = await ExecuteActionHandler().confirm(
            {
                "executeType": "SEND_EVENT_NOTIFICATION",
                "payload": {
                    "title": "행사 알림",
                    "content": "안내",
                    "targetType": "EVENT",
                    "targetId": 12,
                    "alertMode": "event",
                    "eventId": 12,
                    "recipientScopes": ["INTEREST_SUBSCRIBERS"],
                },
            },
            client,
        )

        self.assertEqual(client.sent_event_body["eventId"], 12)
        self.assertIn("12명", response.message)
        self.assertFalse(response.actions[0].payload["execution"]["supported"])

    async def test_confirm_event_notification_requires_target_fields(self):
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

        self.assertEqual(response.message_type, "validation")
        self.assertIsNone(client.sent_event_body)

    async def test_confirm_broadcast_notification(self):
        client = FakeBackendClient()
        response = await ExecuteActionHandler().confirm(
            {
                "executeType": "SEND_BROADCAST_NOTIFICATION",
                "payload": {
                    "title": "전체 알림",
                    "content": "안내",
                    "alertMode": "important",
                },
            },
            client,
        )

        self.assertEqual(client.sent_broadcast_body["type"], "NOTICE")
        self.assertIn("230명", response.message)
        self.assertEqual(response.actions[0].payload["execution"]["targetType"], "BROADCAST_NOTIFICATION")

    async def test_confirm_schedule_notification_is_unsupported(self):
        client = FakeBackendClient()
        response = await ExecuteActionHandler().confirm(
            {"executeType": "SCHEDULE_NOTIFICATION", "payload": {}},
            client,
        )
        self.assertEqual(response.message_type, "unsupported")


class SummaryActionHandlerTest(unittest.IsolatedAsyncioTestCase):
    async def test_applicants_summary_sections(self):
        client = FakeBackendClient()
        response = await SummaryActionHandler().handle(
            type("PlannedAction", (), {"target": "applicants"})(),
            client,
        )

        self.assertEqual(response.actions[0].type, "SHOW_SUMMARY")
        payload = response.actions[0].payload
        self.assertEqual(payload["summaryType"], "applicants")
        self.assertEqual(payload["title"], "신청자 수 요약")
        self.assertEqual(len(payload["sections"]), 2)


if __name__ == "__main__":
    unittest.main()
