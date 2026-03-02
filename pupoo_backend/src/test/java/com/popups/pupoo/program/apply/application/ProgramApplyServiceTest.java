package com.popups.pupoo.program.apply.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.pet.persistence.PetRepository;
import com.popups.pupoo.program.apply.dto.ProgramApplyRequest;
import com.popups.pupoo.program.apply.persistence.ProgramApplyRepository;
import com.popups.pupoo.program.persistence.ProgramRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProgramApplyServiceTest {

    @Mock private ProgramApplyRepository programApplyRepository;
    @Mock private ProgramRepository programRepository;
    @Mock private EventRepository eventRepository;
    @Mock private PetRepository petRepository;

    private ProgramApplyService programApplyService;

    @BeforeEach
    void setUp() {
        programApplyService = new ProgramApplyService(programApplyRepository, programRepository, eventRepository, petRepository);
    }

    @Test
    void create_다른_사용자_펫을_선택하면_예외() throws Exception {
        ProgramApplyRequest request = new ProgramApplyRequest();
        Long userId = 10L;
        Long petId = 99L;

        var petField = ProgramApplyRequest.class.getDeclaredField("petId");
        petField.setAccessible(true);
        petField.set(request, petId);

        var programField = ProgramApplyRequest.class.getDeclaredField("programId");
        programField.setAccessible(true);
        programField.set(request, 1L);

        when(petRepository.findByPetIdAndUserId(petId, userId)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> programApplyService.create(userId, request));
        verify(programRepository, never()).findById(anyLong());
    }
}
