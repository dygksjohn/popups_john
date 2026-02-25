// file: src/main/java/com/popups/pupoo/program/speaker/persistence/SpeakerRepository.java
package com.popups.pupoo.program.speaker.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.program.speaker.domain.model.Speaker;

public interface SpeakerRepository extends JpaRepository<Speaker, Long> {

    List<Speaker> findAllByOrderBySpeakerIdDesc();
}