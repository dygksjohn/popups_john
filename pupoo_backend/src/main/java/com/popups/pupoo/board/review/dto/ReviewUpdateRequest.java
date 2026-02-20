/* file: src/main/java/com/popups/pupoo/board/review/dto/ReviewUpdateRequest.java
 * 목적: 후기 수정 요청 DTO
 */
package com.popups.pupoo.board.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class ReviewUpdateRequest {

    @NotNull
    @Min(1)
    @Max(5)
    private Integer rating;

    private String content;
}
