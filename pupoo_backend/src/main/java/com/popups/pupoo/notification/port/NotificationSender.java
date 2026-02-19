// src/main/java/com/popups/pupoo/notification/port/NotificationSender.java
package com.popups.pupoo.notification.port;

import com.popups.pupoo.notification.domain.enums.NotificationChannel;
import com.popups.pupoo.notification.domain.enums.SenderType;
import lombok.Getter;

import java.util.List;

/**
 * 알림 발송 Port
 *
 * - APP/EMAIL/SMS/PUSH 등 채널별 구현체는 notification.infrastructure 하위에 둔다.
 * - 현재 MVP는 INAPP(=inbox 적재) 우선.
 */
public interface NotificationSender {

    void send(SendCommand command);

    /**
     * 이메일 발송
     *
     * - 인증/알림 메일 발송 등 "외부 채널" 전송에 사용한다.
     * - MVP에서는 실제 연동 구현체가 없을 수 있으므로, 구현체는 로그 출력 또는 NO-OP로 시작 가능하다.
     */
    default void sendEmail(List<String> targetEmails, String subject, String body) {
        // NO-OP (default)
        // - 구현체에서 실제 SMTP/SES/SendGrid 등으로 연동한다.
    }

    /**
     * SMS 발송
     *
     * - 휴대폰 인증(OTP) 및 알림 문자 발송 등 "외부 채널" 전송에 사용한다.
     * - MVP에서는 실제 연동 구현체가 없을 수 있으므로, 구현체는 로그 출력 또는 NO-OP로 시작 가능하다.
     */
    default void sendSms(List<String> targetPhones, String text) {
        // NO-OP (default)
        // - 구현체에서 NCP SENS, NHN, CoolSMS 등으로 연동한다.
    }

    @Getter
    class SendCommand {
        private final Long notificationId;
        private final Long receiverUserId;
        private final Long senderId;
        private final SenderType senderType;
        private final NotificationChannel channel;

        public SendCommand(Long notificationId,
                           Long receiverUserId,
                           Long senderId,
                           SenderType senderType,
                           NotificationChannel channel) {
            this.notificationId = notificationId;
            this.receiverUserId = receiverUserId;
            this.senderId = senderId;
            this.senderType = senderType;
            this.channel = channel;
        }
    }
}
