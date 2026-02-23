// file: src/main/java/com/popups/pupoo/notification/dto/NotificationCreateRequest.java
package com.popups.pupoo.notification.dto;

import com.popups.pupoo.notification.domain.enums.InboxTargetType;
import com.popups.pupoo.notification.domain.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

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
     * interest 기반 fan-out을 위한 이벤트 ID
     */
    @NotNull
    private Long eventId;
}
