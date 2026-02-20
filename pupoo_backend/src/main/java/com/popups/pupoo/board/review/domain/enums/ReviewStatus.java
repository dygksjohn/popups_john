/* file: src/main/java/com/popups/pupoo/board/review/domain/enums/ReviewStatus.java
 * 목적: reviews.review_status(MySQL ENUM) 매핑용 후기 상태 정의
 */
package com.popups.pupoo.board.review.domain.enums;

public enum ReviewStatus {
    PUBLIC, REPORTED, BLINDED, DELETED
}
