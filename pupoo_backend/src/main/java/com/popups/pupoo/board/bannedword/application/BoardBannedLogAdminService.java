package com.popups.pupoo.board.bannedword.application;

import com.popups.pupoo.board.bannedword.dto.BoardBannedLogResponse;
import com.popups.pupoo.board.bannedword.persistence.BoardBannedLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardBannedLogAdminService {

    private final BoardBannedLogRepository boardBannedLogRepository;

    public Page<BoardBannedLogResponse> list(Long boardId, Pageable pageable) {
        if (boardId != null) {
            return boardBannedLogRepository.findAllByBoardIdOrderByLogIdDesc(boardId, pageable)
                    .map(BoardBannedLogResponse::from);
        }
        return boardBannedLogRepository.findAllByOrderByLogIdDesc(pageable)
                .map(BoardBannedLogResponse::from);
    }
}
