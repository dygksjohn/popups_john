// file: src/main/java/com/popups/pupoo/board/review/application/ReviewService.java
package com.popups.pupoo.board.review.application;

import com.popups.pupoo.board.bannedword.application.BannedWordService;
import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.persistence.BoardRepository;
import com.popups.pupoo.board.review.domain.enums.ReviewStatus;
import com.popups.pupoo.board.review.domain.model.Review;
import com.popups.pupoo.board.review.dto.*;
import com.popups.pupoo.board.review.persistence.ReviewRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
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
    private final BoardRepository boardRepository;
    private final BannedWordService bannedWordService;

    @Transactional
    public ReviewResponse create(Long userId, ReviewCreateRequest request) {
        Long reviewBoardId = boardRepository.findByBoardType(BoardType.REVIEW)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "REVIEW 게시판(board_type=REVIEW)이 존재하지 않습니다."))
                .getBoardId();

        // 금칙어 검증 (리뷰 작성 포함)
        bannedWordService.validate(reviewBoardId, request.getContent());

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
        // 공개 조회 정책: PUBLIC + deleted=false만 반환한다.
        Review review = reviewRepository.findByReviewIdAndDeletedFalseAndReviewStatus(reviewId, ReviewStatus.PUBLIC)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "후기가 존재하지 않습니다."));
        return toResponse(review);
    }

    public Page<ReviewResponse> list(int page, int size) {
        // 공개 조회 정책: PUBLIC + deleted=false만 반환한다.
        validatePageRequest(page, size);
        return reviewRepository.findByDeletedFalseAndReviewStatus(ReviewStatus.PUBLIC, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Transactional
    public ReviewResponse update(Long userId, Long reviewId, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("후기가 존재하지 않습니다."));
        if (!review.getUserId().equals(userId)) {
            throw new SecurityException("수정 권한이 없습니다.");
        }

        Long reviewBoardId = boardRepository.findByBoardType(BoardType.REVIEW)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "REVIEW 게시판(board_type=REVIEW)이 존재하지 않습니다."))
                .getBoardId();

        // 금칙어 검증 (리뷰 수정 포함)
        bannedWordService.validate(reviewBoardId, request.getContent());

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

    /**
     * 페이징 파라미터 검증
     * - page는 0 이상
     * - size는 1~100 범위
     */
    private void validatePageRequest(int page, int size) {
        if (page < 0) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "page는 0 이상이어야 합니다.");
        }
        if (size < 1 || size > 100) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "size는 1~100 범위여야 합니다.");
        }
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
