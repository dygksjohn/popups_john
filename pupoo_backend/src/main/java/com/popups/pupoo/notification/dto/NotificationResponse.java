package com.popups.pupoo.notification.dto;

import com.popups.pupoo.notification.domain.enums.InboxTargetType;
import lombok.Getter;

@Getter
public class NotificationResponse {

    private final InboxTargetType targetType;
    private final Long targetId;

    public NotificationResponse(InboxTargetType targetType, Long targetId) {
        this.targetType = targetType;
        this.targetId = targetId;
    }
}
