// file: src/main/java/com/popups/pupoo/event/api/EventController.java
package com.popups.pupoo.event.api;

import java.time.LocalDateTime;

import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.PageResponse;
import com.popups.pupoo.event.application.EventService;
import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.dto.EventResponse;

/**
 * 사용자용 행사 조회 API
 * - GET /api/events
 * - GET /api/events/{eventId}
 */
@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    /**
     * 행사 목록 조회(키워드/상태/기간 + 페이징)
     *
     * 예)
     * /api/events?keyword=펫페어&status=PLANNED&fromAt=2026-02-01T00:00:00&toAt=2026-03-01T00:00:00&page=0&size=10
     */
    @GetMapping
    public ApiResponse<PageResponse<EventResponse>> getEvents(
            Pageable pageable,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "status", required = false) EventStatus status,
            @RequestParam(name = "fromAt", required = false) LocalDateTime fromAt,
            @RequestParam(name = "toAt", required = false) LocalDateTime toAt
    ) {
        return ApiResponse.success(
                PageResponse.from(eventService.getEvents(pageable, keyword, status, fromAt, toAt))
        );
    }

    /** 행사 상세 */
    @GetMapping("/{eventId}")
    public ApiResponse<EventResponse> getEvent(@PathVariable("eventId") Long eventId) {
        return ApiResponse.success(eventService.getEvent(eventId));
    }

}
