package com.popups.pupoo.event.domain.model;

import com.popups.pupoo.event.domain.enums.RegistrationStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * EventRegistration 엔티티 (pupoo_v2.5 기준)
 *
 * 테이블: event_apply
 * 컬럼:
 * - apply_id (PK)
 * - user_id
 * - event_id
 * - applied_at
 * - status (APPLIED/CANCELLED/APPROVED/REJECTED)
 *
 * 정책:
 * - (event_id, user_id) UNIQUE 로 중복 신청 방지(DDL에 존재)
 */
@Entity
@Table(
        name = "event_apply",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_event_apply_event_user", columnNames = {"event_id", "user_id"})
        },
        indexes = {
                @Index(name = "ix_event_apply_user_id", columnList = "user_id"),
                @Index(name = "ix_event_apply_event_id", columnList = "event_id")
        }
)
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "apply_id")
    private Long applyId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "applied_at", nullable = false)
    private LocalDateTime appliedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RegistrationStatus status;

    protected EventRegistration() {
        // JPA 기본 생성자
    }

    private EventRegistration(Long eventId, Long userId) {
        this.eventId = eventId;
        this.userId = userId;
        this.appliedAt = LocalDateTime.now();
        this.status = RegistrationStatus.APPLIED;
    }

    /** 신청 생성 팩토리 */
    public static EventRegistration create(Long eventId, Long userId) {
        return new EventRegistration(eventId, userId);
    }

    /** 신청 취소 */
    public void cancel() {
        this.status = RegistrationStatus.CANCELLED;
    }

    // ===== Getter =====
    public Long getApplyId() { return applyId; }
    public Long getUserId() { return userId; }
    public Long getEventId() { return eventId; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
    public RegistrationStatus getStatus() { return status; }
}
