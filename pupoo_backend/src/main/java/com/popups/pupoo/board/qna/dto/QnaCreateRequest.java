/* file: src/main/java/com/popups/pupoo/board/qna/dto/QnaCreateRequest.java
 * 목적: QnA 생성 요청 DTO
 */
package com.popups.pupoo.board.qna.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class QnaCreateRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String content;
}
