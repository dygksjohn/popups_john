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


    /* =========================
       생성 로직
    ========================= */

    public static ProgramApply create(Long userId, Long programId) {
        return ProgramApply.builder()
                .userId(userId)
                .programId(programId)
                .status(ApplyStatus.APPLIED)
                .createdAt(LocalDateTime.now())
                .build();
    }

    public void cancel() {
        this.status = ApplyStatus.CANCELLED;
    }

    
    public void reapply() {
        this.status = ApplyStatus.APPLIED;
    }

}
