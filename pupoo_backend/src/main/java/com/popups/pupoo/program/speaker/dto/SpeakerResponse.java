// file: src/main/java/com/popups/pupoo/program/speaker/dto/SpeakerResponse.java
package com.popups.pupoo.program.speaker.dto;

import com.popups.pupoo.program.speaker.domain.model.Speaker;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SpeakerResponse {

    private Long speakerId;
    private String speakerName;
    private String speakerBio;
    private String speakerEmail;
    private String speakerPhone;
    private String speakerImageUrl;

    public static SpeakerResponse from(Speaker s) {
        return SpeakerResponse.builder()
                .speakerId(s.getSpeakerId())
                .speakerName(s.getSpeakerName())
                .speakerBio(s.getSpeakerBio())
                .speakerEmail(s.getSpeakerEmail())
                .speakerPhone(s.getSpeakerPhone())
                .speakerImageUrl(normalizeImagePath(s.getSpeakerImageUrl()))
                .build();
    }

    private static String normalizeImagePath(String rawPath) {
        if (rawPath == null || rawPath.isBlank()) return null;

        String normalized = rawPath.replace('\\', '/');
        String lower = normalized.toLowerCase();

        int idx = lower.indexOf("/uploads/");
        if (idx >= 0) return normalized.substring(idx);

        idx = lower.indexOf("uploads/");
        if (idx >= 0) return "/" + normalized.substring(idx);

        return rawPath;
    }
}
