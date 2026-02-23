// file: src/main/java/com/popups/pupoo/board/review/persistence/ReviewRepository.java
package com.popups.pupoo.board.review.persistence;

import com.popups.pupoo.board.review.domain.enums.ReviewStatus;
import com.popups.pupoo.board.review.domain.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByEventIdAndUserId(Long eventId, Long userId);

    // 공개 조회: 삭제되지 않고 PUBLIC 상태인 후기만 조회
    Optional<Review> findByReviewIdAndDeletedFalseAndReviewStatus(Long reviewId, ReviewStatus reviewStatus);

    // 공개 조회: 삭제되지 않고 PUBLIC 상태인 후기 목록 조회
    Page<Review> findByDeletedFalseAndReviewStatus(ReviewStatus reviewStatus, Pageable pageable);

    /**
     * 관리자 모더레이션 큐 조회용: 삭제/블라인드 포함 검색.
     */
    @Query("""
        select r
        from Review r
        where (:eventId is null or r.eventId = :eventId)
          and (:reviewIds is null or r.reviewId in :reviewIds)
          and (:userId is null or r.userId = :userId)
          and (:deleted is null or r.deleted = :deleted)
          and (:reviewStatus is null or r.reviewStatus = :reviewStatus)
          and (
                :keyword is null
             or :keyword = ''
             or r.content like concat('%', :keyword, '%')
          )
          and (:from is null or r.createdAt >= :from)
          and (:to is null or r.createdAt <= :to)
        """)
    Page<Review> adminSearch(@Param("eventId") Long eventId,
                             @Param("userId") Long userId,
                             @Param("reviewStatus") ReviewStatus reviewStatus,
                             @Param("deleted") Boolean deleted,
                             @Param("keyword") String keyword,
                             @Param("from") LocalDateTime from,
                             @Param("to") LocalDateTime to,
                             @Param("reviewIds") List<Long> reviewIds,
                             Pageable pageable);
}
