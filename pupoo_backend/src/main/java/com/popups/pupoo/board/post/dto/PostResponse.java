// file: src/main/java/com/popups/pupoo/board/post/dto/PostResponse.java
package com.popups.pupoo.board.post.dto;

import com.popups.pupoo.board.post.domain.enums.PostStatus;
import com.popups.pupoo.board.post.domain.model.Post;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class PostResponse {
    private Long postId;
    private Long boardId;
    private Long userId;
    private String writerEmail;
    private String postTitle;
    private String content;
    private PostStatus status;
    private int viewCount;
    private boolean deleted;
    private boolean commentEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PostResponse from(Post post) {
        return from(post, null);
    }

    public static PostResponse from(Post post, String writerEmail) {
        return from(post, writerEmail, null, null);
    }

    /** 마스킹된 제목·내용으로 응답 (5단계 노출 시점 마스킹) */
    public static PostResponse from(Post post, String writerEmail, String maskedTitle, String maskedContent) {
        PostResponse r = new PostResponse();
        r.postId = post.getPostId();
        r.boardId = post.getBoard().getBoardId();
        r.userId = post.getUserId();
        r.writerEmail = writerEmail;
        r.postTitle = maskedTitle != null ? maskedTitle : post.getPostTitle();
        r.content = maskedContent != null ? maskedContent : post.getContent();
        r.status = post.getStatus();
        r.viewCount = post.getViewCount();
        r.deleted = post.isDeleted();
        r.commentEnabled = post.isCommentEnabled();
        r.createdAt = post.getCreatedAt();
        r.updatedAt = post.getUpdatedAt();
        return r;
    }
}
