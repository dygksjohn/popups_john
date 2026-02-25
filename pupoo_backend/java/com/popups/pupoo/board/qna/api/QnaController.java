// file: src/main/java/com/popups/pupoo/board/qna/api/QnaController.java
package com.popups.pupoo.board.qna.api;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.popups.pupoo.board.qna.application.QnaService;
import com.popups.pupoo.board.qna.dto.QnaCreateRequest;
import com.popups.pupoo.board.qna.dto.QnaResponse;
import com.popups.pupoo.board.qna.dto.QnaUpdateRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/qnas")
public class QnaController {

    private final QnaService qnaService;

    @PostMapping
    public ResponseEntity<QnaResponse> create(@RequestHeader("X-USER-ID") Long userId,
                                              @Valid @RequestBody QnaCreateRequest request) {
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
    public ResponseEntity<QnaResponse> update(@RequestHeader("X-USER-ID") Long userId,
                                              @PathVariable Long qnaId,
                                              @Valid @RequestBody QnaUpdateRequest request) {
        return ResponseEntity.ok(qnaService.update(userId, qnaId, request));
    }

    @DeleteMapping("/{qnaId}")
    public ResponseEntity<Void> delete(@RequestHeader("X-USER-ID") Long userId,
                                       @PathVariable Long qnaId) {
        qnaService.delete(userId, qnaId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{qnaId}/close")
    public ResponseEntity<Void> close(@RequestHeader("X-USER-ID") Long userId,
                                      @PathVariable Long qnaId) {
        qnaService.close(userId, qnaId);
        return ResponseEntity.ok().build();
    }
}
