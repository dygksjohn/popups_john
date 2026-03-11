// file: src/main/java/com/popups/pupoo/board/review/dto/ReviewResponse.java
package com.popups.pupoo.board.review.dto;

import com.popups.pupoo.board.review.domain.model.Review;
import com.popups.pupoo.board.review.domain.enums.ReviewStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReviewResponse {

    private Long reviewId;
    private Long eventId;
    private String eventName;
    private Long userId;
    private String writerEmail;

    private int rating;
    private String reviewTitle;
    private String content;

    private int viewCount;
    private ReviewStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse from(Review review) {
        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .eventId(review.getEventId())
                .userId(review.getUserId())
                .rating(review.getRating())
                .reviewTitle(review.getReviewTitle())
                .content(review.getContent())
                .viewCount(review.getViewCount())
                .status(review.getReviewStatus())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    public static ReviewResponse from(Review review, String eventName, String writerEmail) {
        return from(review, eventName, writerEmail, null, null);
    }

    /** 마스킹된 제목·내용으로 응답 (5단계 노출 시점 마스킹) */
    public static ReviewResponse from(Review review, String eventName, String writerEmail, String maskedTitle, String maskedContent) {
        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .eventId(review.getEventId())
                .eventName(eventName)
                .userId(review.getUserId())
                .writerEmail(writerEmail)
                .rating(review.getRating())
                .reviewTitle(maskedTitle != null ? maskedTitle : review.getReviewTitle())
                .content(maskedContent != null ? maskedContent : review.getContent())
                .viewCount(review.getViewCount())
                .status(review.getReviewStatus())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
