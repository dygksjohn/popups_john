package com.popups.pupoo.notification.dto;

import com.popups.pupoo.notification.domain.enums.InboxTargetType;
import com.popups.pupoo.notification.domain.enums.NotificationChannel;
import com.popups.pupoo.notification.domain.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.List;

@Getter
public class NotificationBroadcastRequest {

    @NotNull
    private NotificationType type;

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    private InboxTargetType targetType;

    private Long targetId;

    private List<NotificationChannel> channels;
}
