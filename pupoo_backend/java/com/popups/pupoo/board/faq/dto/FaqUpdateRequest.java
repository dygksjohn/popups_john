// file: src/main/java/com/popups/pupoo/board/faq/dto/FaqUpdateRequest.java
package com.popups.pupoo.board.faq.dto;

import jakarta.validation.constraints.NotBlank;

public class FaqUpdateRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    public String getTitle() { return title; }
    public String getContent() { return content; }
}
