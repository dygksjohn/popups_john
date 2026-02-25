// file: src/main/java/com/popups/pupoo/program/apply/persistence/ProgramParticipationStatRepository.java
package com.popups.pupoo.program.apply.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.program.apply.domain.model.ProgramParticipationStat;
import com.popups.pupoo.program.apply.domain.model.ProgramParticipationStat.Pk;

public interface ProgramParticipationStatRepository extends JpaRepository<ProgramParticipationStat, Pk> {

    Optional<ProgramParticipationStat> findByUserIdAndProgramId(Long userId, Long programId);
}
