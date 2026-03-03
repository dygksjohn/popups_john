package com.popups.pupoo.board.qna.application;

import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.domain.model.Board;
import com.popups.pupoo.board.qna.persistence.QnaRepository;
import com.popups.pupoo.common.audit.application.AdminLogService;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.board.post.domain.enums.PostStatus;
import com.popups.pupoo.board.post.domain.model.Post;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QnaAdminServiceTest {

    @Mock private QnaRepository qnaRepository;
    @Mock private AdminLogService adminLogService;

    @InjectMocks private QnaAdminService qnaAdminService;

    @Test
    void writeAnswer_writesAdminLog() {
        Post qna = qnaPost(101L);
        when(qnaRepository.findQnaById(101L)).thenReturn(Optional.of(qna));
        when(qnaRepository.save(qna)).thenReturn(qna);

        qnaAdminService.writeAnswer(101L, "관리자 답변");

        assertThat(qna.getAnswerContent()).isEqualTo("관리자 답변");
        verify(adminLogService).write("QNA_ANSWER", AdminTargetType.POST, 101L);
    }

    @Test
    void clearAnswer_writesAdminLog() {
        Post qna = qnaPost(102L);
        qna.writeAnswer("초기 답변");
        when(qnaRepository.findQnaById(102L)).thenReturn(Optional.of(qna));
        when(qnaRepository.save(qna)).thenReturn(qna);

        qnaAdminService.clearAnswer(102L);

        assertThat(qna.getAnswerContent()).isNull();
        verify(adminLogService).write("QNA_ANSWER_CLEAR", AdminTargetType.POST, 102L);
    }

    @Test
    void writeAnswer_nonQna_throwsNotFound() {
        Post freePost = Post.builder()
                .postId(103L)
                .board(Board.builder()
                        .boardId(10L)
                        .boardName("FREE")
                        .boardType(BoardType.FREE)
                        .active(true)
                        .createdAt(LocalDateTime.now())
                        .build())
                .userId(1L)
                .postTitle("자유글")
                .content("내용")
                .status(PostStatus.PUBLISHED)
                .fileAttached("N")
                .commentEnabled(true)
                .deleted(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(qnaRepository.findQnaById(103L)).thenReturn(Optional.of(freePost));

        assertThatThrownBy(() -> qnaAdminService.writeAnswer(103L, "답변"))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);

        verify(adminLogService, never()).write(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyLong());
    }

    private Post qnaPost(Long postId) {
        Board board = Board.builder()
                .boardId(20L)
                .boardName("QNA")
                .boardType(BoardType.QNA)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        return Post.builder()
                .postId(postId)
                .board(board)
                .userId(5L)
                .postTitle("질문")
                .content("질문 내용")
                .status(PostStatus.PUBLISHED)
                .fileAttached("N")
                .commentEnabled(true)
                .deleted(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}

