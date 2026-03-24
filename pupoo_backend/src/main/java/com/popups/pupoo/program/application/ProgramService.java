// file: src/main/java/com/popups/pupoo/program/application/ProgramService.java
package com.popups.pupoo.program.application;

import com.popups.pupoo.common.api.PageResponse;
import com.popups.pupoo.program.domain.enums.ProgramCategory;
import com.popups.pupoo.program.domain.model.Program;
import com.popups.pupoo.program.dto.ExperienceWaitResponse;
import com.popups.pupoo.program.dto.ProgramResponse;
import com.popups.pupoo.program.persistence.ExperienceWaitRepository;
import com.popups.pupoo.program.persistence.ProgramRepository;
import com.popups.pupoo.storage.support.StorageUrlResolver;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgramService {

    private final ProgramRepository programRepository;
    private final ExperienceWaitRepository experienceWaitRepository;
    private final StorageUrlResolver storageUrlResolver;

    public PageResponse<ProgramResponse> getPrograms(Long eventId, ProgramCategory category, Pageable pageable) {
        Page<Program> page = (category == null)
                ? programRepository.findByEventId(eventId, pageable)
                : programRepository.findByEventIdAndCategory(eventId, category, pageable);

        return PageResponse.from(page.map(this::toResponse));
    }

    public ProgramResponse getProgramDetail(Long programId) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new EntityNotFoundException("PROGRAM_NOT_FOUND"));
        ProgramResponse base = toResponse(program);

        ExperienceWaitResponse wait = program.getCategory() == ProgramCategory.EXPERIENCE
                ? experienceWaitRepository.findByProgramId(programId)
                .map(ExperienceWaitResponse::from)
                .orElse(null)
                : null;

        return ProgramResponse.builder()
                .programId(base.getProgramId())
                .eventId(base.getEventId())
                .category(base.getCategory())
                .programTitle(base.getProgramTitle())
                .description(base.getDescription())
                .imageUrl(base.getImageUrl())
                .boothId(base.getBoothId())
                .startAt(base.getStartAt())
                .endAt(base.getEndAt())
                .ongoing(base.isOngoing())
                .upcoming(base.isUpcoming())
                .ended(base.isEnded())
                .experienceWait(wait)
                .build();
    }

    private ProgramResponse toResponse(Program program) {
        return ProgramResponse.from(program, storageUrlResolver.toPublicUrl(program.getImageUrl()));
    }
}
