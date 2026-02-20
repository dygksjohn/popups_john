/* file: src/main/java/com/popups/pupoo/board/review/domain/model/Review.java
 * 목적: reviews 테이블 엔티티 매핑
 * 주의:
 *  - review_status는 MySQL ENUM이므로 columnDefinition으로 DB 정합성(validate) 보장
 *  - is_deleted는 TINYINT(0/1) 컬럼이므로 columnDefinition으로 타입 정합성(validate) 보장
 *  - rating은 TINYINT 컬럼이므로 byte로 매핑 + columnDefinition 명시
 *  - content는 DB TEXT 타입이므로 columnDefinition으로 타입 정합성(validate) 보장
 */
package com.popups.pupoo.board.review.domain.model;

import com.popups.pupoo.board.review.domain.enums.ReviewStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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
}