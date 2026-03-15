// file: src/main/java/com/popups/pupoo/board/review/application/ReviewService.java
package com.popups.pupoo.board.review.application;

import com.popups.pupoo.board.bannedword.application.BannedWordService;
import com.popups.pupoo.board.bannedword.application.ModerationClient;
import com.popups.pupoo.board.bannedword.application.ModerationResult;
import com.popups.pupoo.board.bannedword.domain.enums.BannedLogContentType;
import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.persistence.BoardRepository;
import com.popups.pupoo.board.review.domain.enums.ReviewStatus;
import com.popups.pupoo.board.review.domain.model.Review;
import com.popups.pupoo.board.review.dto.*;
import com.popups.pupoo.board.review.persistence.ReviewRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.common.search.SearchType;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.user.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BoardRepository boardRepository;
    private final BannedWordService bannedWordService;
    private final ModerationClient moderationClient;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponse create(Long userId, ReviewCreateRequest request) {
        Long reviewBoardId = boardRepository.findByBoardType(BoardType.REVIEW)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "REVIEW 게시판(board_type=REVIEW)이 존재하지 않습니다."))
                .getBoardId();

        ModerationResult modResult = null;
        if (!bannedWordService.shouldSkipModeration(userId)) {
            modResult = moderationClient.moderate(request.getContent() != null ? request.getContent() : "", reviewBoardId, "POST");
            if (modResult != null && modResult.isBlock()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        modResult.getReason() != null ? modResult.getReason() : "후기 내용이 정책에 위반될 수 있어 등록할 수 없습니다.");
            }
        }

        String reviewTitle = deriveTitleFromContent(request.getContent());

        Review review = Review.builder()
                .eventId(request.getEventId())
                .userId(userId)
                .rating((byte) request.getRating().shortValue())
                .reviewTitle(reviewTitle)
                .content(request.getContent())
                .viewCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .deleted(false)
                .reviewStatus(ReviewStatus.PUBLIC)
                .build();
        Review saved = reviewRepository.save(review);
        if (modResult != null && modResult.isReview()) {
            bannedWordService.logAiModeration(reviewBoardId, saved.getReviewId(), BannedLogContentType.POST, userId, modResult);
        }
        return toResponse(saved);
    }

    @Transactional
    public ReviewResponse get(Long reviewId) {
        reviewRepository.increaseViewCount(reviewId);

        // 공개 조회 정책: PUBLIC + deleted=false만 반환한다.
        Review review = reviewRepository.findByReviewIdAndDeletedFalseAndReviewStatus(reviewId, ReviewStatus.PUBLIC)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "후기가 존재하지 않습니다."));
        return toResponse(review);
    }

    public Page<ReviewResponse> list(SearchType searchType, String keyword, int page, int size, Integer rating) {
        validatePageRequest(page, size);
        PageRequest pageable = PageRequest.of(page, size);

        if (rating != null && rating >= 1 && rating <= 5) {
            byte ratingByte = rating.byteValue();
            if (searchType == SearchType.WRITER) {
                Long writerId = parseLongOrNull(keyword);
                if (writerId == null) {
                    return reviewRepository.findByDeletedFalseAndReviewStatusAndRating(ReviewStatus.PUBLIC, ratingByte, pageable)
                            .map(this::toResponse);
                }
                return reviewRepository.searchPublicByWriter(ReviewStatus.PUBLIC, writerId, pageable)
                        .map(this::toResponse);
            }
            if (keyword == null || keyword.isBlank()) {
                return reviewRepository.findByDeletedFalseAndReviewStatusAndRating(ReviewStatus.PUBLIC, ratingByte, pageable)
                        .map(this::toResponse);
            }
            return reviewRepository.searchPublicByContentAndRating(ReviewStatus.PUBLIC, keyword, ratingByte, pageable)
                    .map(this::toResponse);
        }

        return switch (searchType) {
            case WRITER -> {
                Long writerId = parseLongOrNull(keyword);
                yield reviewRepository.searchPublicByWriter(ReviewStatus.PUBLIC, writerId, pageable).map(this::toResponse);
            }
            case CONTENT, TITLE, TITLE_CONTENT -> reviewRepository.searchPublicByContent(ReviewStatus.PUBLIC, keyword, pageable)
                    .map(this::toResponse);
        };
    }

    public Page<ReviewResponse> list(int page, int size) {
        return list(SearchType.TITLE_CONTENT, null, page, size, null);
    }

    public Page<ReviewResponse> list(SearchType searchType, String keyword, int page, int size) {
        return list(searchType, keyword, page, size, null);
    }

    private static Long parseLongOrNull(String keyword) {
        if (keyword == null || keyword.isBlank()) return null;
        try {
            return Long.parseLong(keyword.trim());
        } catch (NumberFormatException e) {
            return null;
        }
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
                .reviewTitle(review.getReviewTitle() != null ? review.getReviewTitle() : deriveTitleFromContent(request.getContent()))
                .content(request.getContent())
                .viewCount(review.getViewCount())
                .createdAt(review.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .deleted(review.isDeleted())
                .reviewStatus(review.getReviewStatus())
                .build();

        Review saved = reviewRepository.save(updated);
        return toResponse(saved);
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
    /** content 첫 줄을 제목으로 사용(최대 255자) */
    private static String deriveTitleFromContent(String content) {
        if (content == null || content.isBlank()) return "행사 후기";
        String firstLine = content.lines().map(String::trim).filter(s -> !s.isEmpty()).findFirst().orElse("행사 후기");
        return firstLine.length() > 255 ? firstLine.substring(0, 255) : firstLine;
    }

    private void validatePageRequest(int page, int size) {
        if (page < 0) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "page는 0 이상이어야 합니다.");
        }
        if (size < 1 || size > 100) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "size는 1~100 범위여야 합니다.");
        }
    }

    private ReviewResponse toResponse(Review r) {
        String eventName = eventRepository.findById(r.getEventId()).map(e -> e.getEventName()).orElse(null);
        String writerEmail = userRepository.findById(r.getUserId()).map(u -> u.getEmail()).orElse(null);
        Long reviewBoardId = boardRepository.findByBoardType(BoardType.REVIEW).map(b -> b.getBoardId()).orElse(null);
        return ReviewResponse.from(r, eventName, writerEmail, r.getReviewTitle(), r.getContent());
    }
}
