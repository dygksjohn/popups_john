// file: src/main/java/com/popups/pupoo/program/speaker/application/SpeakerService.java
package com.popups.pupoo.program.speaker.application;

import com.popups.pupoo.program.persistence.ProgramRepository;
import com.popups.pupoo.program.speaker.domain.model.Speaker;
import com.popups.pupoo.program.speaker.dto.SpeakerResponse;
import com.popups.pupoo.program.speaker.persistence.SpeakerRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpeakerService {

    private final SpeakerRepository speakerRepository;
    private final ProgramRepository programRepository;

    public List<SpeakerResponse> getSpeakersByProgram(Long programId) {

        // 프로그램 존재 검증 (하위 리소스이므로 필수)
        if (!programRepository.existsById(programId)) {
            throw new EntityNotFoundException("PROGRAM_NOT_FOUND");
        }

        return speakerRepository.findByProgramId(programId)
                .stream()
                .map(SpeakerResponse::from)
                .toList();
    }

    public SpeakerResponse getSpeakerByProgram(Long programId, Long speakerId) {

        Speaker speaker = speakerRepository
                .findBySpeakerIdAndProgramId(speakerId, programId)
                .orElseThrow(() -> new EntityNotFoundException("SPEAKER_NOT_FOUND"));

        return SpeakerResponse.from(speaker);
    }
}
