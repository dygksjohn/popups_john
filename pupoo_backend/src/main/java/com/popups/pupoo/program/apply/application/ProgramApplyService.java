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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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

    @PersistenceContext
    private EntityManager em;

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

        return PageResponse.from(page.map(apply -> {
            // petId가 없으면 adminPetName fallback (어드민 직접 등록)
            String petName = apply.getPetId() != null
                    ? petNameByPetId.get(apply.getPetId())
                    : apply.getAdminPetName();
            String nickname = apply.getUserId() != null
                    ? nicknameByUserId.get(apply.getUserId())
                    : "어드민 등록";
            return ProgramApplyResponse.from(apply, petName, nickname);
        }));
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
        String imageUrl = req.getImageUrl();

        if (program.getCategory() == ProgramCategory.CONTEST && petId == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "petId is required for contest apply");
        }

        if (petId != null) {
            petRepository.findByPetIdAndUserId(petId, userId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        }

        try {
            ProgramApply saved = programApplyRepository.save(
                    ProgramApply.create(userId, program.getProgramId(), petId, imageUrl)
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

    // ✅ 신규: 관리자용 - 프로그램의 전체 신청자 목록 (상태 무관)
    @Transactional(readOnly = true)
    public PageResponse<ProgramApplyResponse> getAppliesByProgramForAdmin(Long programId, Pageable pageable) {
        // 모든 상태의 신청자를 내림차순으로 조회
        Page<ProgramApply> page = programApplyRepository.findByProgramIdOrderByProgramApplyIdDesc(programId, pageable);

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

        return PageResponse.from(page.map(apply -> {
            // petId가 없으면 adminPetName fallback (어드민 직접 등록)
            String petName = apply.getPetId() != null
                    ? petNameByPetId.get(apply.getPetId())
                    : apply.getAdminPetName();
            String nickname = apply.getUserId() != null
                    ? nicknameByUserId.get(apply.getUserId())
                    : "어드민 등록";
            return ProgramApplyResponse.from(apply, petName, nickname);
        }));
    }

    // ✅ 신규: 관리자용 - 신청 상태 변경 (APPROVED / REJECTED / APPLIED)
    @Transactional
    public ProgramApplyResponse adminUpdateStatus(Long applyId, String statusStr) {
        ProgramApply apply = programApplyRepository.findById(applyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_APPLY_NOT_FOUND));

        ApplyStatus newStatus;
        try {
            newStatus = ApplyStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "Invalid status: " + statusStr);
        }

        switch (newStatus) {
            case APPROVED -> apply.approve();
            case REJECTED -> apply.reject();
            case APPLIED  -> apply.resetToApplied(); // 승인 취소 (재검토)
            default -> throw new BusinessException(ErrorCode.INVALID_REQUEST, "Cannot set status to: " + statusStr);
        }

        return ProgramApplyResponse.from(apply);
    }

    /**
     * 어드민 직접 참가자 등록 — petId/시간/중복 제약 없이 등록 후 즉시 APPROVED
     */
    public ProgramApplyResponse adminCreate(Long programId, Long adminUserId, String petName, String imageUrl) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_NOT_FOUND));
        if (program.getCategory() != ProgramCategory.CONTEST) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "CONTEST 프로그램에만 직접 등록 가능합니다.");
        }
        // user_id=NULL로 INSERT (마이그레이션으로 nullable 처리)
        // NULL은 unique 제약에서 서로 다른 값 → 여러 명 등록 가능
        em.createNativeQuery(
                "INSERT INTO event_program_apply (program_id, user_id, pet_id, image_url, admin_pet_name, status, created_at) " +
                "VALUES (?, NULL, NULL, ?, ?, 'APPLIED', NOW())")
          .setParameter(1, programId)
          .setParameter(2, imageUrl)
          .setParameter(3, petName)
          .executeUpdate();

        Object rawId = em.createNativeQuery("SELECT LAST_INSERT_ID()").getSingleResult();
        Long newId = ((Number) rawId).longValue();

        em.createNativeQuery("UPDATE event_program_apply SET status='APPROVED' WHERE program_apply_id=?")
          .setParameter(1, newId)
          .executeUpdate();

        ProgramApply saved = programApplyRepository.findById(newId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        return ProgramApplyResponse.from(saved, petName, "어드민 등록");
    }

    @Transactional
    public void adminHardDelete(Long applyId) {
        ProgramApply apply = programApplyRepository.findById(applyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_APPLY_NOT_FOUND));
        programApplyRepository.delete(apply);
    }

    private void validateOwner(Long userId, ProgramApply apply) {
        if (!apply.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_ACCESS_DENIED);
        }
    }
}
