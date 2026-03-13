package com.popups.pupoo.board.bannedword.application;

import com.popups.pupoo.board.bannedword.domain.enums.BannedLogContentType;
import com.popups.pupoo.board.bannedword.domain.enums.BannedWordCategory;
import com.popups.pupoo.board.bannedword.domain.enums.FilterAction;
import com.popups.pupoo.board.bannedword.domain.model.BannedWord;
import com.popups.pupoo.board.bannedword.domain.model.BoardBannedLog;
import com.popups.pupoo.board.bannedword.domain.model.BoardFilterPolicy;
import com.popups.pupoo.board.bannedword.dto.BannedWordDetection;
import com.popups.pupoo.board.bannedword.persistence.BannedWordRepository;
import com.popups.pupoo.board.bannedword.persistence.BoardBannedLogRepository;
import com.popups.pupoo.board.bannedword.persistence.BoardFilterPolicyRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 금칙어 필터 서비스 (4단계: 정책·로그 연동)
 *
 * - board_filter_policy에 따라 BLOCK(저장 거부) / MASK·PASS(저장 허용, 로그 기록).
 * - 정책 미존재 시 해당 카테고리는 BLOCK.
 */
@Service
@RequiredArgsConstructor
public class BannedWordService {

    private final BannedWordRepository bannedWordRepository;
    private final BoardFilterPolicyRepository boardFilterPolicyRepository;
    private final BoardBannedLogRepository boardBannedLogRepository;

    /**
     * 게시판 단위 금칙어 검증 (정책 반영)
     *
     * @param boardId 게시판 ID
     * @param texts   검증할 텍스트(제목/내용 등)
     * @return 검출된 MASK·PASS 목록 (BLOCK 시에는 예외 발생으로 반환되지 않음)
     */
    @Transactional(readOnly = true)
    public List<BannedWordDetection> validate(Long boardId, String... texts) {
        if (boardId == null) return List.of();

        List<BannedWord> words = bannedWordRepository.findByBoard_BoardIdOrBoardIsNullOrderByBannedWordIdAsc(boardId);
        if (words.isEmpty()) return List.of();

        Map<BannedWordCategory, FilterAction> policyByCategory = boardFilterPolicyRepository
                .findAllByBoard_BoardIdOrderByCategory(boardId)
                .stream()
                .collect(Collectors.toMap(BoardFilterPolicy::getCategory, BoardFilterPolicy::getFilterAction, (a, b) -> a));

        List<BannedWordDetection> detections = new ArrayList<>();
        for (String text : texts) {
            if (text == null || text.isBlank()) continue;
            String hay = text.toLowerCase();
            for (BannedWord w : words) {
                String word = w.getBannedWord() == null ? "" : w.getBannedWord().trim();
                if (word.isBlank()) continue;
                String needle = word.toLowerCase();
                if (!hay.contains(needle)) continue;

                BannedWordCategory category = w.getCategory() != null ? w.getCategory() : BannedWordCategory.OTHER;
                FilterAction action = policyByCategory.getOrDefault(category, FilterAction.BLOCK);

                if (action == FilterAction.BLOCK) {
                    throw new BusinessException(ErrorCode.VALIDATION_FAILED, "금칙어가 포함되어 있습니다: " + word);
                }
                detections.add(BannedWordDetection.builder()
                        .detectedWord(word)
                        .category(category)
                        .filterActionTaken(action)
                        .build());
            }
        }
        return detections;
    }

    /**
     * 검증 후 저장된 콘텐츠에 대해 금칙어 적발 로그 기록
     */
    @Transactional
    public void logDetections(Long boardId, Long contentId, BannedLogContentType contentType, Long userId,
                              List<BannedWordDetection> detections) {
        if (detections == null || detections.isEmpty()) return;
        for (BannedWordDetection d : detections) {
            boardBannedLogRepository.save(BoardBannedLog.builder()
                    .boardId(boardId)
                    .contentId(contentId)
                    .contentType(contentType)
                    .userId(userId)
                    .detectedWord(d.getDetectedWord())
                    .filterActionTaken(d.getFilterActionTaken())
                    .build());
        }
    }

    /**
     * AI 모더레이션 판정 결과 로그 (REVIEW/BLOCK 시 호출)
     */
    @Transactional
    public void logAiModeration(Long boardId, Long contentId, BannedLogContentType contentType, Long userId,
                                ModerationResult result) {
        if (result == null || boardId == null || contentId == null) return;
        if (!result.isReview() && !result.isBlock()) return;
        FilterAction action = result.isBlock() ? FilterAction.BLOCK : FilterAction.REVIEW;
        String reason = result.getReason();
        if (reason != null && reason.length() > 2000) reason = reason.substring(0, 2000);
        boardBannedLogRepository.save(BoardBannedLog.builder()
                .boardId(boardId)
                .contentId(contentId)
                .contentType(contentType)
                .userId(userId)
                .detectedWord("AI")
                .filterActionTaken(action)
                .aiScore(result.getAiScore())
                .ragReason(reason)
                .build());
    }

}
