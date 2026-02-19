package com.popups.pupoo.event.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.event.application.EventAdminService;
import com.popups.pupoo.event.dto.AdminEventCreateRequest;
import com.popups.pupoo.event.dto.AdminEventUpdateRequest;
import com.popups.pupoo.event.dto.EventResponse;

import org.springframework.web.bind.annotation.*;

/**
 * 관리자용 행사 운영 API
 * URL 매핑:
 * - POST  /api/admin/events           행사 등록
 * - PATCH /api/admin/events/{eventId} 행사 수정
 */
@RestController
@RequestMapping("/api/admin/events")
public class AdminEventOperationController {

    private final EventAdminService eventAdminService;

    public AdminEventOperationController(EventAdminService eventAdminService) {
        this.eventAdminService = eventAdminService;
    }

    /** 행사 등록(관리자) */
    @PostMapping
    public ApiResponse<EventResponse> createEvent(@RequestBody AdminEventCreateRequest request) {
        return ApiResponse.success(eventAdminService.createEvent(request));
    }

    /** 행사 수정(관리자) */
    @PatchMapping("/{eventId}")
    public ApiResponse<EventResponse> updateEvent(
            @PathVariable("eventId") Long eventId,
            @RequestBody AdminEventUpdateRequest request
    ) {
        return ApiResponse.success(eventAdminService.updateEvent(eventId, request));
    }
}
