package com.popups.pupoo.event.domain.model;

import com.popups.pupoo.event.domain.enums.EventStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Event 엔티티 (pupoo_v2.5 기준)
 *
 * 테이블: event
 * 컬럼:
 * - event_id (PK)
 * - event_name
 * - description
 * - start_at
 * - end_at
 * - location
 * - status (PLANNED/ONGOING/ENDED/CANCELLED)
 * - round_no
 *
 * ⚠️ created_at/updated_at 없음 (사용자 확인 반영)
 */
@Entity
@Table(name = "event")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "event_name", nullable = false, length = 255)
    private String eventName;

    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    @Column(name = "location", length = 255)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private EventStatus status;

    @Column(name = "round_no")
    private Integer roundNo;

    protected Event() {
        // JPA 기본 생성자
    }

    // ===== Getter =====
    public Long getEventId() { return eventId; }
    public String getEventName() { return eventName; }
    public String getDescription() { return description; }
    public LocalDateTime getStartAt() { return startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public String getLocation() { return location; }
    public EventStatus getStatus() { return status; }
    public Integer getRoundNo() { return roundNo; }

    	
    public boolean isClosed() {
        return this.status == EventStatus.ENDED
            || this.status == EventStatus.CANCELLED;
    }

}
