// file: src/main/java/com/popups/pupoo/board/faq/dto/FaqListResponse.java
package com.popups.pupoo.board.faq.dto;

import java.time.LocalDateTime;

public class FaqListResponse {

    private Long postId;
    private String title;
    private String contentPreview;
    private Long writerId;
    private LocalDateTime createdAt;

    public FaqListResponse(Long postId, String title, String contentPreview, Long writerId, LocalDateTime createdAt) {
        this.postId = postId;
        this.title = title;
        this.contentPreview = contentPreview;
        this.writerId = writerId;
        this.createdAt = createdAt;
    }

    public Long getPostId() { return postId; }
    public String getTitle() { return title; }
    public String getContentPreview() { return contentPreview; }
    public Long getWriterId() { return writerId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
