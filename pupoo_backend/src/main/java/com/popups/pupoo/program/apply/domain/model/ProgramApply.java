/* file: src/main/java/com/popups/pupoo/program/apply/domain/model/ProgramApply.java */
package com.popups.pupoo.program.apply.domain.model;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
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

    /**
     * DB: ticket_no (VARCHAR(30))
     * 목적: 현장 티켓번호(표시용) - 대기/티켓 재활용 흐름에서 사용
     */
    @Column(name = "ticket_no", length = 30)
    private String ticketNo;

    /**
     * DB: eta_min (INT)
     * 목적: 예상 대기시간(분) - 운영/현장 안내용
     */
    @Column(name = "eta_min")
    private Integer etaMin;

    /**
     * DB: notified_at (DATETIME)
     * 목적: 참여 확정(체크인) 10분 전 알림 발송 시점(추후 SMS/PUSH 연동)
     */
    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;

    /**
     * DB: checked_in_at (DATETIME)
     * 목적: 참여 확정(체크인) 시점
     */
    @Column(name = "checked_in_at")
    private LocalDateTime checkedInAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    /**
     * DB generated 컬럼(active_flag): 부분 UNIQUE(program_id, user_id, active_flag) 용
     * - JPA는 계산하지 않고 읽기 전용으로만 둔다.
     */
    @Column(name = "active_flag", insertable = false, updatable = false)
    private Byte activeFlag;

    public static ProgramApply create(Long userId, Long programId) {
        return ProgramApply.builder()
                .userId(userId)
                .programId(programId)
                .status(ApplyStatus.APPLIED)
                .ticketNo(null)
                .etaMin(null)
                .notifiedAt(null)
                .checkedInAt(null)
                .createdAt(LocalDateTime.now())
                .cancelledAt(null)
                .build();
    }

    public void cancel() {
        if (this.status == ApplyStatus.CANCELLED) return;
        this.status = ApplyStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();

        // 취소 시점에 운영 정보는 남겨도 되고 지워도 되지만,
        // DB 정합성 관점에서는 nullable이므로 강제 처리는 하지 않는다.
    }

    /**
     * 활성 기준:
     * APPLIED / WAITING / APPROVED 만 활성 (DB active_flag 정의와 동일)
     */
    public boolean isActive() {
        return this.status == ApplyStatus.APPLIED
                || this.status == ApplyStatus.WAITING
                || this.status == ApplyStatus.APPROVED;
    }

    /**
     * (선택) 운영 측에서 티켓(대기) 정보 갱신이 필요할 때 사용
     */
    public void updateTicketInfo(String ticketNo, Integer etaMin, LocalDateTime notifiedAt) {
        this.ticketNo = ticketNo;
        this.etaMin = etaMin;
        this.notifiedAt = notifiedAt;
    }

    /**
     * 참여 확정 처리(운영 QR 스캔 확정용)
     * - QrAdminService에서 내려준 now를 그대로 기록하여 시간 정합성을 유지한다.
     * - CHECKED_IN은 비활성 취급(재신청 허용) 정책을 따른다.
     */
    public void markCheckedIn(LocalDateTime now) {
        // 정책: 참여 확정(체크인)은 APPROVED 상태에서만 가능하다.
        if (this.status == ApplyStatus.CHECKED_IN) {
            return;
        }
        if (this.status != ApplyStatus.APPROVED) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_INVALID_STATUS);
        }

        this.status = ApplyStatus.CHECKED_IN;
        this.checkedInAt = (now == null) ? LocalDateTime.now() : now;
    }

    /**
     * (기존) 체크인 확정 처리
     * - 내부 now로 처리하되, markCheckedIn으로 위임하여 로직을 단일화한다.
     */
    public void checkIn() {
        markCheckedIn(LocalDateTime.now());
    }
}