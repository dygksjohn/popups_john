// file: src/main/java/com/popups/pupoo/board/qna/application/QnaAdminService.java
package com.popups.pupoo.board.qna.application;

import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.post.domain.model.Post;
import com.popups.pupoo.board.qna.persistence.QnaRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class QnaAdminService {

    private final QnaRepository qnaRepository;

    public void writeAnswer(Long qnaId, String answerContent) {
        Post post = qnaRepository.findQnaById(qnaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "QnA가 존재하지 않습니다."));

        if (post.getBoard() == null || post.getBoard().getBoardType() != BoardType.QNA) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "QnA가 존재하지 않습니다.");
        }

        post.writeAnswer(answerContent);
        qnaRepository.save(post);
    }

    public void clearAnswer(Long qnaId) {
        Post post = qnaRepository.findQnaById(qnaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "QnA가 존재하지 않습니다."));

        if (post.getBoard() == null || post.getBoard().getBoardType() != BoardType.QNA) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "QnA가 존재하지 않습니다.");
        }

        post.clearAnswer();
        qnaRepository.save(post);
    }
}
