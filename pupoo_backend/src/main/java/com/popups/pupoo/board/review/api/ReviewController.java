// file: src/main/java/com/popups/pupoo/board/review/api/ReviewController.java
package com.popups.pupoo.board.review.api;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.board.review.application.ReviewService;
import com.popups.pupoo.board.review.dto.ReviewCreateRequest;
import com.popups.pupoo.board.review.dto.ReviewResponse;
import com.popups.pupoo.board.review.dto.ReviewUpdateRequest;
import com.popups.pupoo.common.audit.application.AdminLogService;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.MessageResponse;
import com.popups.pupoo.common.search.SearchType;
import com.popups.pupoo.report.application.ReportService;
import com.popups.pupoo.report.dto.ReportCreateRequest;
import com.popups.pupoo.report.dto.ReportResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

/**
 * 후기 API.
 * - 응답: ApiResponse<T> 형태로 통일
 * - 인증 주체: SecurityUtil.currentUserId() 사용
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final SecurityUtil securityUtil;
    private final AdminLogService adminLogService;
    private final ReportService reportService;

    @PostMapping
    public ApiResponse<ReviewResponse> create(@Valid @RequestBody ReviewCreateRequest request) {
        Long userId = securityUtil.currentUserId();
        ReviewResponse created = reviewService.create(userId, request);
        writeAdminLogIfNeeded("REVIEW_CREATE", created.getReviewId());
        return ApiResponse.success(created);
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
        ReviewResponse updated = reviewService.update(userId, reviewId, request);
        writeAdminLogIfNeeded("REVIEW_UPDATE", reviewId);
        return ApiResponse.success(updated);
    }

    @DeleteMapping("/{reviewId}")
    public ApiResponse<MessageResponse> delete(@PathVariable Long reviewId) {
        Long userId = securityUtil.currentUserId();
        reviewService.delete(userId, reviewId);
        writeAdminLogIfNeeded("REVIEW_DELETE", reviewId);
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

    private void writeAdminLogIfNeeded(String action, Long reviewId) {
        if (!securityUtil.isAdmin()) {
            return;
        }
        adminLogService.write(action, AdminTargetType.REVIEW, reviewId);
    }
}
