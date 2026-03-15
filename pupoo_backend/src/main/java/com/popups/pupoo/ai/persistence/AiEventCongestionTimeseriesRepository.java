package com.popups.pupoo.ai.persistence;

import com.popups.pupoo.ai.domain.model.AiEventCongestionTimeseries;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AiEventCongestionTimeseriesRepository extends JpaRepository<AiEventCongestionTimeseries, Long> {

    Optional<AiEventCongestionTimeseries> findByEventIdAndTimestampMinute(Long eventId, LocalDateTime timestampMinute);

    List<AiEventCongestionTimeseries> findByTimestampMinuteAndEventIdIn(
            LocalDateTime timestampMinute,
            Collection<Long> eventIds
    );

    @Modifying
    @Query(
            value = """
                    INSERT INTO ai_event_congestion_timeseries (
                        event_id,
                        timestamp_minute,
                        checkins_1m,
                        checkouts_1m,
                        active_apply_count,
                        total_wait_count,
                        avg_wait_min,
                        running_program_count,
                        progress_minute,
                        hour_of_day,
                        day_of_week,
                        congestion_score
                    ) VALUES (
                        :eventId,
                        :timestampMinute,
                        :checkins1m,
                        :checkouts1m,
                        :activeApplyCount,
                        :totalWaitCount,
                        :avgWaitMin,
                        :runningProgramCount,
                        :progressMinute,
                        :hourOfDay,
                        :dayOfWeek,
                        :congestionScore
                    )
                    ON DUPLICATE KEY UPDATE
                        checkins_1m = VALUES(checkins_1m),
                        checkouts_1m = VALUES(checkouts_1m),
                        active_apply_count = VALUES(active_apply_count),
                        total_wait_count = VALUES(total_wait_count),
                        avg_wait_min = VALUES(avg_wait_min),
                        running_program_count = VALUES(running_program_count),
                        progress_minute = VALUES(progress_minute),
                        hour_of_day = VALUES(hour_of_day),
                        day_of_week = VALUES(day_of_week),
                        congestion_score = VALUES(congestion_score)
                    """,
            nativeQuery = true
    )
    void upsertSnapshot(
            @Param("eventId") Long eventId,
            @Param("timestampMinute") LocalDateTime timestampMinute,
            @Param("checkins1m") Integer checkins1m,
            @Param("checkouts1m") Integer checkouts1m,
            @Param("activeApplyCount") Integer activeApplyCount,
            @Param("totalWaitCount") Integer totalWaitCount,
            @Param("avgWaitMin") BigDecimal avgWaitMin,
            @Param("runningProgramCount") Integer runningProgramCount,
            @Param("progressMinute") Integer progressMinute,
            @Param("hourOfDay") Byte hourOfDay,
            @Param("dayOfWeek") Byte dayOfWeek,
            @Param("congestionScore") BigDecimal congestionScore
    );
}
