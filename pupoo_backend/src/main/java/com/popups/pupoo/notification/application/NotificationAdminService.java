// file: src/main/java/com/popups/pupoo/notification/application/NotificationAdminService.java
package com.popups.pupoo.notification.application;

import com.popups.pupoo.notification.dto.NotificationCreateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자/시스템에서 interest 기반 알림 발행을 위한 오케스트레이션 서비스.
 *
 * (Admin 컨트롤러에서 호출할 용도)
 */
@Service
public class NotificationAdminService {

    private final NotificationService notificationService;

    public NotificationAdminService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Transactional
    public void publishByEventInterest(NotificationCreateRequest request) {
        notificationService.publishEventInterestNotification(
                request.getEventId(),
                request.getType(),
                request.getTitle(),
                request.getContent(),
                request.getTargetType(),
                request.getTargetId()
        );
    }
}
