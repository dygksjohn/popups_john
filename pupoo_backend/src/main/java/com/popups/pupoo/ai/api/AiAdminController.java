package com.popups.pupoo.ai.api;

import com.popups.pupoo.ai.application.AiCongestionService;
import com.popups.pupoo.ai.dto.AiCongestionPredictionResponse;
import com.popups.pupoo.common.api.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/ai")
public class AiAdminController {

    private final AiCongestionService aiCongestionService;

    public AiAdminController(AiCongestionService aiCongestionService) {
        this.aiCongestionService = aiCongestionService;
    }

    @GetMapping("/events/{eventId}/congestion/predict")
    public ApiResponse<AiCongestionPredictionResponse> predictEventCongestion(
            @PathVariable Long eventId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return ApiResponse.success(aiCongestionService.predictEvent(eventId, from, to));
    }

    @GetMapping("/events/{eventId}/programs/congestion")
    public ApiResponse<List<AiCongestionPredictionResponse>> predictProgramsCongestion(@PathVariable Long eventId) {
        return ApiResponse.success(aiCongestionService.predictProgramsByEvent(eventId));
    }
}
