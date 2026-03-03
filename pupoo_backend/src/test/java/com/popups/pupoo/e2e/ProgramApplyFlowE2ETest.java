package com.popups.pupoo.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.api.PageResponse;
import com.popups.pupoo.program.apply.api.ProgramApplyController;
import com.popups.pupoo.program.apply.application.ProgramApplyService;
import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;
import com.popups.pupoo.program.apply.dto.ProgramApplyResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProgramApplyController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProgramApplyFlowE2ETest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private ProgramApplyService programApplyService;
    @MockitoBean private SecurityUtil securityUtil;

    @Test
    void programApplyFlow_withPetSelection_returnsPetAwareResponse() throws Exception {
        ProgramApplyResponse created = ProgramApplyResponse.builder()
                .programApplyId(3001L)
                .programId(701L)
                .userId(11L)
                .petId(55L)
                .status(ApplyStatus.APPLIED)
                .createdAt(LocalDateTime.now())
                .build();

        ProgramApplyResponse historyItem = ProgramApplyResponse.builder()
                .programApplyId(3000L)
                .programId(700L)
                .userId(11L)
                .petId(54L)
                .status(ApplyStatus.APPROVED)
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        when(securityUtil.currentUserId()).thenReturn(11L);
        when(programApplyService.create(eq(11L), any())).thenReturn(created);
        when(programApplyService.getMyApplies(eq(11L), any()))
                .thenReturn(PageResponse.from(new PageImpl<>(List.of(historyItem))));

        mockMvc.perform(post("/api/program-applies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "programId", 701L,
                                "petId", 55L
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.programApplyId").value(3001L))
                .andExpect(jsonPath("$.data.petId").value(55L))
                .andExpect(jsonPath("$.data.status").value("APPLIED"));

        mockMvc.perform(get("/api/program-applies/my")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].programApplyId").value(3000L))
                .andExpect(jsonPath("$.data.content[0].petId").value(54L))
                .andExpect(jsonPath("$.data.content[0].status").value("APPROVED"));
    }
}

