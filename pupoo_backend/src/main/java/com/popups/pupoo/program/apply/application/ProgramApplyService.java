// file: src/main/java/com/popups/pupoo/program/apply/application/ProgramApplyService.java
package com.popups.pupoo.program.apply.application;

import com.popups.pupoo.common.api.PageResponse;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.pet.persistence.PetRepository;
import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;
import com.popups.pupoo.program.apply.domain.model.ProgramApply;
import com.popups.pupoo.program.apply.dto.ProgramApplyRequest;
import com.popups.pupoo.program.apply.dto.ProgramApplyResponse;
import com.popups.pupoo.program.apply.persistence.ProgramApplyRepository;
import com.popups.pupoo.program.domain.enums.ProgramCategory;
import com.popups.pupoo.program.domain.model.Program;
import com.popups.pupoo.program.persistence.ProgramRepository;
import com.popups.pupoo.user.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProgramApplyService {

    private final ProgramApplyRepository programApplyRepository;
    private final ProgramRepository programRepository;
    private final EventRepository eventRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;

    private static final EnumSet<ApplyStatus> ACTIVE_STATUSES =
            EnumSet.of(ApplyStatus.APPLIED, ApplyStatus.WAITING, ApplyStatus.APPROVED);

    @Transactional(readOnly = true)
    public PageResponse<ProgramApplyResponse> getMyApplies(Long userId, Pageable pageable) {
        var page = programApplyRepository.findByUserId(userId, pageable);
        return PageResponse.from(page.map(ProgramApplyResponse::from));
    }

    @Transactional(readOnly = true)
    public PageResponse<ProgramApplyResponse> getApprovedCandidates(Long programId, Pageable pageable) {
        var page = programApplyRepository.findByProgramIdAndStatus(programId, ApplyStatus.APPROVED, pageable);

        var petIds = page.getContent().stream()
                .map(ProgramApply::getPetId)
                .filter(id -> id != null && id > 0L)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, String> petNameByPetId = new HashMap<>();
        if (!petIds.isEmpty()) {
            petRepository.findAllByPetIdIn(petIds)
                    .forEach(pet -> petNameByPetId.put(pet.getPetId(), pet.getPetName()));
        }

        var userIds = page.getContent().stream()
                .map(ProgramApply::getUserId)
                .filter(id -> id != null && id > 0L)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> nicknameByUserId = new HashMap<>();
        if (!userIds.isEmpty()) {
            userRepository.findAllById(userIds)
                    .forEach(user -> nicknameByUserId.put(user.getUserId(), user.getNickname()));
        }

        return PageResponse.from(page.map(apply ->
                ProgramApplyResponse.from(
                        apply,
                        petNameByPetId.get(apply.getPetId()),
                        nicknameByUserId.get(apply.getUserId())
                )
        ));
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

        if (event.getStatus() == EventStatus.ENDED || event.getStatus() == EventStatus.CANCELLED) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_EVENT_NOT_APPLICABLE);
        }

        if (!program.isApplyAllowed()) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_TIME_CLOSED);
        }

        boolean existsActive = programApplyRepository.existsByUserIdAndProgramIdAndStatusIn(
                userId,
                program.getProgramId(),
                ACTIVE_STATUSES
        );
        if (existsActive) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_DUPLICATE);
        }

        Long petId = req.getPetId();

        if (program.getCategory() == ProgramCategory.CONTEST && petId == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "petId is required for contest apply");
        }

        if (petId != null) {
            petRepository.findByPetIdAndUserId(petId, userId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        }

        try {
            ProgramApply saved = programApplyRepository.save(
                    ProgramApply.create(userId, program.getProgramId(), petId)
            );
            return ProgramApplyResponse.from(saved);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_DUPLICATE);
        }
    }

    public void cancel(Long userId, Long id) {
        ProgramApply apply = programApplyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_APPLY_NOT_FOUND));

        validateOwner(userId, apply);

        if (!apply.isActive()) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_INVALID_STATUS);
        }

        apply.cancel();
    }

    private void validateOwner(Long userId, ProgramApply apply) {
        if (!apply.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_ACCESS_DENIED);
        }
    }
}
