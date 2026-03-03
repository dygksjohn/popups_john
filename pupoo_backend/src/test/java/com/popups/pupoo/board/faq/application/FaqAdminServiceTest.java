package com.popups.pupoo.board.faq.application;

import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.domain.model.Board;
import com.popups.pupoo.board.boardinfo.persistence.BoardRepository;
import com.popups.pupoo.board.faq.dto.FaqCreateRequest;
import com.popups.pupoo.board.faq.dto.FaqUpdateRequest;
import com.popups.pupoo.board.post.domain.enums.PostStatus;
import com.popups.pupoo.board.post.domain.model.Post;
import com.popups.pupoo.board.post.persistence.PostRepository;
import com.popups.pupoo.common.audit.application.AdminLogService;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FaqAdminServiceTest {

    @Mock private BoardRepository boardRepository;
    @Mock private PostRepository postRepository;
    @Mock private AdminLogService adminLogService;

    @InjectMocks private FaqAdminService faqAdminService;

    @Test
    void create_writesAdminLog() {
        Board board = faqBoard();
        FaqCreateRequest request = new FaqCreateRequest();
        ReflectionTestUtils.setField(request, "title", "질문");
        ReflectionTestUtils.setField(request, "content", "질문 내용");
        ReflectionTestUtils.setField(request, "answerContent", "답변 내용");

        when(boardRepository.findByBoardType(BoardType.FAQ)).thenReturn(Optional.of(board));
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
            Post saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "postId", 100L);
            return saved;
        });

        Long postId = faqAdminService.create(1L, request);

        assertThat(postId).isEqualTo(100L);

        ArgumentCaptor<Post> postCaptor = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(postCaptor.capture());
        assertThat(postCaptor.getValue().getBoard().getBoardType()).isEqualTo(BoardType.FAQ);
        assertThat(postCaptor.getValue().getStatus()).isEqualTo(PostStatus.PUBLISHED);

        verify(adminLogService).write("FAQ_CREATE", AdminTargetType.POST, 100L);
    }

    @Test
    void update_writesAdminLog() {
        Post post = faqPost(200L);

        FaqUpdateRequest request = new FaqUpdateRequest();
        ReflectionTestUtils.setField(request, "title", "수정 질문");
        ReflectionTestUtils.setField(request, "content", "수정 내용");
        ReflectionTestUtils.setField(request, "answerContent", "수정 답변");

        when(postRepository.findById(200L)).thenReturn(Optional.of(post));

        faqAdminService.update(200L, request);

        assertThat(post.getPostTitle()).isEqualTo("수정 질문");
        assertThat(post.getContent()).isEqualTo("수정 내용");
        assertThat(post.getAnswerContent()).isEqualTo("수정 답변");

        verify(adminLogService).write("FAQ_UPDATE", AdminTargetType.POST, 200L);
    }

    @Test
    void delete_writesAdminLog() {
        Post post = faqPost(300L);
        when(postRepository.findById(300L)).thenReturn(Optional.of(post));

        faqAdminService.delete(300L);

        assertThat(post.isDeleted()).isTrue();
        assertThat(post.getStatus()).isEqualTo(PostStatus.HIDDEN);

        verify(adminLogService).write("FAQ_DELETE", AdminTargetType.POST, 300L);
    }

    private Board faqBoard() {
        return Board.builder()
                .boardId(10L)
                .boardName("FAQ")
                .boardType(BoardType.FAQ)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private Post faqPost(Long postId) {
        return Post.builder()
                .postId(postId)
                .board(faqBoard())
                .userId(1L)
                .postTitle("원본 제목")
                .content("원본 내용")
                .answerContent("원본 답변")
                .status(PostStatus.PUBLISHED)
                .viewCount(0)
                .fileAttached("N")
                .deleted(false)
                .commentEnabled(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
