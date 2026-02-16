package com.popups.pupoo.booth.dto;

import java.time.LocalDateTime;

public class BoothCongestionResponse {
    public Integer congestionLevel;   // 1~5
    public LocalDateTime measuredAt;  // measured_at
    public Long programId;            // program_id
}
