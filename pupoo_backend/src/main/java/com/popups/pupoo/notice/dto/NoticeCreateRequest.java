package com.popups.pupoo.notice.dto;

import com.popups.pupoo.notice.domain.enums.NoticeStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 공지 생성 요청 DTO (관리자용, pupoo_v3.1)
 * createdByAdminId는 서비스에서 인증 정보로 설정
 */
public class NoticeCreateRequest {

    @NotBlank(message = "공지 범위(scope)는 필수입니다")
    @Size(max = 20)
    private String scope;

    private Long eventId;

    @NotBlank(message = "제목은 필수입니다")
    @Size(max = 255)
    private String title;

    @NotBlank(message = "내용은 필수입니다")
    @Size(max = 1000)
    private String content;

    /** Y 또는 N, 미지정 시 N */
    @Size(max = 1)
    private String fileAttached;

    /** 미지정 시 false(일반) */
    private Boolean pinned;

    /** 미지정 시 PUBLISHED */
    private NoticeStatus status;

    public NoticeCreateRequest() {}

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