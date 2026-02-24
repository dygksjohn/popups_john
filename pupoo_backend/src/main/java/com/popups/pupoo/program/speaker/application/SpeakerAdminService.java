// file: src/main/java/com/popups/pupoo/program/speaker/application/SpeakerAdminService.java
package com.popups.pupoo.program.speaker.application;

import com.popups.pupoo.program.persistence.ProgramRepository;
import com.popups.pupoo.program.speaker.domain.model.ProgramSpeakerMapping;
import com.popups.pupoo.program.speaker.domain.model.Speaker;
import com.popups.pupoo.program.speaker.dto.SpeakerCreateRequest;
import com.popups.pupoo.program.speaker.dto.SpeakerResponse;
import com.popups.pupoo.program.speaker.dto.SpeakerUpdateRequest;
import com.popups.pupoo.program.speaker.persistence.ProgramSpeakerMappingRepository;
import com.popups.pupoo.program.speaker.persistence.SpeakerRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 연사 관리자 유스케이스
 *
 * DB(v1.0) 기준
 * - speakers는 독립 리소스
 * - 프로그램과의 연결은 program_speakers 매핑으로 처리한다.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SpeakerAdminService {

    private final SpeakerRepository speakerRepository;
    private final ProgramRepository programRepository;
    private final ProgramSpeakerMappingRepository programSpeakerMappingRepository;

    public SpeakerResponse createSpeaker(SpeakerCreateRequest req) {

        Speaker speaker = Speaker.builder()
                .speakerName(req.speakerName)
                .speakerBio(req.speakerBio)
                .speakerEmail(req.speakerEmail)
                .speakerPhone(req.speakerPhone)
                .build();

        Speaker saved = speakerRepository.save(speaker);

        // programId가 들어오면 매핑을 생성한다(프로그램 하위에서 생성하는 관리자 UX 대응)
        if (req.programId != null) {
            if (!programRepository.existsById(req.programId)) {
                throw new EntityNotFoundException("PROGRAM_NOT_FOUND");
            }
            if (!programSpeakerMappingRepository.existsByProgramIdAndSpeakerId(req.programId, saved.getSpeakerId())) {
                programSpeakerMappingRepository.save(ProgramSpeakerMapping.of(req.programId, saved.getSpeakerId()));
            }
        }

        return SpeakerResponse.from(saved);
    }

    public SpeakerResponse updateSpeaker(Long speakerId, SpeakerUpdateRequest req) {
        Speaker speaker = speakerRepository.findById(speakerId)
                .orElseThrow(() -> new EntityNotFoundException("SPEAKER_NOT_FOUND"));

        speaker.update(req.speakerName, req.speakerBio, req.speakerEmail, req.speakerPhone);

        // programId가 들어오면 매핑을 생성한다(이미 있으면 스킵)
        if (req.programId != null) {
            if (!programRepository.existsById(req.programId)) {
                throw new EntityNotFoundException("PROGRAM_NOT_FOUND");
            }
            if (!programSpeakerMappingRepository.existsByProgramIdAndSpeakerId(req.programId, speakerId)) {
                programSpeakerMappingRepository.save(ProgramSpeakerMapping.of(req.programId, speakerId));
            }
        }

        return SpeakerResponse.from(speaker);
    }

    public void deleteSpeaker(Long speakerId) {
        Speaker speaker = speakerRepository.findById(speakerId)
                .orElseThrow(() -> new EntityNotFoundException("SPEAKER_NOT_FOUND"));

        // soft delete
        speaker.softDelete(LocalDateTime.now());

        // 매핑도 함께 제거(프로그램 페이지에서 더 이상 노출되지 않게)
        programSpeakerMappingRepository.deleteBySpeakerId(speakerId);
    }
}
