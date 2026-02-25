// file: src/main/java/com/popups/pupoo/storage/domain/model/StoredFile.java
package com.popups.pupoo.storage.domain.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

@Getter
@Entity
@Table(name = "files")
public class StoredFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "file_id")
    private Long fileId;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "stored_name", nullable = false, length = 255, unique = true)
    private String storedName;

    /** 업로더(작성자) 사용자 ID */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "post_id")
    private Long postId;

    @Column(name = "notice_id")
    private Long noticeId;

    /** Soft delete */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by")
    private Long deletedBy;

    @Column(name = "delete_reason", length = 255)
    private String deleteReason;

    /** 지연삭제 배치가 실제 오브젝트 삭제를 완료한 시각 */
    @Column(name = "object_deleted_at")
    private LocalDateTime objectDeletedAt;

    protected StoredFile() {}

    private StoredFile(String originalName, String storedName, Long userId, Long postId, Long noticeId) {
        this.originalName = originalName;
        this.storedName = storedName;
        this.userId = userId;
        this.postId = postId;
        this.noticeId = noticeId;
    }

    public static StoredFile forPost(String originalName, String storedName, Long userId, Long postId) {
        return new StoredFile(originalName, storedName, userId, postId, null);
    }

    public static StoredFile forNotice(String originalName, String storedName, Long userId, Long noticeId) {
        return new StoredFile(originalName, storedName, userId, null, noticeId);
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public void markDeleted(Long deletedBy, String reason) {
        if (this.deletedAt != null) return; // 멱등
        this.deletedAt = LocalDateTime.now();
        this.deletedBy = deletedBy;
        this.deleteReason = reason;
    }

    public void markObjectDeleted() {
        this.objectDeletedAt = LocalDateTime.now();
    }
}
