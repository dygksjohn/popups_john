// file: src/main/java/com/popups/pupoo/reply/domain/model/PostComment.java
package com.popups.pupoo.reply.domain.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "post_comments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(toBuilder = true)
public class PostComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_id", nullable = false)
    private Long commentId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "content", nullable = false, length = 1000)
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false, columnDefinition = "TINYINT")
    private boolean deleted;

    public PostComment updateContent(String content, LocalDateTime now) {
        return this.toBuilder()
                .content(content)
                .updatedAt(now)
                .build();
    }

    public PostComment markDeleted(LocalDateTime now) {
        return this.toBuilder()
                .deleted(true)
                .updatedAt(now)
                .build();
    }

    /**
     * 관리자 모더레이션: 복구(soft delete 해제)
     */
    public PostComment restore(LocalDateTime now) {
        return this.toBuilder()
                .deleted(false)
                .updatedAt(now)
                .build();
    }
}
