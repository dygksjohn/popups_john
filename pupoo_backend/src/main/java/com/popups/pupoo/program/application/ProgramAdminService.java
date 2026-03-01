// file: src/main/java/com/popups/pupoo/program/application/ProgramAdminService.java
package com.popups.pupoo.program.application;

import com.popups.pupoo.program.domain.model.Program;
import com.popups.pupoo.program.persistence.ProgramRepository;
import com.popups.pupoo.program.dto.ProgramCreateRequest;
import com.popups.pupoo.program.dto.ProgramUpdateRequest;
import com.popups.pupoo.program.dto.ProgramResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class ProgramAdminService {

    private final ProgramRepository programRepository;

    /** 프로그램 등록 */
    public ProgramResponse createProgram(ProgramCreateRequest req) {
        Program program = Program.builder()
                .eventId(req.eventId)
                .category(req.category)
                .programTitle(req.programTitle)
                .description(req.description)
                .startAt(req.startAt)
                .endAt(req.endAt)
                .boothId(req.boothId)
                .imageUrl(req.imageUrl)
                .createdAt(LocalDateTime.now())
                .build();

        Program saved = programRepository.save(program);
        return ProgramResponse.from(saved);
    }

    /** 프로그램 수정 */
    public ProgramResponse updateProgram(Long programId, ProgramUpdateRequest req) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "프로그램을 찾을 수 없습니다. id=" + programId));

        if (req.category != null)     program.updateCategory(req.category);
        if (req.programTitle != null) program.updateProgramTitle(req.programTitle);
        if (req.description != null)  program.updateDescription(req.description);
        if (req.startAt != null)      program.updateStartAt(req.startAt);
        if (req.endAt != null)        program.updateEndAt(req.endAt);
        if (req.boothId != null)      program.updateBoothId(req.boothId);
        if (req.imageUrl != null)     program.updateImageUrl(req.imageUrl);

        return ProgramResponse.from(program);
    }

    /** 프로그램 삭제 */
    public ProgramResponse deleteProgram(Long programId) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "프로그램을 찾을 수 없습니다. id=" + programId));

        ProgramResponse response = ProgramResponse.from(program);
        programRepository.delete(program);
        return response;
    }
}
