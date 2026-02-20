/* file: src/main/java/com/popups/pupoo/board/review/persistence/ReviewRepository.java
 * 목적: reviews 접근(JPA)
 */
package com.popups.pupoo.board.review.persistence;

import com.popups.pupoo.board.review.domain.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByEventIdAndUserId(Long eventId, Long userId);
}
