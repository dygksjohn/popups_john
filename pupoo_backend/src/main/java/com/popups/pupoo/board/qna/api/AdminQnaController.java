// file: src/main/java/com/popups/pupoo/board/qna/api/AdminQnaController.java
package com.popups.pupoo.board.qna.api;

import com.popups.pupoo.board.qna.application.QnaAdminService;
import com.popups.pupoo.board.qna.dto.QnaAnswerRequest;
import com.popups.pupoo.common.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/qnas")
public class AdminQnaController {

    private final QnaAdminService qnaAdminService;

    @PutMapping("/{qnaId}/answer")
    public ApiResponse<Void> writeAnswer(@PathVariable Long qnaId, @Valid @RequestBody QnaAnswerRequest request) {
        qnaAdminService.writeAnswer(qnaId, request.getAnswerContent());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{qnaId}/answer")
    public ApiResponse<Void> clearAnswer(@PathVariable Long qnaId) {
        qnaAdminService.clearAnswer(qnaId);
        return ApiResponse.success(null);
    }
}
