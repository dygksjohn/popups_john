// file: src/main/java/com/popups/pupoo/board/bannedword/persistence/BannedWordRepository.java
package com.popups.pupoo.board.bannedword.persistence;

import com.popups.pupoo.board.bannedword.domain.model.BannedWord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BannedWordRepository extends JpaRepository<BannedWord, Long> {

    List<BannedWord> findAllByBoard_BoardIdOrderByBannedWordIdAsc(Long boardId);

    List<BannedWord> findAllByOrderByBoard_BoardIdAscBannedWordIdAsc();
    
    /** 해당 게시판 전용 + 전역(board_id NULL) 금지어 모두 조회 */
    List<BannedWord> findByBoard_BoardIdOrBoardIsNullOrderByBannedWordIdAsc(Long boardId);

    Page<BannedWord> findByBoard_BoardIdOrderByBannedWordIdAsc(Long boardId, Pageable pageable);
}
