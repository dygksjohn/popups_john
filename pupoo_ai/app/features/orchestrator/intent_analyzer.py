from dataclasses import dataclass


@dataclass(slots=True)
class IntentResult:
    intent_type: str
    target: str
    requires_confirmation: bool = False


class IntentAnalyzer:
    def analyze(self, message: str) -> IntentResult | None:
        normalized = self._normalize(message)

        if any(keyword in normalized for keyword in ("공지 작성 페이지", "공지 페이지")):
            return IntentResult(intent_type="navigation", target="notice")
        if any(keyword in normalized for keyword in ("행사 등록 페이지", "행사 등록", "행사 관리 페이지")):
            return IntentResult(intent_type="navigation", target="event")

        if "혼잡도" in normalized and "요약" in normalized:
            return IntentResult(intent_type="summary", target="congestion")
        if any(keyword in normalized for keyword in ("신청자 수 요약", "신청자수 요약", "신청자 요약")):
            return IntentResult(intent_type="summary", target="applicants")
        if "환불" in normalized and "요약" in normalized:
            return IntentResult(intent_type="summary", target="refund")

        if any(keyword in normalized for keyword in ("공지 초안", "공지문", "공지 초안 생성")):
            return IntentResult(intent_type="draft", target="notice")
        if any(keyword in normalized for keyword in ("알림 문구", "알림 초안", "알림 문구 생성")):
            return IntentResult(intent_type="draft", target="notification")

        if any(keyword in normalized for keyword in ("알림 예약 발송", "알림 발송 예약", "예약 발송")):
            return IntentResult(intent_type="unsupported", target="schedule_notification")

        if any(keyword in normalized for keyword in ("공지 저장", "공지 등록")):
            return IntentResult(intent_type="execute", target="save_notice", requires_confirmation=True)
        if any(keyword in normalized for keyword in ("저장된 초안 발송", "초안 발송", "임시 저장 알림 발송")):
            return IntentResult(intent_type="execute", target="send_notification_draft", requires_confirmation=True)
        if any(keyword in normalized for keyword in ("이벤트 알림 발송", "행사 알림 발송")):
            return IntentResult(intent_type="execute", target="send_event_notification", requires_confirmation=True)
        if any(keyword in normalized for keyword in ("전체 알림 발송", "브로드캐스트 알림 발송", "전체 공지 알림 발송")):
            return IntentResult(intent_type="execute", target="send_broadcast_notification", requires_confirmation=True)
        if any(keyword in normalized for keyword in ("알림 발송", "알림 보내기")):
            return IntentResult(intent_type="execute", target="send_notification", requires_confirmation=True)

        return None

    def _normalize(self, message: str) -> str:
        return " ".join(str(message or "").lower().split())
