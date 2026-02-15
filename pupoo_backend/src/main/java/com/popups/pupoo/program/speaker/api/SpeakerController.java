package com.popups.pupoo.program.speaker.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.PageResponse;
import com.popups.pupoo.program.speaker.application.SpeakerService;
import com.popups.pupoo.program.speaker.dto.SpeakerResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/speakers")
@RequiredArgsConstructor
public class SpeakerController {

    private final SpeakerService speakerService;

    // 연사 목록 조회
    @GetMapping
    public ApiResponse<PageResponse<SpeakerResponse>> getSpeakers(Pageable pageable) {
        return ApiResponse.success(
                speakerService.getSpeakers(pageable)
        );
    }

    // 연사 단건 조회
    @GetMapping("/{id}")
    public ApiResponse<SpeakerResponse> getSpeaker(
            @PathVariable("id") Long id
    ) {
        return ApiResponse.success(
                speakerService.getSpeaker(id)
        );
    }
}
