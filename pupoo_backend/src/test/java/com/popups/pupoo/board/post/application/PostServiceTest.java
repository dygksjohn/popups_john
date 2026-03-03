package com.popups.pupoo.board.post.application;

import com.popups.pupoo.board.bannedword.application.BannedWordService;
import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.persistence.BoardRepository;
import com.popups.pupoo.board.post.domain.enums.PostStatus;
import com.popups.pupoo.board.post.dto.PostResponse;
import com.popups.pupoo.board.post.persistence.PostRepository;
import com.popups.pupoo.common.search.SearchType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock private PostRepository postRepository;
    @Mock private BoardRepository boardRepository;
    @Mock private BannedWordService bannedWordService;

    @InjectMocks private PostService postService;

    @Test
    void getPublicPosts_byBoardType_usesPublishedOnlyQuery() {
        Pageable pageable = PageRequest.of(0, 10);

        when(postRepository.searchByBoardType(BoardType.FREE, "keyword", PostStatus.PUBLISHED, pageable))
                .thenReturn(Page.empty(pageable));

        Page<PostResponse> result = postService.getPublicPosts(
                null,
                BoardType.FREE,
                SearchType.TITLE_CONTENT,
                "keyword",
                pageable
        );

        assertThat(result.getContent()).isEmpty();

        verify(postRepository).searchByBoardType(BoardType.FREE, "keyword", PostStatus.PUBLISHED, pageable);
        verify(postRepository, never()).searchByBoardType(BoardType.FREE, "keyword", PostStatus.DRAFT, pageable);
        verify(postRepository, never()).searchByBoardType(BoardType.FREE, "keyword", PostStatus.HIDDEN, pageable);
    }
}
