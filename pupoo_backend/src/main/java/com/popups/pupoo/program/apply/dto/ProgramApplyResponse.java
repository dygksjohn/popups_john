/* file: src/main/java/com/popups/pupoo/program/apply/dto/ProgramApplyResponse.java */
package com.popups.pupoo.program.apply.dto;

import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;
import com.popups.pupoo.program.apply.domain.model.ProgramApply;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ProgramApplyResponse {

    private Long programApplyId;
    private Long programId;
    private Long userId;

    /**
     * 신청에 사용된 반려동물 ID. null인 경우 사용자가 반려동물을 선택하지 않았음을 의미한다.
     */
    private Long petId;

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
                .petId(a.getPetId())
                .status(a.getStatus())
                .ticketNo(a.getTicketNo())
                .etaMin(a.getEtaMin())
                .notifiedAt(a.getNotifiedAt())
                .checkedInAt(a.getCheckedInAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}