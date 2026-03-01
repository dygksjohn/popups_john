package com.popups.pupoo.common.dashboard.dto;

import com.popups.pupoo.program.domain.enums.ProgramCategory;
import com.popups.pupoo.program.domain.model.Program;
import lombok.Builder;
import lombok.Getter;

/**
 * 관리자 대시보드 - 프로그램 관리 전용 응답 DTO
 *
 * 프론트(data.js) programs 배열 형식과 1:1 매칭:
 *   { id, name, category, sessions, status, enrolled, description, imageUrl }
 */
@Getter
@Builder
public class DashboardProgramResponse {

    private Long   programId;
    private Long   eventId;
    private String id;           // "PG-001"
    private String name;
    private String category;     // "교육" | "체험" | "대회"
    private int    sessions;     // DB에 없음 → 기본 1
    private String status;       // "active" | "pending" | "ended"
    private long   enrolled;
    private String description;
    private String imageUrl;

    public static DashboardProgramResponse from(Program p, long enrolledCount) {
        String frontId     = "PG-" + String.format("%03d", p.getProgramId());
        String frontCat    = mapCategory(p.getCategory());
        String frontStatus = mapStatus(p);

        return DashboardProgramResponse.builder()
                .programId(p.getProgramId())
                .eventId(p.getEventId())
                .id(frontId)
                .name(p.getProgramTitle())
                .category(frontCat)
                .sessions(1)  // event_program에 sessions 컬럼 없음 → 기본 1
                .status(frontStatus)
                .enrolled(enrolledCount)
                .description(p.getDescription() != null ? p.getDescription() : "")
                .imageUrl(p.getImageUrl())
                .build();
    }

    private static String mapCategory(ProgramCategory c) {
        if (c == null) return "교육";
        return switch (c) {
            case CONTEST    -> "대회";
            case SESSION    -> "교육";
            case EXPERIENCE -> "체험";
        };
    }

    private static String mapStatus(Program p) {
        if (p.isOngoing())  return "active";
        if (p.isEnded())    return "ended";
        return "pending"; // upcoming
    }
}
