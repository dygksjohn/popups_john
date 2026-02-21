// file: src/main/java/com/popups/pupoo/contest/vote/application/ContestVoteService.java
package com.popups.pupoo.contest.vote.application;

import java.time.LocalDateTime;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;

import com.popups.pupoo.contest.vote.domain.enums.VoteStatus;
import com.popups.pupoo.contest.vote.domain.model.ContestVote;
import com.popups.pupoo.contest.vote.dto.ContestVoteCreateResponse;
import com.popups.pupoo.contest.vote.dto.ContestVoteRequest;
import com.popups.pupoo.contest.vote.dto.ContestVoteResultResponse;
import com.popups.pupoo.contest.vote.persistence.ContestVoteRepository;

import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;
import com.popups.pupoo.program.apply.domain.model.ProgramApply;
import com.popups.pupoo.program.apply.persistence.ProgramApplyRepository;

import com.popups.pupoo.program.domain.enums.ProgramCategory;
import com.popups.pupoo.program.domain.model.Program;
import com.popups.pupoo.program.persistence.ProgramRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContestVoteService {

    private final ContestVoteRepository voteRepository;
    private final ProgramRepository programRepository;
    private final ProgramApplyRepository programApplyRepository;

    @Transactional
    public ContestVoteCreateResponse vote(Long programId, Long userId, ContestVoteRequest req) {

        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_NOT_FOUND));

        if (program.getCategory() != ProgramCategory.CONTEST) {
            throw new BusinessException(ErrorCode.PROGRAM_NOT_CONTEST);
        }

        validateVotePeriod(program.getStartAt(), program.getEndAt());

        ProgramApply apply = programApplyRepository.findById(req.programApplyId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_APPLY_NOT_FOUND));

        if (!apply.getProgramId().equals(programId)) {
            throw new BusinessException(ErrorCode.PROGRAM_APPLY_NOT_MATCHED);
        }

        // ✅ 승인된 후보만 투표 대상이 될 수 있음
        if (apply.getStatus() != ApplyStatus.APPROVED) {
            throw new BusinessException(ErrorCode.INVALID_VOTE_TARGET);
        }

        // ✅ 본인에게 투표 금지
        if (apply.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.CANNOT_VOTE_SELF);
        }

        try {
            ContestVote saved = voteRepository.save(
                    new ContestVote(programId, req.programApplyId(), userId)
            );

            return new ContestVoteCreateResponse(
                    saved.getVoteId(),
                    saved.getProgramId(),
                    saved.getProgramApplyId(),
                    saved.getVotedAt()
            );

        } catch (DataIntegrityViolationException e) {
            // UNIQUE(program_id, user_id, active_flag) 등 중복 투표 제약 충돌
            throw new BusinessException(ErrorCode.ALREADY_VOTED);
        }
    }

    @Transactional
    public void cancel(Long programId, Long userId) {

        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_NOT_FOUND));

        if (program.getCategory() != ProgramCategory.CONTEST) {
            throw new BusinessException(ErrorCode.PROGRAM_NOT_CONTEST);
        }

        validateVotePeriod(program.getStartAt(), program.getEndAt());

        int updated = voteRepository.cancelActiveVote(programId, userId);
        if (updated == 0) {
            throw new BusinessException(ErrorCode.VOTE_NOT_FOUND);
        }
    }

    @Transactional(readOnly = true)
    public ContestVoteResultResponse result(Long programId, Long userId) {

        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_NOT_FOUND));

        if (program.getCategory() != ProgramCategory.CONTEST) {
            throw new BusinessException(ErrorCode.PROGRAM_NOT_CONTEST);
        }

        long total = voteRepository.countActiveVotes(programId);

        var items = voteRepository.countActiveVotesByProgramApply(programId).stream()
                .map(v -> new ContestVoteResultResponse.Item(
                        v.getProgramApplyId(),
                        v.getVoteCount()
                ))
                .toList();

        Long myProgramApplyId = voteRepository
                .findFirstByProgramIdAndUserIdAndStatus(programId, userId, VoteStatus.ACTIVE)
                .map(ContestVote::getProgramApplyId)
                .orElse(null);

        return new ContestVoteResultResponse(programId, total, items, myProgramApplyId);
    }

    /**
     * 비로그인/공개 조회용 결과(내 투표는 null)
     */
    @Transactional(readOnly = true)
    public ContestVoteResultResponse resultPublic(Long programId) {

        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_NOT_FOUND));

        if (program.getCategory() != ProgramCategory.CONTEST) {
            throw new BusinessException(ErrorCode.PROGRAM_NOT_CONTEST);
        }

        long total = voteRepository.countActiveVotes(programId);

        var items = voteRepository.countActiveVotesByProgramApply(programId).stream()
                .map(v -> new ContestVoteResultResponse.Item(
                        v.getProgramApplyId(),
                        v.getVoteCount()
                ))
                .toList();

        return new ContestVoteResultResponse(programId, total, items, null);
    }

    private void validateVotePeriod(LocalDateTime startAt, LocalDateTime endAt) {
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(startAt) || now.isAfter(endAt)) {
            throw new BusinessException(ErrorCode.VOTE_PERIOD_CLOSED);
        }
    }
}