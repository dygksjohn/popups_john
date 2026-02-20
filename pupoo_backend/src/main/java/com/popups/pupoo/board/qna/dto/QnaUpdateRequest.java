/* file: src/main/java/com/popups/pupoo/board/qna/dto/QnaUpdateRequest.java
 * 목적: QnA 수정 요청 DTO
 */
package com.popups.pupoo.board.qna.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class QnaUpdateRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String content;
}
