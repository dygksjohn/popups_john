package com.popups.pupoo.notice.dto;

import java.time.LocalDateTime;

import com.popups.pupoo.notice.domain.enums.NoticePinType;
import com.popups.pupoo.notice.domain.enums.NoticeStatus;
import com.popups.pupoo.notice.domain.model.Notice;

/**
 * 공지 API 응답 DTO
 * GET /api/notices, GET /api/notices/{noticeId}
 */
public class NoticeResponse {

    private Long noticeId;
    private String title;
    private String content;
    private NoticeStatus status;
    private NoticePinType pinType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NoticeResponse from(Notice n) {
        if (n == null) return null;
        NoticeResponse r = new NoticeResponse();
        r.noticeId = n.getNoticeId();
        r.title = n.getTitle();
        r.content = n.getContent();
        r.status = n.getStatus();
        r.pinType = NoticePinType.from(n.isPinned());
        r.createdAt = n.getCreatedAt();
        r.updatedAt = n.getUpdatedAt();
        return r;
    }

    public Long getNoticeId() { return noticeId; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public NoticeStatus getStatus() { return status; }
    public NoticePinType getPinType() { return pinType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}