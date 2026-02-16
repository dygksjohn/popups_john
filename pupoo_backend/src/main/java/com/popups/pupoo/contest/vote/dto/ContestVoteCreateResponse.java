package com.popups.pupoo.contest.vote.dto;

import java.time.LocalDateTime;

public record ContestVoteCreateResponse(
        Long voteId,
        Long programId,
        Long programApplyId,
        LocalDateTime votedAt
) {}
