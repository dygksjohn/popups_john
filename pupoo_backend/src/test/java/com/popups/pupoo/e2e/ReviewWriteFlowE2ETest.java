package com.popups.pupoo.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.board.review.api.ReviewController;
import com.popups.pupoo.board.review.application.ReviewService;
import com.popups.pupoo.board.review.domain.enums.ReviewStatus;
import com.popups.pupoo.board.review.dto.ReviewResponse;
import com.popups.pupoo.common.audit.application.AdminLogService;
import com.popups.pupoo.report.application.ReportService;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReviewController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReviewWriteFlowE2ETest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private ReviewService reviewService;
    @MockitoBean private SecurityUtil securityUtil;
    @MockitoBean private AdminLogService adminLogService;
    @MockitoBean private ReportService reportService;

    @Test
    void reviewWriteAndListFlow_returnsPublishedReview() throws Exception {
        ReviewResponse created = ReviewResponse.builder()
                .reviewId(9001L)
                .eventId(100L)
                .userId(77L)
                .rating(5)
                .content("정말 만족한 행사였습니다.")
                .viewCount(0)
                .status(ReviewStatus.PUBLIC)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(securityUtil.currentUserId()).thenReturn(77L);
        when(securityUtil.isAdmin()).thenReturn(false);
        when(reviewService.create(eq(77L), any())).thenReturn(created);
        when(reviewService.list(any(), any(), eq(0), eq(3)))
                .thenReturn(new PageImpl<>(List.of(created)));

        mockMvc.perform(post("/api/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventId", 100L,
                                "rating", 5,
                                "content", "정말 만족한 행사였습니다."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reviewId").value(9001L))
                .andExpect(jsonPath("$.data.status").value("PUBLIC"))
                .andExpect(jsonPath("$.data.rating").value(5));

        mockMvc.perform(get("/api/reviews")
                        .param("page", "0")
                        .param("size", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].reviewId").value(9001L))
                .andExpect(jsonPath("$.data.content[0].content").value("정말 만족한 행사였습니다."));

        verify(adminLogService, never()).write(any(), any(), any());
    }
}

