package com.popups.pupoo.ai.persistence;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface RealtimeWaitSyncQueryRepository {

    List<RunningProgramRow> findRunningPrograms(LocalDateTime baseTime);

    List<ProgramQueueCountRow> findProgramQueueCounts(Collection<Long> programIds);

    List<ProgramCheckinCountRow> findProgramCheckinCounts(
            Collection<Long> programIds,
            LocalDateTime fromInclusive,
            LocalDateTime toExclusive
    );

    List<ActiveBoothRow> findActiveBooths(LocalDateTime baseTime);

    record RunningProgramRow(
            Long programId,
            Long boothId,
            Integer capacity,
            BigDecimal throughputPerMin
    ) {
    }

    record ProgramQueueCountRow(Long programId, int queueCount) {
    }

    record ProgramCheckinCountRow(Long programId, int checkinCount) {
    }

    record ActiveBoothRow(Long boothId) {
    }
}
