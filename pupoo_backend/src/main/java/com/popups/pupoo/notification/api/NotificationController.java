// file: src/main/java/com/popups/pupoo/notification/api/NotificationController.java
package com.popups.pupoo.notification.api;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.notification.application.NotificationService;
import com.popups.pupoo.notification.dto.NotificationListResponse;
import com.popups.pupoo.notification.dto.NotificationResponse;
import com.popups.pupoo.notification.dto.NotificationSettingsResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final SecurityUtil securityUtil;

    public NotificationController(NotificationService notificationService, SecurityUtil securityUtil) {
        this.notificationService = notificationService;
        this.securityUtil = securityUtil;
    }

    /**
     * 내 미열람(=인박스) 알림 목록
     */
    @GetMapping
    public ApiResponse<NotificationListResponse> myInbox(@PageableDefault(size = 20) Pageable pageable) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(notificationService.getMyInbox(userId, pageable));
    }

    /**
     * 클릭(읽음) 처리: target 정보 반환 + 인박스에서 즉시 삭제
     */
    @PostMapping("/{inboxId}/click")
    public ApiResponse<NotificationResponse> click(@PathVariable Long inboxId) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(notificationService.click(userId, inboxId));
    }

    /**
     * (전역) 알림 설정 조회
     */
    @GetMapping("/settings")
    public ApiResponse<NotificationSettingsResponse> getSettings() {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(notificationService.getSettings(userId));
    }

    /**
     * (전역) 마케팅 수신 동의 업데이트
     */
    @PutMapping("/settings")
    public ApiResponse<NotificationSettingsResponse> updateSettings(@RequestParam boolean allowMarketing) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(notificationService.updateAllowMarketing(userId, allowMarketing));
    }
}
