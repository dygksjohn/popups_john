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
    private Long petId;
    private String petName;
    private String ownerNickname;
    private String imageUrl;

    private ApplyStatus status;

    private String ticketNo;
    private Integer etaMin;
    private LocalDateTime notifiedAt;
    private LocalDateTime checkedInAt;
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
                .petName(null)
                .ownerNickname(null)
                .imageUrl(null)
                .status(a.getStatus())
                .ticketNo(a.getTicketNo())
                .etaMin(a.getEtaMin())
                .notifiedAt(a.getNotifiedAt())
                .checkedInAt(a.getCheckedInAt())
                .createdAt(a.getCreatedAt())
                .build();
    }

    public static ProgramApplyResponse from(ProgramApply a, String petName) {
        if (a == null) {
            throw new IllegalArgumentException("ProgramApply is null");
        }

        return ProgramApplyResponse.builder()
                .programApplyId(a.getProgramApplyId())
                .programId(a.getProgramId())
                .userId(a.getUserId())
                .petId(a.getPetId())
                .petName(petName)
                .ownerNickname(null)
                .imageUrl(null)
                .status(a.getStatus())
                .ticketNo(a.getTicketNo())
                .etaMin(a.getEtaMin())
                .notifiedAt(a.getNotifiedAt())
                .checkedInAt(a.getCheckedInAt())
                .createdAt(a.getCreatedAt())
                .build();
    }

    public static ProgramApplyResponse from(ProgramApply a, String petName, String ownerNickname) {
        if (a == null) {
            throw new IllegalArgumentException("ProgramApply is null");
        }

        return ProgramApplyResponse.builder()
                .programApplyId(a.getProgramApplyId())
                .programId(a.getProgramId())
                .userId(a.getUserId())
                .petId(a.getPetId())
                .petName(petName)
                .ownerNickname(ownerNickname)
                .imageUrl(null)
                .status(a.getStatus())
                .ticketNo(a.getTicketNo())
                .etaMin(a.getEtaMin())
                .notifiedAt(a.getNotifiedAt())
                .checkedInAt(a.getCheckedInAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
