// file: src/main/java/com/popups/pupoo/notification/dto/NotificationCreateRequest.java
package com.popups.pupoo.notification.dto;

import com.popups.pupoo.notification.domain.enums.InboxTargetType;
import com.popups.pupoo.notification.domain.enums.NotificationChannel;
import com.popups.pupoo.notification.domain.enums.NotificationType;
import com.popups.pupoo.notification.domain.enums.RecipientScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.List;

@Getter
public class NotificationCreateRequest {

    @NotNull
    private NotificationType type;

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    /**
     * 클릭 시 이동 정보
     */
    @NotNull
    private InboxTargetType targetType;

    @NotNull
    private Long targetId;

    /**
     * interest/참가자/예매자 기반 fan-out을 위한 이벤트 ID
     */
    @NotNull
    private Long eventId;

    /**
     * 발송 채널(미지정 시 APP)
     */
    private List<NotificationChannel> channels;

    /**
     * 발송 대상 범위(미지정 시 INTEREST_SUBSCRIBERS)
     */
    private RecipientScope recipientScope;
}
