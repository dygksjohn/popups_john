// file: src/main/java/com/popups/pupoo/board/faq/application/FaqQueryService.java
package com.popups.pupoo.board.faq.application;

import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.domain.model.Board;
import com.popups.pupoo.board.boardinfo.persistence.BoardRepository;
import com.popups.pupoo.board.faq.dto.FaqDetailResponse;
import com.popups.pupoo.board.faq.dto.FaqListResponse;
import com.popups.pupoo.board.post.domain.enums.PostStatus;
import com.popups.pupoo.board.post.domain.model.Post;
import com.popups.pupoo.board.post.persistence.PostRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.common.search.SearchType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaqQueryService {

    private final BoardRepository boardRepository;
    private final PostRepository postRepository;

    public Page<FaqListResponse> list(SearchType searchType, String keyword, Pageable pageable) {
        Board faqBoard = getActiveFaqBoard();

        SearchType type = (searchType == null) ? SearchType.TITLE_CONTENT : searchType;
        String kw = (keyword == null) ? "" : keyword.trim();

        Page<Post> page = switch (type) {
            case TITLE -> postRepository.searchByTitle(faqBoard.getBoardId(), kw, PostStatus.PUBLISHED, pageable);
            case CONTENT -> postRepository.searchByContent(faqBoard.getBoardId(), kw, PostStatus.PUBLISHED, pageable);
            case WRITER -> {
                Long writerId = parseLongOrNull(kw);
                yield postRepository.searchByWriter(faqBoard.getBoardId(), writerId, PostStatus.PUBLISHED, pageable);
            }
            case TITLE_CONTENT -> postRepository.search(faqBoard.getBoardId(), kw, PostStatus.PUBLISHED, pageable);
            default -> postRepository.search(faqBoard.getBoardId(), kw, PostStatus.PUBLISHED, pageable);
        };

        return page.map(p -> new FaqListResponse(
                p.getPostId(),
                p.getPostTitle(),
                preview(p.getContent()),
                p.getUserId(),
                p.getCreatedAt()
        ));
    }

    @Transactional
    public FaqDetailResponse get(Long postId) {
        Post post = postRepository.findByPostIdAndDeletedFalse(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "FAQ_NOT_FOUND"));

        if (post.getBoard() == null || post.getBoard().getBoardType() != BoardType.FAQ) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "FAQ_NOT_FOUND");
        }

        postRepository.increaseViewCount(postId);

        return new FaqDetailResponse(
                post.getPostId(),
                post.getPostTitle(),
                post.getContent(),
                post.getUserId(),
                post.getViewCount() + 1,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    private Board getActiveFaqBoard() {
        Board board = boardRepository.findByBoardType(BoardType.FAQ)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "FAQ_BOARD_NOT_FOUND"));

        if (!board.isActive()) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "FAQ_BOARD_INACTIVE");
        }
        return board;
    }

    private static String preview(String content) {
        if (content == null) return "";
        String trimmed = content.trim();
        return trimmed.length() <= 120 ? trimmed : trimmed.substring(0, 120);
    }

    private static Long parseLongOrNull(String keyword) {
        if (keyword == null || keyword.isBlank()) return null;
        try {
            return Long.parseLong(keyword.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}