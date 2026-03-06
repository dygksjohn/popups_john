// file: src/main/java/com/popups/pupoo/board/qna/api/AdminQnaController.java
package com.popups.pupoo.board.qna.api;

import com.popups.pupoo.board.qna.application.QnaAdminService;
import com.popups.pupoo.board.qna.dto.QnaAnswerRequest;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.MessageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/qnas")
public class AdminQnaController {

    private final QnaAdminService qnaAdminService;

    @PutMapping("/{qnaId}/answer")
    public ApiResponse<MessageResponse> writeAnswer(@PathVariable Long qnaId, @Valid @RequestBody QnaAnswerRequest request) {
        // Keep a non-null payload per SSOT response policy.
        qnaAdminService.writeAnswer(qnaId, request.getAnswerContent());
        return ApiResponse.success(new MessageResponse("QNA_ANSWERED:" + qnaId));
    }

    @DeleteMapping("/{qnaId}/answer")
    public ApiResponse<MessageResponse> clearAnswer(@PathVariable Long qnaId) {
        // Keep a non-null payload per SSOT response policy.
        qnaAdminService.clearAnswer(qnaId);
        return ApiResponse.success(new MessageResponse("QNA_ANSWER_CLEARED:" + qnaId));
    }
}
