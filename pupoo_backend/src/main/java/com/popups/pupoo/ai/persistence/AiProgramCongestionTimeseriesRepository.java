package com.popups.pupoo.ai.persistence;

import com.popups.pupoo.ai.domain.model.AiProgramCongestionTimeseries;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AiProgramCongestionTimeseriesRepository extends JpaRepository<AiProgramCongestionTimeseries, Long> {

    Optional<AiProgramCongestionTimeseries> findByProgramIdAndTimestampMinute(Long programId, LocalDateTime timestampMinute);

    List<AiProgramCongestionTimeseries> findByTimestampMinuteAndProgramIdIn(
            LocalDateTime timestampMinute,
            Collection<Long> programIds
    );
}
