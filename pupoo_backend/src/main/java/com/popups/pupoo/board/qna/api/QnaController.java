// file: src/main/java/com/popups/pupoo/board/qna/api/QnaController.java
package com.popups.pupoo.board.qna.api;

import com.popups.pupoo.board.qna.application.QnaService;
import com.popups.pupoo.board.qna.dto.*;
import com.popups.pupoo.auth.security.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/qnas")
public class QnaController {

    private final QnaService qnaService;
    private final SecurityUtil securityUtil;

    @PostMapping
    public ResponseEntity<QnaResponse> create(@Valid @RequestBody QnaCreateRequest request) {
        Long userId = securityUtil.currentUserId();
        return ResponseEntity.ok(qnaService.create(userId, request));
    }

    @GetMapping("/{qnaId}")
    public ResponseEntity<QnaResponse> get(@PathVariable Long qnaId) {
        return ResponseEntity.ok(qnaService.get(qnaId));
    }

    @GetMapping
    public ResponseEntity<Page<QnaResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(qnaService.list(page, size));
    }

    @PatchMapping("/{qnaId}")
    public ResponseEntity<QnaResponse> update(@PathVariable Long qnaId,
                                              @Valid @RequestBody QnaUpdateRequest request) {
        Long userId = securityUtil.currentUserId();
        return ResponseEntity.ok(qnaService.update(userId, qnaId, request));
    }

    @DeleteMapping("/{qnaId}")
    public ResponseEntity<Void> delete(@PathVariable Long qnaId) {
        Long userId = securityUtil.currentUserId();
        qnaService.delete(userId, qnaId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{qnaId}/close")
    public ResponseEntity<Void> close(@PathVariable Long qnaId) {
        Long userId = securityUtil.currentUserId();
        qnaService.close(userId, qnaId);
        return ResponseEntity.ok().build();
    }
}
