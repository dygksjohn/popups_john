/* file: src/main/java/com/popups/pupoo/board/boardinfo/persistence/BoardRepository.java
 * 목적: boards 접근(JPA)
 */
package com.popups.pupoo.board.boardinfo.persistence;

import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.domain.model.Board;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BoardRepository extends JpaRepository<Board, Long> {
    Optional<Board> findByBoardType(BoardType boardType);
}
