/* file: src/main/java/com/popups/pupoo/board/review/application/ReviewService.java
 * 목적: 후기 서비스
 */
package com.popups.pupoo.board.review.application;

import com.popups.pupoo.board.review.domain.enums.ReviewStatus;
import com.popups.pupoo.board.review.domain.model.Review;
import com.popups.pupoo.board.review.dto.*;
import com.popups.pupoo.board.review.persistence.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;

    @Transactional
    public ReviewResponse create(Long userId, ReviewCreateRequest request) {
        Review review = Review.builder()
                .eventId(request.getEventId())
                .userId(userId)
                .rating((byte) request.getRating().shortValue())
                .content(request.getContent())
                .viewCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .deleted(false)
                .reviewStatus(ReviewStatus.PUBLIC)
                .build();
        return toResponse(reviewRepository.save(review));
    }

    public ReviewResponse get(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("후기가 존재하지 않습니다."));
        return toResponse(review);
    }

    public Page<ReviewResponse> list(int page, int size) {
        return reviewRepository.findAll(PageRequest.of(page, size)).map(this::toResponse);
    }

    @Transactional
    public ReviewResponse update(Long userId, Long reviewId, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("후기가 존재하지 않습니다."));
        if (!review.getUserId().equals(userId)) {
            throw new SecurityException("수정 권한이 없습니다.");
        }

        Review updated = Review.builder()
                .reviewId(review.getReviewId())
                .eventId(review.getEventId())
                .userId(review.getUserId())
                .rating((byte) request.getRating().shortValue())
                .content(request.getContent())
                .viewCount(review.getViewCount())
                .createdAt(review.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .deleted(review.isDeleted())
                .reviewStatus(review.getReviewStatus())
                .build();

        return toResponse(reviewRepository.save(updated));
    }

    @Transactional
    public void delete(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("후기가 존재하지 않습니다."));
        if (!review.getUserId().equals(userId)) {
            throw new SecurityException("삭제 권한이 없습니다.");
        }

        Review deleted = Review.builder()
                .reviewId(review.getReviewId())
                .eventId(review.getEventId())
                .userId(review.getUserId())
                .rating(review.getRating())
                .content(review.getContent())
                .viewCount(review.getViewCount())
                .createdAt(review.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .deleted(true)
                .reviewStatus(ReviewStatus.DELETED)
                .build();

        reviewRepository.save(deleted);
    }

    private ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
                .reviewId(r.getReviewId())
                .eventId(r.getEventId())
                .userId(r.getUserId())
                .rating(r.getRating())
                .content(r.getContent())
                .viewCount(r.getViewCount())
                .status(r.getReviewStatus())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
