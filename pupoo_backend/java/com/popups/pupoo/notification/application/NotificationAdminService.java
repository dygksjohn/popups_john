// file: src/main/java/com/popups/pupoo/notification/application/NotificationAdminService.java
package com.popups.pupoo.notification.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.popups.pupoo.notification.dto.NotificationCreateRequest;

/**
 * 관리자/시스템에서 알림 발행을 위한 오케스트레이션 서비스.
 */
@Service
public class NotificationAdminService {

    private final NotificationService notificationService;

    public NotificationAdminService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Transactional
    public void publishByEvent(NotificationCreateRequest request, Long adminUserId) {
        notificationService.publishAdminEventNotification(adminUserId, request);
    }
}
