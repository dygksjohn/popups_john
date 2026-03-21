package com.popups.pupoo.board.bannedword.dto;

import com.popups.pupoo.board.bannedword.domain.model.BoardBannedLog;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BoardBannedLogResponse {

    private final Long logId;
    private final Long boardId;
    private final Long contentId;
    private final String contentType;
    private final Long userId;
    private final String detectedWord;
    private final String filterActionTaken;
    private final Float aiScore;
    private final String ragReason;
    private final LocalDateTime createdAt;

    public static BoardBannedLogResponse from(BoardBannedLog entity) {
        return BoardBannedLogResponse.builder()
                .logId(entity.getLogId())
                .boardId(entity.getBoardId())
                .contentId(entity.getContentId())
                .contentType(entity.getContentType() != null ? entity.getContentType().name() : null)
                .userId(entity.getUserId())
                .detectedWord(entity.getDetectedWord())
                .filterActionTaken(entity.getFilterActionTaken() != null ? entity.getFilterActionTaken().name() : null)
                .aiScore(entity.getAiScore())
                .ragReason(entity.getRagReason())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
