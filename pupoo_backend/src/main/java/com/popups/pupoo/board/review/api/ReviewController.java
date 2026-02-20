/* file: src/main/java/com/popups/pupoo/board/review/api/ReviewController.java
 * 목적: 후기 API 컨트롤러
 */
package com.popups.pupoo.board.review.api;

import com.popups.pupoo.board.review.application.ReviewService;
import com.popups.pupoo.board.review.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponse> create(@RequestHeader("X-USER-ID") Long userId,
                                                 @Valid @RequestBody ReviewCreateRequest request) {
        return ResponseEntity.ok(reviewService.create(userId, request));
    }

    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewResponse> get(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.get(reviewId));
    }

    @GetMapping
    public ResponseEntity<Page<ReviewResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.list(page, size));
    }

    @PatchMapping("/{reviewId}")
    public ResponseEntity<ReviewResponse> update(@RequestHeader("X-USER-ID") Long userId,
                                                 @PathVariable Long reviewId,
                                                 @Valid @RequestBody ReviewUpdateRequest request) {
        return ResponseEntity.ok(reviewService.update(userId, reviewId, request));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> delete(@RequestHeader("X-USER-ID") Long userId,
                                       @PathVariable Long reviewId) {
        reviewService.delete(userId, reviewId);
        return ResponseEntity.noContent().build();
    }
}
