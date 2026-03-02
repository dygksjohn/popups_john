package com.popups.pupoo.common.dashboard.dto;

import com.popups.pupoo.event.domain.model.Event;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

/**
 * 관리자 대시보드 - 지난 행사 전용 응답 DTO
 *
 * 프론트(data.js) pastEvents 배열 형식과 1:1 매칭:
 *   { id, name, date, location, participants, capacity, zoneUsage, eventRate, avgCongestion }
 */
@Getter
@Builder
public class DashboardPastEventResponse {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private Long   eventId;
    private String id;              // "PE-001"
    private String name;
    private String date;
    private String location;
    private long   participants;
    private int    capacity;
    private int    zoneUsage;       // % (event_history 기반 집계 or 기본값)
    private int    eventRate;       // %
    private int    avgCongestion;   // %

    public static DashboardPastEventResponse from(
            Event e,
            long participantCount,
            int capacity,
            int zoneUsage,
            int eventRate,
            int avgCongestion
    ) {
        return DashboardPastEventResponse.builder()
                .eventId(e.getEventId())
                .id("PE-" + String.format("%03d", e.getEventId()))
                .name(e.getEventName())
                .date(e.getStartAt().format(FMT))
                .location(e.getLocation() != null ? e.getLocation() : "")
                .participants(participantCount)
                .capacity(capacity)
                .zoneUsage(zoneUsage)
                .eventRate(eventRate)
                .avgCongestion(avgCongestion)
                .build();
    }
}
