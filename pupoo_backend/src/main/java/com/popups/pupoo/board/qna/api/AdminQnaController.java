// file: src/main/java/com/popups/pupoo/board/qna/api/AdminQnaController.java
package com.popups.pupoo.board.qna.api;

import com.popups.pupoo.board.qna.application.QnaAdminService;
import com.popups.pupoo.board.qna.dto.QnaAnswerRequest;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.MessageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 QnA 답변 API다.
 * 관리자 인증이 전제되며, 답변 작성과 답변 삭제를 `QnaAdminService`에 위임한다.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/qnas")
public class AdminQnaController {

    private final QnaAdminService qnaAdminService;

    /**
     * 관리자 답변을 저장한다.
     * 응답은 비어 있지 않은 payload를 유지하는 현재 응답 정책을 따른다.
     */
    @PutMapping("/{qnaId}/answer")
    public ApiResponse<MessageResponse> writeAnswer(@PathVariable Long qnaId, @Valid @RequestBody QnaAnswerRequest request) {
        qnaAdminService.writeAnswer(qnaId, request.getAnswerContent());
        return ApiResponse.success(new MessageResponse("QNA_ANSWERED:" + qnaId));
    }

    /**
     * 관리자 답변을 제거한다.
     */
    @DeleteMapping("/{qnaId}/answer")
    public ApiResponse<MessageResponse> clearAnswer(@PathVariable Long qnaId) {
        qnaAdminService.clearAnswer(qnaId);
        return ApiResponse.success(new MessageResponse("QNA_ANSWER_CLEARED:" + qnaId));
    }
}
