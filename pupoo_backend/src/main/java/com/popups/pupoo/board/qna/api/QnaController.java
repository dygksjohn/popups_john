// file: src/main/java/com/popups/pupoo/board/qna/api/QnaController.java
package com.popups.pupoo.board.qna.api;

import com.popups.pupoo.board.qna.application.QnaService;
import com.popups.pupoo.board.qna.dto.*;
import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.IdResponse;
import com.popups.pupoo.common.api.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/qnas")
public class QnaController {

    private final QnaService qnaService;
    private final SecurityUtil securityUtil;

    @PostMapping
    public ApiResponse<QnaResponse> create(@Valid @RequestBody QnaCreateRequest request) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(qnaService.create(userId, request));
    }

    @GetMapping("/{qnaId}")
    public ApiResponse<QnaResponse> get(@PathVariable Long qnaId) {
        return ApiResponse.success(qnaService.get(qnaId));
    }

    @GetMapping
    public ApiResponse<PageResponse<QnaResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(PageResponse.from(qnaService.list(page, size)));
    }

    @PatchMapping("/{qnaId}")
    public ApiResponse<QnaResponse> update(@PathVariable Long qnaId,
                                           @Valid @RequestBody QnaUpdateRequest request) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(qnaService.update(userId, qnaId, request));
    }

    @DeleteMapping("/{qnaId}")
    public ApiResponse<IdResponse> delete(@PathVariable Long qnaId) {
        Long userId = securityUtil.currentUserId();
        qnaService.delete(userId, qnaId);
        return ApiResponse.success(new IdResponse(qnaId));
    }

    @PostMapping("/{qnaId}/close")
    public ApiResponse<IdResponse> close(@PathVariable Long qnaId) {
        Long userId = securityUtil.currentUserId();
        qnaService.close(userId, qnaId);
        return ApiResponse.success(new IdResponse(qnaId));
    }
}
