package com.popups.pupoo.ai.persistence;

import com.popups.pupoo.ai.domain.model.AiEventCongestionTimeseries;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
