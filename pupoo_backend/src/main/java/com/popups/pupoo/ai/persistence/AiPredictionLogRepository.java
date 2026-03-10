package com.popups.pupoo.ai.persistence;

import com.popups.pupoo.ai.domain.model.AiPredictionLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiPredictionLogRepository extends JpaRepository<AiPredictionLog, Long> {
}
