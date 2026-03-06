// file: src/main/java/com/popups/pupoo/program/speaker/application/SpeakerAdminService.java
package com.popups.pupoo.program.speaker.application;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.popups.pupoo.common.util.PublicUrlNormalizer;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.program.domain.enums.ProgramCategory;
import com.popups.pupoo.program.domain.model.Program;
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
                .speakerImageUrl(PublicUrlNormalizer.normalize(req.speakerImageUrl))
                .build();

        Speaker saved = speakerRepository.save(speaker);

        if (req.programId != null) {
            Program targetProgram = programRepository.findById(req.programId)
                    .orElseThrow(() -> new EntityNotFoundException("PROGRAM_NOT_FOUND"));

            assignSpeakerToProgram(saved.getSpeakerId(), targetProgram);
        }

        return SpeakerResponse.from(saved);
    }

    public SpeakerResponse updateSpeaker(Long speakerId, SpeakerUpdateRequest req) {
        Speaker speaker = speakerRepository.findById(speakerId)
                .orElseThrow(() -> new EntityNotFoundException("SPEAKER_NOT_FOUND"));

        speaker.update(
                req.speakerName,
                req.speakerBio,
                req.speakerEmail,
                req.speakerPhone,
                PublicUrlNormalizer.normalize(req.speakerImageUrl)
        );

        if (req.programId != null) {
            Program targetProgram = programRepository.findById(req.programId)
                    .orElseThrow(() -> new EntityNotFoundException("PROGRAM_NOT_FOUND"));

            assignSpeakerToProgram(speakerId, targetProgram);
        }

        return SpeakerResponse.from(speaker);
    }

    public void deleteSpeaker(Long speakerId) {
        Speaker speaker = speakerRepository.findById(speakerId)
                .orElseThrow(() -> new EntityNotFoundException("SPEAKER_NOT_FOUND"));

        speaker.softDelete(LocalDateTime.now());
        programSpeakerMappingRepository.deleteBySpeakerId(speakerId);
    }

    private void validateSessionSpeakerSchedule(Long speakerId, Program targetProgram) {
        if (targetProgram.getCategory() != ProgramCategory.SESSION) {
            return;
        }

        boolean hasConflict = programSpeakerMappingRepository.existsSessionScheduleConflict(
                speakerId,
                targetProgram.getProgramId(),
                targetProgram.getStartAt(),
                targetProgram.getEndAt()
        );

        if (hasConflict) {
            throw new BusinessException(
                    ErrorCode.INVALID_REQUEST,
                    "SPEAKER_SCHEDULE_CONFLICT: overlapping session time"
            );
        }
    }

    private void assignSpeakerToProgram(Long speakerId, Program targetProgram) {
        validateSessionSpeakerSchedule(speakerId, targetProgram);

        // One program has exactly one speaker.
        programSpeakerMappingRepository.deleteByProgramIdAndSpeakerIdNot(
                targetProgram.getProgramId(),
                speakerId
        );

        if (!programSpeakerMappingRepository.existsByProgramIdAndSpeakerId(
                targetProgram.getProgramId(),
                speakerId
        )) {
            programSpeakerMappingRepository.save(
                    ProgramSpeakerMapping.of(targetProgram.getProgramId(), speakerId)
            );
        }
    }
}
