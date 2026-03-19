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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 내 알림함 조회 API다.
 * 모든 엔드포인트는 인증이 필요하며, 알림 읽음 처리와 마케팅 수신 설정 변경을 `NotificationService`에 위임한다.
 */
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
     * 읽지 않은 인앱 알림 수를 조회한다.
     */
    @GetMapping("/unread-count")
    public ApiResponse<Long> unreadCount() {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(notificationService.getUnreadCount(userId));
    }

    /**
     * 현재 사용자 인앱 알림함을 페이지 단위로 조회한다.
     */
    @GetMapping
    public ApiResponse<NotificationListResponse> myInbox(@PageableDefault(size = 20) Pageable pageable) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(notificationService.getMyInbox(userId, pageable));
    }

    /**
     * 알림 클릭 시 읽음 처리한다.
     * 정책상 읽음은 `notification_inbox` 행을 즉시 삭제하는 방식이다.
     */
    @PostMapping("/{inboxId}/click")
    public ApiResponse<NotificationResponse> click(@PathVariable Long inboxId) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(notificationService.click(userId, inboxId));
    }

    /**
     * 현재 사용자의 알림 설정을 조회한다.
     */
    @GetMapping("/settings")
    public ApiResponse<NotificationSettingsResponse> getSettings() {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(notificationService.getSettings(userId));
    }

    /**
     * 현재 사용자의 마케팅 수신 동의 여부를 갱신한다.
     */
    @PutMapping("/settings")
    public ApiResponse<NotificationSettingsResponse> updateSettings(@RequestParam boolean allowMarketing) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(notificationService.updateAllowMarketing(userId, allowMarketing));
    }
}
