// file: src/main/java/com/popups/pupoo/notification/api/AdminNotificationController.java
package com.popups.pupoo.notification.api;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.MessageResponse;
import com.popups.pupoo.notification.application.AdminNotificationManageService;
import com.popups.pupoo.notification.application.NotificationAdminService;
import com.popups.pupoo.notification.dto.AdminNotificationDraftRequest;
import com.popups.pupoo.notification.dto.AdminNotificationItemResponse;
import com.popups.pupoo.notification.dto.NotificationBroadcastRequest;
import com.popups.pupoo.notification.dto.NotificationCreateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 알림(관리자) API
 * - POST /api/admin/notifications/event
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/notifications")
public class AdminNotificationController {

    private final NotificationAdminService notificationAdminService;
    private final AdminNotificationManageService adminNotificationManageService;
    private final SecurityUtil securityUtil;

    @GetMapping
    public ApiResponse<List<AdminNotificationItemResponse>> list() {
        return ApiResponse.success(adminNotificationManageService.list());
    }

    @PostMapping
    public ApiResponse<AdminNotificationItemResponse> createDraft(@Valid @RequestBody AdminNotificationDraftRequest request) {
        Long adminUserId = securityUtil.currentUserId();
        return ApiResponse.success(adminNotificationManageService.createDraft(request, adminUserId));
    }

    @PutMapping("/{adminNotificationId}")
    public ApiResponse<AdminNotificationItemResponse> updateDraft(@PathVariable Long adminNotificationId,
                                                                  @Valid @RequestBody AdminNotificationDraftRequest request) {
        Long adminUserId = securityUtil.currentUserId();
        return ApiResponse.success(adminNotificationManageService.updateDraft(adminNotificationId, request, adminUserId));
    }

    @DeleteMapping("/{adminNotificationId}")
    public ApiResponse<MessageResponse> delete(@PathVariable Long adminNotificationId) {
        adminNotificationManageService.delete(adminNotificationId);
        return ApiResponse.success(new MessageResponse("ADMIN_NOTIFICATION_DELETED"));
    }

    @PostMapping("/{adminNotificationId}/send")
    public ApiResponse<AdminNotificationItemResponse> send(@PathVariable Long adminNotificationId) {
        Long adminUserId = securityUtil.currentUserId();
        return ApiResponse.success(adminNotificationManageService.send(adminNotificationId, adminUserId));
    }

    /**
     * 이벤트 기반 알림 발행
     * - channels: APP/EMAIL/SMS/PUSH (미지정 시 APP)
     * - recipientScope: INTEREST_SUBSCRIBERS/EVENT_REGISTRANTS/EVENT_PAYERS (미지정 시 INTEREST_SUBSCRIBERS)
     */
    @PostMapping("/event")
    public ApiResponse<MessageResponse> publishEvent(@Valid @RequestBody NotificationCreateRequest request) {
        // Keep a non-null payload per SSOT response policy.
        Long adminUserId = securityUtil.currentUserId();
        notificationAdminService.publishByEvent(request, adminUserId);
        return ApiResponse.success(new MessageResponse("NOTIFICATION_PUBLISHED"));
    }

    @PostMapping("/broadcast")
    public ApiResponse<MessageResponse> publishBroadcast(@Valid @RequestBody NotificationBroadcastRequest request) {
        Long adminUserId = securityUtil.currentUserId();
        notificationAdminService.publishBroadcast(request, adminUserId);
        return ApiResponse.success(new MessageResponse("NOTIFICATION_PUBLISHED"));
    }
}
