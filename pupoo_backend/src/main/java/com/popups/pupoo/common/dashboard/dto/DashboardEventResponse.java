package com.popups.pupoo.common.dashboard.dto;

import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.model.Event;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

/**
 * 관리자 대시보드 - 행사 관리 전용 응답 DTO
 *
 * 프론트(data.js) events 배열 형식과 1:1 매칭:
 *   { id, name, date, location, status, participants, capacity, description }
 */
@Getter
@Builder
public class DashboardEventResponse {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private Long   eventId;
    private String id;           // "EV-001"
    private String name;
    private String date;         // "2026.01.10 ~ 2026.01.12"
    private String location;
    private String status;       // "active" | "pending" | "ended"
    private long   participants;
    private int    capacity;
    private String description;

    public static DashboardEventResponse from(Event e, long participantCount) {
        String dateStr = e.getStartAt().format(FMT) + " ~ " + e.getEndAt().format(FMT);
        String frontStatus = mapStatus(e.getStatus());
        String frontId = "EV-" + String.format("%03d", e.getEventId());

        return DashboardEventResponse.builder()
                .eventId(e.getEventId())
                .id(frontId)
                .name(e.getEventName())
                .date(dateStr)
                .location(e.getLocation() != null ? e.getLocation() : "")
                .status(frontStatus)
                .participants(participantCount)
                .capacity(500)  // event 테이블에 capacity 컬럼 없음 → 기본값
                .description(e.getDescription() != null ? e.getDescription() : "")
                .build();
    }

    private static String mapStatus(EventStatus s) {
        if (s == null) return "pending";
        return switch (s) {
            case ONGOING   -> "active";
            case ENDED     -> "ended";
            case CANCELLED -> "ended";
            default        -> "pending";   // PLANNED
        };
    }
}
