// file: src/main/java/com/popups/pupoo/notification/application/NotificationAdminService.java
package com.popups.pupoo.notification.application;

import com.popups.pupoo.common.audit.application.AdminLogService;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.notification.domain.enums.NotificationType;
import com.popups.pupoo.notification.dto.AdminNotificationPublishResult;
import com.popups.pupoo.notification.dto.NotificationBroadcastRequest;
import com.popups.pupoo.notification.dto.NotificationCreateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자/시스템에서 알림 발행을 위한 오케스트레이션 서비스.
 */
@Service
public class NotificationAdminService {

    private final NotificationService notificationService;
    private final AdminLogService adminLogService;

    public NotificationAdminService(NotificationService notificationService,
                                    AdminLogService adminLogService) {
        this.notificationService = notificationService;
        this.adminLogService = adminLogService;
    }

    @Transactional
    public AdminNotificationPublishResult publishByEvent(NotificationCreateRequest request, Long adminUserId) {
        AdminNotificationPublishResult result = notificationService.publishAdminEventNotification(adminUserId, request);
        adminLogService.write("NOTIFICATION_PUBLISH", AdminTargetType.EVENT, request.getEventId());
        return result;
    }

    @Transactional
    public AdminNotificationPublishResult publishBroadcast(NotificationBroadcastRequest request, Long adminUserId) {
        AdminNotificationPublishResult result = notificationService.publishAdminBroadcastNotification(adminUserId, request);
        AdminTargetType targetType = request.getType() == NotificationType.SYSTEM
                ? AdminTargetType.SYSTEM
                : AdminTargetType.NOTICE;
        Long targetId = request.getTargetId() == null ? 0L : request.getTargetId();
        adminLogService.write("NOTIFICATION_PUBLISH", targetType, targetId);
        return result;
    }
}
