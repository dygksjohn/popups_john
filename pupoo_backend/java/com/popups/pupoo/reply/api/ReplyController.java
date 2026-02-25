// file: src/main/java/com/popups/pupoo/reply/api/ReplyController.java
package com.popups.pupoo.reply.api;

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
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.IdResponse;
import com.popups.pupoo.reply.application.ReplyService;
import com.popups.pupoo.reply.domain.enums.ReplyTargetType;
import com.popups.pupoo.reply.dto.ReplyCreateRequest;
import com.popups.pupoo.reply.dto.ReplyResponse;
import com.popups.pupoo.reply.dto.ReplyUpdateRequest;
import com.popups.pupoo.report.application.ReportService;
import com.popups.pupoo.report.dto.ReportCreateRequest;
import com.popups.pupoo.report.dto.ReportResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/replies")
public class ReplyController {

    private final ReplyService replyService;
    private final SecurityUtil securityUtil;
    private final ReportService reportService;

    public ReplyController(ReplyService replyService, SecurityUtil securityUtil, ReportService reportService) {
        this.replyService = replyService;
        this.securityUtil = securityUtil;
        this.reportService = reportService;
    }

    /**
     * 댓글 생성
     */
    @PostMapping
    public ApiResponse<ReplyResponse> create(@Valid @RequestBody ReplyCreateRequest request) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(replyService.create(userId, request));
    }

    /**
     * 댓글 목록 조회
     */
    @GetMapping
    public ApiResponse<Page<ReplyResponse>> list(@RequestParam ReplyTargetType targetType,
                                                @RequestParam Long targetId,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(replyService.list(targetType, targetId, page, size));
    }

    /**
     * 댓글 수정
     */
    @PatchMapping("/{replyId}")
    public ApiResponse<ReplyResponse> update(@PathVariable Long replyId,
                                            @RequestParam ReplyTargetType targetType,
                                            @Valid @RequestBody ReplyUpdateRequest request) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(replyService.update(userId, targetType, replyId, request));
    }

    /**
     * 댓글 삭제 (소프트 삭제)
     */
    @DeleteMapping("/{replyId}")
    public ApiResponse<IdResponse> delete(@PathVariable Long replyId,
                                    @RequestParam ReplyTargetType targetType) {
        Long userId = securityUtil.currentUserId();
        replyService.delete(userId, targetType, replyId);
        return ApiResponse.success(new IdResponse(replyId));
    }

    /**
     * 댓글 신고(사용자).
     */
    @PostMapping("/{targetType}/{replyId}/report")
    public ApiResponse<ReportResponse> report(@PathVariable ReplyTargetType targetType,
                                              @PathVariable Long replyId,
                                              @Valid @RequestBody ReportCreateRequest req) {
        if (targetType == ReplyTargetType.POST) {
            return ApiResponse.success(reportService.reportPostComment(replyId, req.getReasonCode(), req.getReasonDetail()));
        }
        return ApiResponse.success(reportService.reportReviewComment(replyId, req.getReasonCode(), req.getReasonDetail()));
    }
}
