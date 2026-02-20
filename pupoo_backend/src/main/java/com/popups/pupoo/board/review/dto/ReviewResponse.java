/* file: src/main/java/com/popups/pupoo/board/review/dto/ReviewResponse.java
 * 목적: 후기 응답 DTO
 */
package com.popups.pupoo.board.review.dto;

import com.popups.pupoo.board.review.domain.enums.ReviewStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReviewResponse {

    private Long reviewId;
    private Long eventId;
    private Long userId;

    private int rating;
    private String content;

    private int viewCount;
    private ReviewStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
