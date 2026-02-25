// file: src/main/java/com/popups/pupoo/program/apply/application/ProgramApplyService.java
package com.popups.pupoo.program.apply.application;

import java.util.EnumSet;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.popups.pupoo.common.api.PageResponse;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;
import com.popups.pupoo.program.apply.domain.model.ProgramApply;
import com.popups.pupoo.program.apply.dto.ProgramApplyRequest;
import com.popups.pupoo.program.apply.dto.ProgramApplyResponse;
import com.popups.pupoo.program.apply.persistence.ProgramApplyRepository;
import com.popups.pupoo.program.domain.model.Program;
import com.popups.pupoo.program.persistence.ProgramRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ProgramApplyService {

    private final ProgramApplyRepository programApplyRepository;
    private final ProgramRepository programRepository;
    private final EventRepository eventRepository;

    //  활성 상태(= 중복 차단): APPLIED / WAITING / APPROVED
    // (DB active_flag 정의와 반드시 동일해야 함)
    private static final EnumSet<ApplyStatus> ACTIVE_STATUSES =
            EnumSet.of(ApplyStatus.APPLIED, ApplyStatus.WAITING, ApplyStatus.APPROVED);

    @Transactional(readOnly = true)
    public PageResponse<ProgramApplyResponse> getMyApplies(Long userId, Pageable pageable) {
        var page = programApplyRepository.findByUserId(userId, pageable);
        return PageResponse.from(page.map(ProgramApplyResponse::from));
    }

    @Transactional(readOnly = true)
    public ProgramApplyResponse getApply(Long userId, Long id) {
        ProgramApply apply = programApplyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_APPLY_NOT_FOUND));

        validateOwner(userId, apply);
        return ProgramApplyResponse.from(apply);
    }

    public ProgramApplyResponse create(Long userId, ProgramApplyRequest req) {
        Program program = programRepository.findById(req.getProgramId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_NOT_FOUND));

        Event event = eventRepository.findById(program.getEventId())
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));

        // 1) 행사 상태 검증
        if (event.getStatus() == EventStatus.ENDED || event.getStatus() == EventStatus.CANCELLED) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_EVENT_NOT_APPLICABLE);
        }

        // 2) 신청 가능 시간 검증
        if (!program.isApplyAllowed()) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_TIME_CLOSED);
        }

        // 3) 중복 신청 검증 (활성 상태만 차단)
        boolean existsActive = programApplyRepository.existsByUserIdAndProgramIdAndStatusIn(
                userId,
                program.getProgramId(),
                ACTIVE_STATUSES
        );

        if (existsActive) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_DUPLICATE);
        }

        // 4) 저장 (REJECTED/CANCELLED 이력은 남기고, 재신청은 새 row INSERT)
        try {
            ProgramApply saved = programApplyRepository.save(
                    ProgramApply.create(userId, program.getProgramId())
            );
            return ProgramApplyResponse.from(saved);
        } catch (DataIntegrityViolationException e) {
            // 동시성(더블클릭/중복요청)에서 DB 유니크에 걸릴 수 있음
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_DUPLICATE);
        }
    }

    public void cancel(Long userId, Long id) {
        ProgramApply apply = programApplyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_APPLY_NOT_FOUND));

        validateOwner(userId, apply);

        // 정책: 활성 상태(APPLIED/WAITING/APPROVED)에서만 취소 가능
        if (!apply.isActive()) {
            // CHECKED_IN/REJECTED/CANCELLED 등
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_INVALID_STATUS);
        }

        apply.cancel(); // status=CANCELLED + cancelledAt=now()
    }

    private void validateOwner(Long userId, ProgramApply apply) {
        if (!apply.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_ACCESS_DENIED);
        }
    }
}
