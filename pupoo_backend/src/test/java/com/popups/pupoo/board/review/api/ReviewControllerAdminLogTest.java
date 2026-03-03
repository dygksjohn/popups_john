package com.popups.pupoo.board.review.api;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.board.review.application.ReviewService;
import com.popups.pupoo.board.review.dto.ReviewCreateRequest;
import com.popups.pupoo.board.review.dto.ReviewResponse;
import com.popups.pupoo.common.audit.application.AdminLogService;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.report.application.ReportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewControllerAdminLogTest {

    @Mock private ReviewService reviewService;
    @Mock private SecurityUtil securityUtil;
    @Mock private AdminLogService adminLogService;
    @Mock private ReportService reportService;

    @InjectMocks private ReviewController reviewController;

    @Test
    void create_whenAdmin_writesAdminLog() {
        ReviewCreateRequest request = new ReviewCreateRequest();
        ReflectionTestUtils.setField(request, "eventId", 1L);
        ReflectionTestUtils.setField(request, "rating", 5);
        ReflectionTestUtils.setField(request, "content", "good");

        ReviewResponse created = ReviewResponse.builder()
                .reviewId(77L)
                .eventId(1L)
                .userId(10L)
                .rating(5)
                .content("good")
                .build();

        when(securityUtil.currentUserId()).thenReturn(10L);
        when(securityUtil.isAdmin()).thenReturn(true);
        when(reviewService.create(10L, request)).thenReturn(created);

        reviewController.create(request);

        verify(adminLogService).write("REVIEW_CREATE", AdminTargetType.REVIEW, 77L);
    }

    @Test
    void create_whenNotAdmin_doesNotWriteAdminLog() {
        ReviewCreateRequest request = new ReviewCreateRequest();
        ReflectionTestUtils.setField(request, "eventId", 1L);
        ReflectionTestUtils.setField(request, "rating", 5);
        ReflectionTestUtils.setField(request, "content", "good");

        ReviewResponse created = ReviewResponse.builder()
                .reviewId(77L)
                .eventId(1L)
                .userId(10L)
                .rating(5)
                .content("good")
                .build();

        when(securityUtil.currentUserId()).thenReturn(10L);
        when(securityUtil.isAdmin()).thenReturn(false);
        when(reviewService.create(10L, request)).thenReturn(created);

        reviewController.create(request);

        verify(adminLogService, never()).write(anyString(), any(), any());
    }
}
