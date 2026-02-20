package com.popups.pupoo.board.post.domain.model;

import com.popups.pupoo.board.boardinfo.domain.model.Board;
import com.popups.pupoo.board.post.domain.enums.PostStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(toBuilder = true)
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id", nullable = false)
    private Long postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "post_title", nullable = false, length = 255)
    private String postTitle;

    // ✅ validate 정합성: DB가 TEXT면 여기서 TEXT로 고정하는 게 가장 안전
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "file_attached", nullable = false, columnDefinition = "ENUM('Y','N')")
    private String fileAttached; // 'Y' 또는 'N'

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "ENUM('DRAFT','PUBLISHED','HIDDEN')")
    private PostStatus status;

    @Column(name = "view_count", nullable = false)
    private int viewCount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false, columnDefinition = "TINYINT(1)")
    private boolean deleted;

    @Column(name = "is_comment_enabled", nullable = false, columnDefinition = "TINYINT(1)")
    private boolean commentEnabled;

    public Post updateTitleAndContent(String title, String content) {
        return this.toBuilder()
                .postTitle(title)
                .content(content)
                .build();
    }

    public Post markDeleted() {
        return this.toBuilder()
                .deleted(true)
                .build();
    }

    public Post close() {
        return this.toBuilder()
                .status(PostStatus.HIDDEN)
                .build();
    }
}