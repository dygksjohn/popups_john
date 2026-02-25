// file: src/main/java/com/popups/pupoo/reply/dto/ReplyResponse.java
package com.popups.pupoo.reply.dto;

import java.time.LocalDateTime;

import com.popups.pupoo.reply.domain.enums.ReplyStatus;
import com.popups.pupoo.reply.domain.enums.ReplyTargetType;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReplyResponse {

    private Long replyId;
    private ReplyTargetType targetType;
    private Long targetId;

    private Long userId;
    private String content;

    private ReplyStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
