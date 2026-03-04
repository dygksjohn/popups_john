// file: src/main/java/com/popups/pupoo/event/dto/EventResponse.java
package com.popups.pupoo.event.dto;

import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.model.Event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ?ъ슜?먯슜 ?됱궗 ?묐떟 DTO (v2.5 湲곗?)
 */
public class EventResponse {

    private Long eventId;
    private String eventName;
    private String description;
    private String imageUrl;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String location;
    private String organizer;
    private String organizerPhone;
    private String organizerEmail;
    private EventStatus status;
    private Integer roundNo;
    private BigDecimal baseFee;

    public static EventResponse from(Event e) {
        EventResponse r = new EventResponse();
        r.eventId = e.getEventId();
        r.eventName = e.getEventName();
        r.description = e.getDescription();
        r.startAt = e.getStartAt();
        r.endAt = e.getEndAt();
        r.location = e.getLocation();
        r.organizer = e.getOrganizer();
        r.organizerPhone = e.getOrganizerPhone();
        r.organizerEmail = e.getOrganizerEmail();
        r.status = e.getStatus();
        r.roundNo = e.getRoundNo();
        r.baseFee = e.getBaseFee();
        return r;
    }

    // getter
    public Long getEventId() { return eventId; }
    public String getEventName() { return eventName; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public LocalDateTime getStartAt() { return startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public String getLocation() { return location; }
    public String getOrganizer() { return organizer; }
    public String getOrganizerPhone() { return organizerPhone; }
    public String getOrganizerEmail() { return organizerEmail; }
    public EventStatus getStatus() { return status; }
    public Integer getRoundNo() { return roundNo; }
    public BigDecimal getBaseFee() { return baseFee; }

    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
