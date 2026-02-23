// file: src/main/java/com/popups/pupoo/notification/infrastructure/InAppNotificationSender.java
package com.popups.pupoo.notification.infrastructure;

import com.popups.pupoo.notification.port.NotificationSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * INAPP 채널 구현체.
 *
 * 현재 설계에서는 "인앱 발송" 자체가 notification_inbox 적재로 완료된다.
 * 따라서 이 구현체는 외부 연동이 필요해질 때(푸시/웹소켓 등) 확장용으로 둔다.
 */
@Component
public class InAppNotificationSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(InAppNotificationSender.class);

    @Override
    public void send(NotificationSender.SendCommand command) {
        // NO-OP (MVP)
        // - 인앱은 inbox insert로 완료
        // - 추후 WebSocket/SSE/FCM 등으로 실시간 push를 붙일 때 여기서 처리
    }

    @Override
    public void sendEmail(List<String> targetEmails, String subject, String body) {
        // MVP 기본 구현: 실제 외부 연동이 붙기 전까지는 로그만 남긴다.
        log.info("[EMAIL][NO-OP] to={}, subject={}, bodyLength={}", targetEmails, subject, body == null ? 0 : body.length());
    }

    @Override
    public void sendSms(List<String> targetPhones, String text) {
        // MVP 기본 구현: 실제 외부 연동이 붙기 전까지는 로그만 남긴다.
        log.info("[SMS][NO-OP] to={}, textLength={}", targetPhones, text == null ? 0 : text.length());
    }
}
