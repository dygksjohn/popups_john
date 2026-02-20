package com.popups.pupoo.notice.domain.model;

import java.time.LocalDateTime;

import com.popups.pupoo.notice.domain.enums.NoticeFileAttached;
import com.popups.pupoo.notice.domain.enums.NoticeStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * 공지 엔티티 (pupoo_v3.1 notices 테이블)
 * API: GET /api/notices, GET /api/notices/{noticeId}
 */
@Entity
@Table(name = "notices")
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notice_id")
    private Long noticeId;

    @Column(name = "scope", nullable = false, length = 20)
    private String scope;

    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "notice_title", nullable = false, length = 255)
    private String title;

    @Column(name = "content", nullable = false, length = 1000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_attached", nullable = false, length = 1)
    private NoticeFileAttached fileAttached;

    @Column(name = "is_pinned", nullable = false, columnDefinition = "TINYINT(1)")
    private boolean pinned;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private NoticeStatus status;

    @Column(name = "created_by_admin_id", nullable = false)
    private Long createdByAdminId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Notice() {
        // JPA
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) this.createdAt = now;
        if (this.updatedAt == null) this.updatedAt = now;
        if (this.status == null) this.status = NoticeStatus.PUBLISHED;
        if (this.fileAttached == null) this.fileAttached = NoticeFileAttached.N;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 공지 생성용 정적 팩토리 (관리자 서비스에서 사용)
     */
    public static Notice create(String scope, Long eventId, String title, String content,
                               String fileAttached, boolean pinned, NoticeStatus status, Long createdByAdminId) {
        Notice n = new Notice();
        n.setScope(scope);
        n.setEventId(eventId);
        n.setTitle(title);
        n.setContent(content);
        n.setFileAttached(fileAttached != null ? fileAttached : "N");
        n.setPinned(pinned);
        n.setStatus(status != null ? status : NoticeStatus.PUBLISHED);
        n.setCreatedByAdminId(createdByAdminId);
        return n;
    }

    // Getters
    public Long getNoticeId() { return noticeId; }
    public String getScope() { return scope; }
    public Long getEventId() { return eventId; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public NoticeFileAttached getFileAttached() { return fileAttached; }
    public boolean isPinned() { return pinned; }
    public NoticeStatus getStatus() { return status; }
    public Long getCreatedByAdminId() { return createdByAdminId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters (서비스/관리자 수정용)
    public void setScope(String scope) { this.scope = scope; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
    
	public void setFileAttached(String fileAttached) {
		this.fileAttached = (fileAttached != null && "Y".equalsIgnoreCase(fileAttached)) ? NoticeFileAttached.Y
				: NoticeFileAttached.N;}
    public void setPinned(boolean pinned) { this.pinned = pinned; }
    public void setStatus(NoticeStatus status) { this.status = status; }
    public void setCreatedByAdminId(Long createdByAdminId) { this.createdByAdminId = createdByAdminId; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}