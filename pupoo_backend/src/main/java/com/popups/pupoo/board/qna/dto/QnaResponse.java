// file: src/main/java/com/popups/pupoo/board/qna/dto/QnaResponse.java
package com.popups.pupoo.board.qna.dto;

import com.popups.pupoo.board.qna.domain.enums.QnaStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class QnaResponse {

    private Long qnaId;
    private Long boardId;
    private Long userId;

    private String title;
    private String content;

    
    private String answerContent;

    private LocalDateTime answeredAt;

private QnaStatus status;

    private int viewCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
