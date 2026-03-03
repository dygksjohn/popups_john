package com.popups.pupoo.program.apply.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.pet.domain.model.Pet;
import com.popups.pupoo.pet.persistence.PetRepository;
import com.popups.pupoo.program.apply.domain.model.ProgramApply;
import com.popups.pupoo.program.apply.dto.ProgramApplyRequest;
import com.popups.pupoo.program.apply.dto.ProgramApplyResponse;
import com.popups.pupoo.program.apply.persistence.ProgramApplyRepository;
import com.popups.pupoo.program.domain.enums.ProgramCategory;
import com.popups.pupoo.program.domain.model.Program;
import com.popups.pupoo.program.persistence.ProgramRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProgramApplyServiceTest {

    @Mock private ProgramApplyRepository programApplyRepository;
    @Mock private ProgramRepository programRepository;
    @Mock private EventRepository eventRepository;
    @Mock private PetRepository petRepository;

    @InjectMocks private ProgramApplyService programApplyService;

    @Test
    void create_whenPetDoesNotBelongToUser_throwsPetNotFound() {
        Long userId = 1L;
        Long programId = 10L;
        Long eventId = 20L;
        Long petId = 99L;

        ProgramApplyRequest request = new ProgramApplyRequest();
        ReflectionTestUtils.setField(request, "programId", programId);
        ReflectionTestUtils.setField(request, "petId", petId);

        Program program = Program.builder()
                .programId(programId)
                .eventId(eventId)
                .category(ProgramCategory.SESSION)
                .programTitle("Program")
                .description("desc")
                .startAt(LocalDateTime.now().plusDays(1))
                .endAt(LocalDateTime.now().plusDays(1).plusHours(1))
                .build();

        Event event = Event.create(
                "Event",
                "desc",
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(1),
                "Seoul",
                EventStatus.ONGOING,
                1,
                BigDecimal.ZERO
        );
        ReflectionTestUtils.setField(event, "eventId", eventId);

        when(programRepository.findById(programId)).thenReturn(Optional.of(program));
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(programApplyRepository.existsByUserIdAndProgramIdAndStatusIn(eq(userId), eq(programId), any()))
                .thenReturn(false);
        when(petRepository.findByPetIdAndUserId(petId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> programApplyService.create(userId, request))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.PET_NOT_FOUND);

        verify(programApplyRepository, never()).save(any());
    }

    @Test
    void create_whenPetBelongsToUser_savesApplyWithPetId() {
        Long userId = 1L;
        Long programId = 10L;
        Long eventId = 20L;
        Long petId = 99L;

        ProgramApplyRequest request = new ProgramApplyRequest();
        ReflectionTestUtils.setField(request, "programId", programId);
        ReflectionTestUtils.setField(request, "petId", petId);

        Program program = Program.builder()
                .programId(programId)
                .eventId(eventId)
                .category(ProgramCategory.SESSION)
                .programTitle("Program")
                .description("desc")
                .startAt(LocalDateTime.now().plusDays(1))
                .endAt(LocalDateTime.now().plusDays(1).plusHours(1))
                .build();

        Event event = Event.create(
                "Event",
                "desc",
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(1),
                "Seoul",
                EventStatus.ONGOING,
                1,
                BigDecimal.ZERO
        );
        ReflectionTestUtils.setField(event, "eventId", eventId);

        when(programRepository.findById(programId)).thenReturn(Optional.of(program));
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(programApplyRepository.existsByUserIdAndProgramIdAndStatusIn(eq(userId), eq(programId), any()))
                .thenReturn(false);
        when(petRepository.findByPetIdAndUserId(petId, userId)).thenReturn(Optional.of(mock(Pet.class)));
        when(programApplyRepository.save(any(ProgramApply.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ProgramApplyResponse response = programApplyService.create(userId, request);

        assertThat(response.getPetId()).isEqualTo(petId);

        ArgumentCaptor<ProgramApply> applyCaptor = ArgumentCaptor.forClass(ProgramApply.class);
        verify(programApplyRepository).save(applyCaptor.capture());
        assertThat(applyCaptor.getValue().getPetId()).isEqualTo(petId);
        assertThat(applyCaptor.getValue().getUserId()).isEqualTo(userId);
        assertThat(applyCaptor.getValue().getProgramId()).isEqualTo(programId);
    }
}
