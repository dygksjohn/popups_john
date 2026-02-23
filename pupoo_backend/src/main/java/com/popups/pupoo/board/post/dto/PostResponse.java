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
    private String postTitle;
    private String content;
    private PostStatus status;
    private int viewCount;
    private boolean deleted;
    private boolean commentEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PostResponse from(Post post) {
        PostResponse r = new PostResponse();
        r.postId = post.getPostId();
        r.boardId = post.getBoard().getBoardId();
        r.userId = post.getUserId();
        r.postTitle = post.getPostTitle();
        r.content = post.getContent();
        r.status = post.getStatus();
        r.viewCount = post.getViewCount();
        r.deleted = post.isDeleted();
        r.commentEnabled = post.isCommentEnabled();
        r.createdAt = post.getCreatedAt();
        r.updatedAt = post.getUpdatedAt();
        return r;
    }
}
