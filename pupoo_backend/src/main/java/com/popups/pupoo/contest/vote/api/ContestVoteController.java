package com.popups.pupoo.contest.vote.api;

import org.springframework.web.bind.annotation.*;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.contest.vote.application.ContestVoteService;
import com.popups.pupoo.contest.vote.dto.ContestVoteCreateResponse;
import com.popups.pupoo.contest.vote.dto.ContestVoteRequest;
import com.popups.pupoo.contest.vote.dto.ContestVoteResultResponse;

@RestController
@RequestMapping("/api/programs/{programId}/votes")
public class ContestVoteController {

    private final ContestVoteService contestVoteService;
    private final SecurityUtil securityUtil;

    public ContestVoteController(ContestVoteService contestVoteService, SecurityUtil securityUtil) {
        this.contestVoteService = contestVoteService;
        this.securityUtil = securityUtil;
    }

    @PostMapping
    public ApiResponse<ContestVoteCreateResponse> vote(
            @PathVariable("programId") Long programId,
            @RequestBody ContestVoteRequest req
    ) {
    	Long userId = securityUtil.currentUserId(); // ✅ 투표: 로그인 필요
        return ApiResponse.success(contestVoteService.vote(programId, userId, req));
    }

    @DeleteMapping
    public ApiResponse<Void> cancel(
            @PathVariable("programId") Long programId
    ) {
    	Long userId = securityUtil.currentUserId(); // ✅ 취소: 로그인 필요
        contestVoteService.cancel(programId, userId);
        return ApiResponse.success(null);
    }

    /**
     * ✅ 결과: 비로그인 허용
     * 최종 URL: GET /api/programs/{programId}/votes/result
     */
    @GetMapping("/result")
    public ApiResponse<ContestVoteResultResponse> result(
            @PathVariable("programId") Long programId
    ) {
    	// ✅ 로그인 요구하면 안 됨 (공개)
        return ApiResponse.success(contestVoteService.resultPublic(programId));
    }

}
