// file: src/main/java/com/popups/pupoo/board/bannedword/persistence/BannedWordRepository.java
package com.popups.pupoo.board.bannedword.persistence;

import com.popups.pupoo.board.bannedword.domain.model.BannedWord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BannedWordRepository extends JpaRepository<BannedWord, Long> {

    List<BannedWord> findAllByBoard_BoardIdOrderByBannedWordIdAsc(Long boardId);
}
