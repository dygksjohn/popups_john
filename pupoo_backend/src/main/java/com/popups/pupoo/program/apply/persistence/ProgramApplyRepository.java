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

    /**
     * ✅ 활성 신청 중복 차단용
     * 활성 = APPLIED / WAITING / APPROVED (DB active_flag 정의와 동일)
     */
    boolean existsByUserIdAndProgramIdAndStatusIn(
            Long userId,
            Long programId,
            Collection<ApplyStatus> statuses
    );

    /**
     * ✅ 취소/진행중/승인/대기/반려 등 "최근 상태 1건" 조회용
     * (취소 시 업데이트 대상 찾거나, 상태 확인/응답에 사용)
     */
    Optional<ProgramApply> findTop1ByUserIdAndProgramIdOrderByProgramApplyIdDesc(
            Long userId,
            Long programId
    );

    /**
     * ✅ (선택) "현재 활성 신청 1건" 조회가 필요하면 추가
     * 활성 상태에서만 1건
     */
    Optional<ProgramApply> findTop1ByUserIdAndProgramIdAndStatusInOrderByProgramApplyIdDesc(
            Long userId,
            Long programId,
            Collection<ApplyStatus> statuses
    );
}
