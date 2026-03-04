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
    private String imageUrl;

    // v2.7: place_name removed, booth_id used.
    private Long boothId;

    private LocalDateTime startAt;
    private LocalDateTime endAt;

    private boolean ongoing;
    private boolean upcoming;
    private boolean ended;

    /**
     * Optional wait stats (experience_waits).
     */
    private ExperienceWaitResponse experienceWait;

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
                .imageUrl(normalizeImagePath(p.getImageUrl()))
                .boothId(p.getBoothId())
                .startAt(p.getStartAt())
                .endAt(p.getEndAt())
                .ongoing(p.isOngoing())
                .upcoming(p.isUpcoming())
                .ended(p.isEnded())
                .experienceWait(null)
                .build();
    }

    private static String normalizeImagePath(String rawPath) {
        if (rawPath == null || rawPath.isBlank()) return null;

        String normalized = rawPath.replace('\\', '/');
        String lower = normalized.toLowerCase();

        int idx = lower.indexOf("/uploads/");
        if (idx >= 0) return normalized.substring(idx);

        idx = lower.indexOf("uploads/");
        if (idx >= 0) return "/" + normalized.substring(idx);

        return rawPath;
    }
}
