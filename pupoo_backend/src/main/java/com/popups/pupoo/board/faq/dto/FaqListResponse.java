// file: src/main/java/com/popups/pupoo/board/faq/dto/FaqListResponse.java
package com.popups.pupoo.board.faq.dto;

public class FaqListResponse {

    private Long postId;
    private String title;
    private int viewCount;

    public FaqListResponse(Long postId, String title, int viewCount) {
        this.postId = postId;
        this.title = title;
        this.viewCount = viewCount;
    }

    public Long getPostId() { return postId; }
    public String getTitle() { return title; }
    public int getViewCount() { return viewCount; }
}
