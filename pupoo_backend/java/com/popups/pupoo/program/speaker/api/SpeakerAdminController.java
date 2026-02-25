// file: src/main/java/com/popups/pupoo/program/speaker/api/SpeakerAdminController.java
package com.popups.pupoo.program.speaker.api;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.audit.annotation.AdminAudit;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.program.speaker.application.SpeakerAdminService;
import com.popups.pupoo.program.speaker.dto.SpeakerCreateRequest;
import com.popups.pupoo.program.speaker.dto.SpeakerResponse;
import com.popups.pupoo.program.speaker.dto.SpeakerUpdateRequest;

import lombok.RequiredArgsConstructor;

/**
 * 연사 관리자 API
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/speakers")
public class SpeakerAdminController {

    private final SpeakerAdminService speakerAdminService;

    @PostMapping
    @AdminAudit(action = "SPEAKER_CREATE", targetType = AdminTargetType.OTHER, targetIdSpel = "#result.data.speakerId")
    public ApiResponse<SpeakerResponse> createSpeaker(@RequestBody SpeakerCreateRequest req) {
        return ApiResponse.success(speakerAdminService.createSpeaker(req));
    }

    @PatchMapping("/{speakerId}")
    @AdminAudit(action = "SPEAKER_UPDATE", targetType = AdminTargetType.OTHER, targetIdSpel = "#speakerId")
    public ApiResponse<SpeakerResponse> updateSpeaker(@PathVariable("speakerId") Long speakerId,
                                                      @RequestBody SpeakerUpdateRequest req) {
        return ApiResponse.success(speakerAdminService.updateSpeaker(speakerId, req));
    }

    @DeleteMapping("/{speakerId}")
    @AdminAudit(action = "SPEAKER_DELETE", targetType = AdminTargetType.OTHER, targetIdSpel = "#speakerId")
    public ApiResponse<Void> deleteSpeaker(@PathVariable("speakerId") Long speakerId) {
        speakerAdminService.deleteSpeaker(speakerId);
        return ApiResponse.success(null);
    }
}
