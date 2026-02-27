// file: src/main/java/com/popups/pupoo/board/faq/dto/FaqListResponse.java
package com.popups.pupoo.board.faq.dto;

public class FaqListResponse {

    private Long postId;
    private String title;

    public FaqListResponse(Long postId, String title) {
        this.postId = postId;
        this.title = title;
    }

    public Long getPostId() { return postId; }
    public String getTitle() { return title; }
}
