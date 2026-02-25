/* file: src/main/java/com/popups/pupoo/program/apply/dto/ProgramApplyResponse.java */
package com.popups.pupoo.program.apply.dto;

import java.time.LocalDateTime;

import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;
import com.popups.pupoo.program.apply.domain.model.ProgramApply;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProgramApplyResponse {

    private Long programApplyId;
    private Long programId;
    private Long userId;

    private ApplyStatus status;

    private String ticketNo;
    private Integer etaMin;
    private LocalDateTime notifiedAt;
    private LocalDateTime checkedInAt;

    /**
     * DB 컬럼 created_at 기준: "최초 신청 레코드 생성 시각"
     */
    private LocalDateTime createdAt;

    public static ProgramApplyResponse from(ProgramApply a) {
        if (a == null) {
            throw new IllegalArgumentException("ProgramApply is null");
        }

        return ProgramApplyResponse.builder()
                .programApplyId(a.getProgramApplyId())
                .programId(a.getProgramId())
                .userId(a.getUserId())
                .status(a.getStatus())
                .ticketNo(a.getTicketNo())
                .etaMin(a.getEtaMin())
                .notifiedAt(a.getNotifiedAt())
                .checkedInAt(a.getCheckedInAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}