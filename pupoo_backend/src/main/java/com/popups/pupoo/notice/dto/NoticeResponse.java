/* file: src/main/java/com/popups/pupoo/notice/dto/NoticeResponse.java
 * 목적: 공지 응답 DTO
 */
package com.popups.pupoo.notice.dto;

import com.popups.pupoo.notice.domain.enums.NoticeStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NoticeResponse {

    private Long noticeId;
    private String scope;
    private Long eventId;

    private String title;
    private String content;

    private boolean pinned;
    private NoticeStatus status;

    private Long createdByAdminId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
