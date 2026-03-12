package com.popups.pupoo.ai.dto;

import java.time.LocalDateTime;

public record AiEventPredictionRequest(
        Long eventId,
        LocalDateTime baseTime,
        LocalDateTime eventStartAt,
        LocalDateTime eventEndAt,
        int entryCount,
        int activeApplyCount,
        int runningProgramCount,
        int totalProgramCount,
        int totalWaitCount,
        double averageWaitMinutes
) {
}
