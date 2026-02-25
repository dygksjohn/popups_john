// file: src/main/java/com/popups/pupoo/board/review/domain/model/Review.java
package com.popups.pupoo.board.review.domain.model;

import java.time.LocalDateTime;

import com.popups.pupoo.board.review.domain.enums.ReviewStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reviews")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(toBuilder = true)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id", nullable = false)
    private Long reviewId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // ✅ DB: TINYINT → Java: byte
    @Column(name = "rating", nullable = false, columnDefinition = "TINYINT")
    private byte rating;

    // ✅ DB: TEXT → TEXT로 고정 (validate 안정)
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "view_count", nullable = false)
    private int viewCount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ✅ DB: TINYINT(1)
    @Column(name = "is_deleted", nullable = false, columnDefinition = "TINYINT(1)")
    private boolean deleted;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "review_status",
            nullable = false,
            columnDefinition = "ENUM('PUBLIC','REPORTED','BLINDED','DELETED')"
    )
    private ReviewStatus reviewStatus;

    /**
     * 관리자 모더레이션: 블라인드 처리.
     */
    public void blind() {
        this.reviewStatus = ReviewStatus.BLINDED;
    }

    /**
     * 사용자 신고 접수.
     * - 정책: 신고 접수 시 PUBLIC -> REPORTED로 전환(이미 BLINDED/DELETED면 변경하지 않음)
     */
    public void report() {
        if (this.deleted) return;
        if (this.reviewStatus == ReviewStatus.BLINDED || this.reviewStatus == ReviewStatus.DELETED) return;
        this.reviewStatus = ReviewStatus.REPORTED;
    }

    /**
     * 관리자 모더레이션: 복구 처리.
     */
    public void restore() {
        this.deleted = false;
        this.reviewStatus = ReviewStatus.PUBLIC;
    }

    /**
     * 관리자 모더레이션: soft delete.
     */
    public void softDelete() {
        this.deleted = true;
        this.reviewStatus = ReviewStatus.DELETED;
    }
}
