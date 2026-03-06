// file: src/main/java/com/popups/pupoo/program/speaker/application/SpeakerService.java
package com.popups.pupoo.program.speaker.application;

import com.popups.pupoo.program.domain.enums.ProgramCategory;
import com.popups.pupoo.program.domain.model.Program;
import com.popups.pupoo.program.persistence.ProgramRepository;
import com.popups.pupoo.program.speaker.domain.model.ProgramSpeakerMapping;
import com.popups.pupoo.program.speaker.domain.model.Speaker;
import com.popups.pupoo.program.speaker.dto.SpeakerResponse;
import com.popups.pupoo.program.speaker.persistence.ProgramSpeakerMappingRepository;
import com.popups.pupoo.program.speaker.persistence.SpeakerRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ?곗궗 議고쉶 ?쒕퉬??
 *
 * DB(v1.0) 湲곗?
 * - speakers???낅┰ 由ъ냼??
 * - ?꾨줈洹몃옩蹂??곗궗 議고쉶??program_speakers 留ㅽ븨?쇰줈 泥섎━?쒕떎.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpeakerService {

    private final SpeakerRepository speakerRepository;
    private final ProgramRepository programRepository;
    private final ProgramSpeakerMappingRepository programSpeakerMappingRepository;

    /** 怨듦컻: ?곗궗 ?꾩껜 紐⑸줉 */
    public List<SpeakerResponse> getSpeakers() {
        return speakerRepository.findAllByOrderBySpeakerIdDesc()
                .stream()
                .map(SpeakerResponse::from)
                .toList();
    }

    /** 怨듦컻: ?곗궗 ?④굔 議고쉶 */
    public SpeakerResponse getSpeaker(Long speakerId) {
        Speaker speaker = speakerRepository.findById(speakerId)
                .orElseThrow(() -> new EntityNotFoundException("SPEAKER_NOT_FOUND"));
        return SpeakerResponse.from(speaker);
    }

    /** ?꾨줈洹몃옩 ?섏쐞: ?꾨줈洹몃옩???랁븳 ?곗궗 紐⑸줉 */
    public List<SpeakerResponse> getSpeakersByProgram(Long programId) {
        Program program = getProgram(programId);
        if (!supportsSpeaker(program)) {
            return List.of();
        }

        Long speakerId = programSpeakerMappingRepository.findByProgramId(programId)
                .stream()
                .map(ProgramSpeakerMapping::getSpeakerId)
                .sorted()
                .findFirst()
                .orElse(null);

        if (speakerId == null) {
            return List.of();
        }

        Speaker speaker = speakerRepository.findById(speakerId)
                .orElseThrow(() -> new EntityNotFoundException("SPEAKER_NOT_FOUND"));

        return List.of(SpeakerResponse.from(speaker));
    }

    /** ?꾨줈洹몃옩 ?섏쐞: ?꾨줈洹몃옩???랁븳 ?곗궗 ?④굔 */
    public SpeakerResponse getSpeakerByProgram(Long programId, Long speakerId) {
        Program program = getProgram(programId);
        if (!supportsSpeaker(program)) {
            throw new EntityNotFoundException("PROGRAM_SPEAKER_NOT_FOUND");
        }

        if (!programSpeakerMappingRepository.existsByProgramIdAndSpeakerId(programId, speakerId)) {
            throw new EntityNotFoundException("PROGRAM_SPEAKER_NOT_FOUND");
        }

        Speaker speaker = speakerRepository.findById(speakerId)
                .orElseThrow(() -> new EntityNotFoundException("SPEAKER_NOT_FOUND"));

        return SpeakerResponse.from(speaker);
    }

    private Program getProgram(Long programId) {
        return programRepository.findById(programId)
                .orElseThrow(() -> new EntityNotFoundException("PROGRAM_NOT_FOUND"));
    }

    private boolean supportsSpeaker(Program program) {
        return program.getCategory() == ProgramCategory.SESSION;
    }
}
