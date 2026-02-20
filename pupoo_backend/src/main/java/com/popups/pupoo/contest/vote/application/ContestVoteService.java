package com.popups.pupoo.contest.vote.application;

import java.time.LocalDateTime;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.popups.pupoo.contest.vote.domain.enums.VoteStatus;
import com.popups.pupoo.contest.vote.domain.model.ContestVote;
import com.popups.pupoo.contest.vote.dto.ContestVoteCreateResponse;
import com.popups.pupoo.contest.vote.dto.ContestVoteRequest;
import com.popups.pupoo.contest.vote.dto.ContestVoteResultResponse;
import com.popups.pupoo.contest.vote.persistence.ContestVoteRepository;
import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;   //  추가
import com.popups.pupoo.program.apply.domain.model.ProgramApply;
import com.popups.pupoo.program.apply.persistence.ProgramApplyRepository;
import com.popups.pupoo.program.domain.enums.ProgramCategory;
import com.popups.pupoo.program.persistence.ProgramRepository;

@Service
public class ContestVoteService {

    private final ContestVoteRepository voteRepository;
    private final ProgramRepository programRepository;
    private final ProgramApplyRepository programApplyRepository;

    public ContestVoteService(
            ContestVoteRepository voteRepository,
            ProgramRepository programRepository,
            ProgramApplyRepository programApplyRepository
    ) {
        this.voteRepository = voteRepository;
        this.programRepository = programRepository;
        this.programApplyRepository = programApplyRepository;
    }

    @Transactional
    public ContestVoteCreateResponse vote(Long programId, Long userId, ContestVoteRequest req) {

        var program = programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException("PROGRAM_NOT_FOUND"));

        if (program.getCategory() != ProgramCategory.CONTEST) {
            throw new IllegalArgumentException("PROGRAM_NOT_CONTEST");
        }

        validateVotePeriod(program.getStartAt(), program.getEndAt());

        ProgramApply apply = programApplyRepository.findById(req.programApplyId())
                .orElseThrow(() -> new IllegalArgumentException("PROGRAM_APPLY_NOT_FOUND"));

        // 1️⃣ 해당 프로그램 소속 참가자인지
        if (!apply.getProgramId().equals(programId)) {
            throw new IllegalArgumentException("PROGRAM_APPLY_NOT_MATCHED");
        }

        // 2️⃣ APPROVED 상태만 투표 허용 (강력 추천)
        if (apply.getStatus() != ApplyStatus.APPROVED) {
            throw new IllegalArgumentException("INVALID_VOTE_TARGET");
        }

        // 3️⃣ 자기 자신에게 투표 금지 (정책 선택)
        if (apply.getUserId().equals(userId)) {
            throw new IllegalArgumentException("CANNOT_VOTE_SELF");
        }

        try {
            ContestVote saved =
                    voteRepository.save(new ContestVote(programId, req.programApplyId(), userId));

            return new ContestVoteCreateResponse(
                    saved.getVoteId(),
                    saved.getProgramId(),
                    saved.getProgramApplyId(),
                    saved.getVotedAt()
            );

        } catch (DataIntegrityViolationException e) {
            // UNIQUE(program_id, user_id, active_flag) 충돌
            throw new IllegalStateException("ALREADY_VOTED");
        }
    }


    @Transactional
    public void cancel(Long programId, Long userId) {
        var program = programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException("PROGRAM_NOT_FOUND"));

        if (program.getCategory() != ProgramCategory.CONTEST) {
            throw new IllegalArgumentException("PROGRAM_NOT_CONTEST");
        }

        // 정책:
        // - 현재는 "투표 기간 내에서만 취소 가능"으로 유지
        // - 운영상 필요하면 이 체크를 제거하고 관리자만 취소 허용 등으로 확장
        validateVotePeriod(program.getStartAt(), program.getEndAt());

        int updated = voteRepository.cancelActiveVote(programId, userId);
        if (updated == 0) {
            throw new IllegalArgumentException("VOTE_NOT_FOUND");
        }
    }

    @Transactional(readOnly = true)
    public ContestVoteResultResponse result(Long programId, Long userId) {
        var program = programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException("PROGRAM_NOT_FOUND"));
        if (program.getCategory() != ProgramCategory.CONTEST) {
            throw new IllegalArgumentException("PROGRAM_NOT_CONTEST");
        }

        long total = voteRepository.countActiveVotes(programId);

        var items = voteRepository.countActiveVotesByProgramApply(programId).stream()
                .map(v -> new ContestVoteResultResponse.Item(v.getProgramApplyId(), v.getVoteCount()))
                .toList();

        Long myProgramApplyId = voteRepository
                .findFirstByProgramIdAndUserIdAndStatus(programId, userId, VoteStatus.ACTIVE)
                .map(ContestVote::getProgramApplyId)
                .orElse(null);

        return new ContestVoteResultResponse(programId, total, items, myProgramApplyId);
    }


    private void validateVotePeriod(LocalDateTime startAt, LocalDateTime endAt) {
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(startAt) || now.isAfter(endAt)) {
            throw new IllegalStateException("VOTE_PERIOD_CLOSED");
        }
    }
}
