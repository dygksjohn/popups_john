// file: src/main/java/com/popups/pupoo/program/speaker/application/SpeakerService.java
package com.popups.pupoo.program.speaker.application;

import com.popups.pupoo.program.persistence.ProgramRepository;
import com.popups.pupoo.program.speaker.domain.model.ProgramSpeakerMapping;
import com.popups.pupoo.program.speaker.domain.model.Speaker;
import com.popups.pupoo.program.speaker.dto.SpeakerResponse;
import com.popups.pupoo.program.speaker.persistence.ProgramSpeakerMappingRepository;
import com.popups.pupoo.program.speaker.persistence.SpeakerRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * 연사 조회 서비스
 *
 * DB(v1.0) 기준
 * - speakers는 독립 리소스
 * - 프로그램별 연사 조회는 program_speakers 매핑으로 처리한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpeakerService {

    private final SpeakerRepository speakerRepository;
    private final ProgramRepository programRepository;
    private final ProgramSpeakerMappingRepository programSpeakerMappingRepository;

    /** 공개: 연사 전체 목록 */
    public List<SpeakerResponse> getSpeakers() {
        return speakerRepository.findAllByOrderBySpeakerIdDesc()
                .stream()
                .map(SpeakerResponse::from)
                .toList();
    }

    /** 공개: 연사 단건 조회 */
    public SpeakerResponse getSpeaker(Long speakerId) {
        Speaker speaker = speakerRepository.findById(speakerId)
                .orElseThrow(() -> new EntityNotFoundException("SPEAKER_NOT_FOUND"));
        return SpeakerResponse.from(speaker);
    }

    /** 프로그램 하위: 프로그램에 속한 연사 목록 */
    public List<SpeakerResponse> getSpeakersByProgram(Long programId) {

        if (!programRepository.existsById(programId)) {
            throw new EntityNotFoundException("PROGRAM_NOT_FOUND");
        }

        List<Long> speakerIds = programSpeakerMappingRepository.findByProgramId(programId)
                .stream()
                .map(ProgramSpeakerMapping::getSpeakerId)
                .toList();

        if (speakerIds.isEmpty()) {
            return List.of();
        }

        return speakerRepository.findAllById(speakerIds)
                .stream()
                .sorted(Comparator.comparing(Speaker::getSpeakerId))
                .map(SpeakerResponse::from)
                .toList();
    }

    /** 프로그램 하위: 프로그램에 속한 연사 단건 */
    public SpeakerResponse getSpeakerByProgram(Long programId, Long speakerId) {

        if (!programRepository.existsById(programId)) {
            throw new EntityNotFoundException("PROGRAM_NOT_FOUND");
        }

        if (!programSpeakerMappingRepository.existsByProgramIdAndSpeakerId(programId, speakerId)) {
            throw new EntityNotFoundException("PROGRAM_SPEAKER_NOT_FOUND");
        }

        Speaker speaker = speakerRepository.findById(speakerId)
                .orElseThrow(() -> new EntityNotFoundException("SPEAKER_NOT_FOUND"));

        return SpeakerResponse.from(speaker);
    }
}