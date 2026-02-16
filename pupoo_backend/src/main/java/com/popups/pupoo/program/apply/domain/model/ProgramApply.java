package com.popups.pupoo.program.apply.domain.model;

import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_program_apply")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ProgramApply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "program_apply_id")
    private Long programApplyId;

    @Column(name = "program_id", nullable = false)
    private Long programId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ApplyStatus status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "active_flag", insertable = false, updatable = false)
    private Byte activeFlag;

    public static ProgramApply create(Long userId, Long programId) {
        return ProgramApply.builder()
                .userId(userId)
                .programId(programId)
                .status(ApplyStatus.APPLIED)
                .createdAt(LocalDateTime.now())
                .cancelledAt(null)
                .build();
    }

    public void cancel() {
        if (this.status == ApplyStatus.CANCELLED) return;
        this.status = ApplyStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
    }

    /**
     * 활성 기준:
     * APPLIED / WAITING / APPROVED 만 활성
     */
    public boolean isActive() {
        return this.status == ApplyStatus.APPLIED
                || this.status == ApplyStatus.WAITING
                || this.status == ApplyStatus.APPROVED;
    }
}

