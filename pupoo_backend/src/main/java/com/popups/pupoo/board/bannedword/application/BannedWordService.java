// file: src/main/java/com/popups/pupoo/board/bannedword/application/BannedWordService.java
package com.popups.pupoo.board.bannedword.application;

import com.popups.pupoo.board.bannedword.persistence.BannedWordRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 금칙어 필터 서비스
 *
 * 정책(사용자 결정):
 * - A안: 게시글/리뷰/QnA/댓글 작성 + 수정 시 모두 금칙어 검증을 수행한다.
 * - DB가 최우선이며, 금칙어는 board_banned_words 테이블을 사용한다.
 */
@Service
@Transactional(readOnly = true)
public class BannedWordService {

    private final BannedWordRepository bannedWordRepository;

    public BannedWordService(BannedWordRepository bannedWordRepository) {
        this.bannedWordRepository = bannedWordRepository;
    }

    /**
     * 게시판 단위 금칙어 검증
     *
     * @param boardId 게시판 ID
     * @param texts   검증할 텍스트(제목/내용 등)
     */
    public void validate(Long boardId, String... texts) {
        if (boardId == null) return;

        List<String> banned = bannedWordRepository.findAllByBoard_BoardIdOrderByBannedWordIdAsc(boardId)
                .stream()
                .map(w -> w.getBannedWord() == null ? "" : w.getBannedWord().trim())
                .filter(s -> !s.isBlank())
                .toList();

        if (banned.isEmpty()) return;

        for (String text : texts) {
            if (text == null || text.isBlank()) continue;
            String hay = text.toLowerCase();
            for (String word : banned) {
                String needle = word.toLowerCase();
                if (!needle.isBlank() && hay.contains(needle)) {
                    throw new BusinessException(ErrorCode.VALIDATION_FAILED, "금칙어가 포함되어 있습니다: " + word);
                }
            }
        }
    }
}
