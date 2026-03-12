package com.popups.pupoo.board.bannedword.persistence;

import com.popups.pupoo.board.bannedword.domain.model.BoardBannedLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardBannedLogRepository extends JpaRepository<BoardBannedLog, Long> {
}
