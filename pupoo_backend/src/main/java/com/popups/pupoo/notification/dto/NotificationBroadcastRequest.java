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

    public static NotificationBroadcastRequest of(NotificationType type,
                                                  String title,
                                                  String content,
                                                  InboxTargetType targetType,
                                                  Long targetId,
                                                  List<NotificationChannel> channels) {
        NotificationBroadcastRequest request = new NotificationBroadcastRequest();
        request.type = type;
        request.title = title;
        request.content = content;
        request.targetType = targetType;
        request.targetId = targetId;
        request.channels = channels;
        return request;
    }
}
