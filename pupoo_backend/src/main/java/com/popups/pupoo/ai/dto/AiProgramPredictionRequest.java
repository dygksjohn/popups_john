package com.popups.pupoo.ai.dto;

import java.time.LocalDateTime;

public record AiProgramPredictionRequest(
        Long eventId,
        Long programId,
        LocalDateTime baseTime,
        LocalDateTime programStartAt,
        LocalDateTime programEndAt,
        int activeApplyCount,
        int checkinCount,
        int waitCount,
        double waitMinutes,
        String category,
        String target,
        String zone
) {
}
