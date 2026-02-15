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

    private ApplyStatus status;

    /**
     * DB 컬럼 created_at 기준: "최초 신청 레코드 생성 시각"
     * (방법 B: REJECTED row 재활용 시에도 createdAt은 변하지 않음)
     */
    private LocalDateTime createdAt;

    public static ProgramApplyResponse from(ProgramApply a) {
        if (a == null) return null;

        return ProgramApplyResponse.builder()
                .programApplyId(a.getProgramApplyId())
                .programId(a.getProgramId())
                .userId(a.getUserId())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
