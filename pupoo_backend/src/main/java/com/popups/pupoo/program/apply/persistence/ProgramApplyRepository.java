package com.popups.pupoo.program.apply.persistence;

import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;
import com.popups.pupoo.program.apply.domain.model.ProgramApply;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;

public interface ProgramApplyRepository extends JpaRepository<ProgramApply, Long> {

    Page<ProgramApply> findByUserId(Long userId, Pageable pageable);

    // 진행중 상태 중복 차단용
    boolean existsByUserIdAndProgramIdAndStatusIn(
            Long userId,
            Long programId,
            Collection<ApplyStatus> statuses
    );

    // REJECTED 재활용용 (방법 B 핵심)
    Optional<ProgramApply> findByUserIdAndProgramIdAndStatus(
            Long userId,
            Long programId,
            ApplyStatus status
    );
}
