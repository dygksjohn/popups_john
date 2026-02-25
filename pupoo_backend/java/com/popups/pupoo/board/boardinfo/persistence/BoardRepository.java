// file: src/main/java/com/popups/pupoo/board/boardinfo/persistence/BoardRepository.java
package com.popups.pupoo.board.boardinfo.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.domain.model.Board;

public interface BoardRepository extends JpaRepository<Board, Long> {

    Optional<Board> findByBoardType(BoardType boardType);

    boolean existsByBoardType(BoardType boardType);

    List<Board> findAllByActiveTrueOrderByBoardIdAsc();

    List<Board> findAllByOrderByBoardIdAsc();
}
