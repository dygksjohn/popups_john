// file: src/main/java/com/popups/pupoo/program/dto/ProgramResponse.java
package com.popups.pupoo.program.dto;

import com.popups.pupoo.program.domain.enums.ProgramCategory;
import com.popups.pupoo.program.domain.model.Program;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ProgramResponse {

    private Long programId;
    private Long eventId;
    private ProgramCategory category;
    private String programTitle;
    private String description;

    //  placeName 제거
    private Long boothId;

    private LocalDateTime startAt;
    private LocalDateTime endAt;

    private boolean ongoing;
    private boolean upcoming;
    private boolean ended;

    public static ProgramResponse from(Program p) {
        if (p == null) {
            throw new IllegalArgumentException("Program is null");
        }

        return ProgramResponse.builder()
                .programId(p.getProgramId())
                .eventId(p.getEventId())
                .category(p.getCategory())
                .programTitle(p.getProgramTitle())
                .description(p.getDescription())
                .boothId(p.getBoothId())  //  변경
                .startAt(p.getStartAt())
                .endAt(p.getEndAt())
                .ongoing(p.isOngoing())
                .upcoming(p.isUpcoming())
                .ended(p.isEnded())
                .build();
    }
}
