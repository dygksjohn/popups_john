// file: src/main/java/com/popups/pupoo/program/speaker/persistence/ProgramSpeakerMappingRepository.java
package com.popups.pupoo.program.speaker.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.program.speaker.domain.model.ProgramSpeakerMapping;

public interface ProgramSpeakerMappingRepository extends JpaRepository<ProgramSpeakerMapping, ProgramSpeakerMapping.Pk> {

    List<ProgramSpeakerMapping> findByProgramId(Long programId);

    List<ProgramSpeakerMapping> findBySpeakerId(Long speakerId);

    boolean existsByProgramIdAndSpeakerId(Long programId, Long speakerId);

    void deleteByProgramIdAndSpeakerId(Long programId, Long speakerId);

    void deleteBySpeakerId(Long speakerId);
}