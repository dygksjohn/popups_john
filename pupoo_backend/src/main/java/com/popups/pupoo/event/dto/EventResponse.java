// file: src/main/java/com/popups/pupoo/event/dto/EventResponse.java
package com.popups.pupoo.event.dto;

import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.model.Event;

import java.time.LocalDateTime;

/**
 * 사용자용 행사 응답 DTO (v2.5 기준)
 */
public class EventResponse {

    private Long eventId;
    private String eventName;
    private String description;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String location;
    private EventStatus status;
    private Integer roundNo;

    public static EventResponse from(Event e) {
        EventResponse r = new EventResponse();
        r.eventId = e.getEventId();
        r.eventName = e.getEventName();
        r.description = e.getDescription();
        r.startAt = e.getStartAt();
        r.endAt = e.getEndAt();
        r.location = e.getLocation();
        r.status = e.getStatus();
        r.roundNo = e.getRoundNo();
        return r;
    }

    // getter
    public Long getEventId() { return eventId; }
    public String getEventName() { return eventName; }
    public String getDescription() { return description; }
    public LocalDateTime getStartAt() { return startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public String getLocation() { return location; }
    public EventStatus getStatus() { return status; }
    public Integer getRoundNo() { return roundNo; }
}
