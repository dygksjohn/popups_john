package com.popups.pupoo.program.application;

import com.popups.pupoo.common.api.PageResponse;
import com.popups.pupoo.program.domain.enums.ProgramCategory;
import com.popups.pupoo.program.domain.model.Program;
import com.popups.pupoo.program.dto.ProgramResponse;
import com.popups.pupoo.program.persistence.ProgramRepository;
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

    public PageResponse<ProgramResponse> getPrograms(Long eventId, ProgramCategory category, Pageable pageable) {
        Page<Program> page = (category == null)
                ? programRepository.findByEventId(eventId, pageable)
                : programRepository.findByEventIdAndCategory(eventId, category, pageable);

        return PageResponse.from(page.map(ProgramResponse::from));
    }

    public ProgramResponse getProgramDetail(Long programId) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new EntityNotFoundException("PROGRAM_NOT_FOUND"));
        return ProgramResponse.from(program);
    }
}
