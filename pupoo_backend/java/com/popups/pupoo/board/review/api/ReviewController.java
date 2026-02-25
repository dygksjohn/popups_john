// file: src/main/java/com/popups/pupoo/board/review/api/ReviewController.java
package com.popups.pupoo.board.review.api;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.board.review.application.ReviewService;
import com.popups.pupoo.board.review.dto.ReviewCreateRequest;
import com.popups.pupoo.board.review.dto.ReviewResponse;
import com.popups.pupoo.board.review.dto.ReviewUpdateRequest;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.MessageResponse;
import com.popups.pupoo.common.search.SearchType;
import com.popups.pupoo.report.application.ReportService;
import com.popups.pupoo.report.dto.ReportCreateRequest;
import com.popups.pupoo.report.dto.ReportResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 후기 API.
 * - 정책: ApiResponse<T> 통일
 * - 정책: 인증 주체는 SecurityUtil에서 userId를 읽는다.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final SecurityUtil securityUtil;
    private final ReportService reportService;

    @PostMapping
    public ApiResponse<ReviewResponse> create(@Valid @RequestBody ReviewCreateRequest request) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(reviewService.create(userId, request));
    }

    @GetMapping("/{reviewId}")
    public ApiResponse<ReviewResponse> get(@PathVariable Long reviewId) {
        return ApiResponse.success(reviewService.get(reviewId));
    }

    @GetMapping
    public ApiResponse<Page<ReviewResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size,
                                                  @RequestParam(required = false) String searchType,
                                                  @RequestParam(required = false) String keyword) {
        return ApiResponse.success(reviewService.list(SearchType.from(searchType), keyword, page, size));
    }

    @PatchMapping("/{reviewId}")
    public ApiResponse<ReviewResponse> update(@PathVariable Long reviewId,
                                              @Valid @RequestBody ReviewUpdateRequest request) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(reviewService.update(userId, reviewId, request));
    }

    @DeleteMapping("/{reviewId}")
    public ApiResponse<MessageResponse> delete(@PathVariable Long reviewId) {
        Long userId = securityUtil.currentUserId();
        reviewService.delete(userId, reviewId);
        return ApiResponse.success(new MessageResponse("삭제 완료"));
    }

    /**
     * 후기 신고(사용자).
     */
    @PostMapping("/{reviewId}/report")
    public ApiResponse<ReportResponse> report(@PathVariable Long reviewId,
                                              @Valid @RequestBody ReportCreateRequest req) {
        return ApiResponse.success(reportService.reportReview(reviewId, req.getReasonCode(), req.getReasonDetail()));
    }
}
