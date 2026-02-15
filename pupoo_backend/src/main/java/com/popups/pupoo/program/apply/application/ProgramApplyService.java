package com.popups.pupoo.program.apply.application;

import com.popups.pupoo.common.api.PageResponse;
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
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;

@Service
@RequiredArgsConstructor
@Transactional
public class ProgramApplyService {

    private final ProgramApplyRepository programApplyRepository;
    private final ProgramRepository programRepository;
    private final EventRepository eventRepository;

    // 재신청을 막을 상태들 (REJECTED는 재신청 허용)
    private static final EnumSet<ApplyStatus> DUPLICATE_BLOCK_STATUSES =
            EnumSet.of(ApplyStatus.APPLIED, ApplyStatus.WAITING, ApplyStatus.APPROVED);

    @Transactional(readOnly = true)
    public PageResponse<ProgramApplyResponse> getMyApplies(Long userId, Pageable pageable) {
        var page = programApplyRepository.findByUserId(userId, pageable);
        return PageResponse.from(page.map(ProgramApplyResponse::from));
    }

    @Transactional(readOnly = true)
    public ProgramApplyResponse getApply(Long userId, Long id) {
        ProgramApply apply = programApplyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PROGRAM_APPLY_NOT_FOUND"));

        validateOwner(userId, apply);
        return ProgramApplyResponse.from(apply);
    }

    public ProgramApplyResponse create(Long userId, ProgramApplyRequest req) {
        Program program = programRepository.findById(req.getProgramId())
                .orElseThrow(() -> new EntityNotFoundException("PROGRAM_NOT_FOUND"));

        Event event = eventRepository.findById(program.getEventId())
                .orElseThrow(() -> new EntityNotFoundException("EVENT_NOT_FOUND"));

        // 1) 행사 상태 검증
        if (event.getStatus() == EventStatus.ENDED || event.getStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("EVENT_NOT_APPLICABLE");
        }

        // 2) 신청 가능 시간 검증: 시작 1시간 전까지 가능
        if (!program.isApplyAllowed()) {
            throw new IllegalStateException("PROGRAM_APPLY_TIME_CLOSED");
        }

        // 3) 방법 B: REJECTED면 기존 row 재활용 (status만 APPLIED로 되돌림)
        var rejectedOpt = programApplyRepository.findByUserIdAndProgramIdAndStatus(
                userId,
                program.getProgramId(),
                ApplyStatus.REJECTED
        );

        if (rejectedOpt.isPresent()) {
            ProgramApply rejected = rejectedOpt.get();
            rejected.reapply(); // ✅ 엔티티에 구현 필요: status=APPLIED
            return ProgramApplyResponse.from(rejected);
        }

        // 4) 중복 신청 검증 (진행 상태)
        boolean exists = programApplyRepository.existsByUserIdAndProgramIdAndStatusIn(
                userId,
                program.getProgramId(),
                DUPLICATE_BLOCK_STATUSES
        );

        if (exists) {
            throw new IllegalStateException("PROGRAM_APPLY_DUPLICATED");
        }

        ProgramApply saved = programApplyRepository.save(
                ProgramApply.create(userId, program.getProgramId())
        );

        return ProgramApplyResponse.from(saved);
    }

    public void cancel(Long userId, Long id) {
        ProgramApply apply = programApplyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PROGRAM_APPLY_NOT_FOUND"));

        validateOwner(userId, apply);

        // 이미 REJECTED면 중복 취소 방지(선택)
        if (apply.getStatus() == ApplyStatus.REJECTED) {
            throw new IllegalStateException("ALREADY_REJECTED");
        }

        apply.cancel(); // status -> REJECTED (엔티티 구현 기준)
    }

    private void validateOwner(Long userId, ProgramApply apply) {
        if (!apply.getUserId().equals(userId)) {
            throw new SecurityException("FORBIDDEN");
        }
    }
}
