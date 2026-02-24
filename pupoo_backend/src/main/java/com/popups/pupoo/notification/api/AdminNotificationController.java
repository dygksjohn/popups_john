// file: src/main/java/com/popups/pupoo/notification/api/AdminNotificationController.java
package com.popups.pupoo.notification.api;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.notification.application.NotificationAdminService;
import com.popups.pupoo.notification.dto.NotificationCreateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 알림(관리자) API
 * - POST /api/admin/notifications/event
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/notifications")
public class AdminNotificationController {

    private final NotificationAdminService notificationAdminService;
    private final SecurityUtil securityUtil;

    /**
     * 이벤트 기반 알림 발행
     * - channels: APP/EMAIL/SMS/PUSH (미지정 시 APP)
     * - recipientScope: INTEREST_SUBSCRIBERS/EVENT_REGISTRANTS/EVENT_PAYERS (미지정 시 INTEREST_SUBSCRIBERS)
     */
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PostMapping("/event")
    public ApiResponse<Void> publishEvent(@Valid @RequestBody NotificationCreateRequest request) {
        Long adminUserId = securityUtil.currentUserId();
        notificationAdminService.publishByEvent(request, adminUserId);
        return ApiResponse.success(null);
    }
}
