package com.popups.pupoo.event.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.PageResponse;
import com.popups.pupoo.event.application.EventRegistrationService;
import com.popups.pupoo.event.dto.EventApplyRequest;
import com.popups.pupoo.event.dto.EventRegistrationResponse;

import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자용 참가 신청 API
 * - POST   /api/event-registrations
 * - DELETE /api/event-registrations/{applyId}
 * - GET    /api/users/me/event-registrations
 */
@RestController
public class EventRegistrationController {

    private final EventRegistrationService registrationService;

    public EventRegistrationController(EventRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/api/event-registrations")
    public ApiResponse<EventRegistrationResponse> apply(@RequestBody EventApplyRequest request) {
        Long userId = extractCurrentUserId();
        return ApiResponse.success(registrationService.apply(request.getEventId(), userId));
    }

    @DeleteMapping("/api/event-registrations/{applyId}")
    public ApiResponse<Void> cancel(@PathVariable("applyId") Long applyId){
        Long userId = extractCurrentUserId();
        registrationService.cancel(applyId, userId);
        return ApiResponse.success(null);
    }

    @GetMapping("/api/users/me/event-registrations")
    public ApiResponse<PageResponse<EventRegistrationResponse>> myRegistrations(Pageable pageable) {
        Long userId = extractCurrentUserId();
        return ApiResponse.success(PageResponse.from(registrationService.getMyRegistrations(userId, pageable)));
    }

    /**
     * TODO: 프로젝트 Auth 확정 후 principal 타입에 맞춰 교체
     * - 현재는 Long/String만 처리
     */
    private Long extractCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Unauthenticated request.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Long) return (Long) principal;

        if (principal instanceof String s) {
            if ("anonymousUser".equalsIgnoreCase(s)) throw new IllegalStateException("Anonymous user.");
            return Long.parseLong(s);
        }

        throw new IllegalStateException("Unsupported principal type: " + principal.getClass().getName());
    }
}
