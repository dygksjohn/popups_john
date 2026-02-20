package com.popups.pupoo.notice.dto;

import com.popups.pupoo.notice.domain.enums.NoticeStatus;

import jakarta.validation.constraints.Size;

/**
 * 공지 수정 요청 DTO (관리자용, PATCH - 전부 선택, pupoo_v3.1)
 */
public class NoticeUpdateRequest {

    @Size(max = 20)
    private String scope;

    private Long eventId;

    @Size(max = 255)
    private String title;

    @Size(max = 1000)
    private String content;

    @Size(max = 1)
    private String fileAttached;

    private Boolean pinned;

    private NoticeStatus status;

    public NoticeUpdateRequest() {}

    public String getScope() { return scope; }
    public Long getEventId() { return eventId; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getFileAttached() { return fileAttached; }
    public Boolean getPinned() { return pinned; }
    public NoticeStatus getStatus() { return status; }

    public void setScope(String scope) { this.scope = scope; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
    public void setFileAttached(String fileAttached) { this.fileAttached = fileAttached; }
    public void setPinned(Boolean pinned) { this.pinned = pinned; }
    public void setStatus(NoticeStatus status) { this.status = status; }
}