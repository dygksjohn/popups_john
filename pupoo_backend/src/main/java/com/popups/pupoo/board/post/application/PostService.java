// file: src/main/java/com/popups/pupoo/board/post/application/PostService.java
package com.popups.pupoo.board.post.application;

import com.popups.pupoo.board.bannedword.application.BannedWordService;
import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.domain.model.Board;
import com.popups.pupoo.board.boardinfo.persistence.BoardRepository;
import com.popups.pupoo.board.post.domain.enums.PostStatus;
import com.popups.pupoo.board.post.domain.model.Post;
import com.popups.pupoo.board.post.dto.PostCreateRequest;
import com.popups.pupoo.board.post.dto.PostResponse;
import com.popups.pupoo.board.post.dto.PostUpdateRequest;
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
public class PostService {

    private final PostRepository postRepository;
    private final BoardRepository boardRepository;
    private final BannedWordService bannedWordService;

    public Page<PostResponse> getPosts(Long boardId, String keyword, PostStatus status, Pageable pageable) {
        if (boardId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "boardId is required");
        }
        return postRepository.search(boardId, keyword, status, pageable).map(PostResponse::from);
    }

    public Page<PostResponse> getPublicPosts(Long boardId, String keyword, Pageable pageable) {
        return getPublicPosts(boardId, (BoardType) null, keyword, pageable);
    }

    public Page<PostResponse> getPublicPosts(Long boardId, BoardType boardType, String keyword, Pageable pageable) {
        if (boardId != null) {
            return postRepository.search(boardId, keyword, PostStatus.PUBLISHED, pageable).map(PostResponse::from);
        }
        if (boardType != null) {
            return postRepository.searchByBoardType(boardType, keyword, PostStatus.PUBLISHED, pageable)
                    .map(PostResponse::from);
        }
        throw new BusinessException(ErrorCode.VALIDATION_FAILED, "boardId or boardType is required");
    }

    public Page<PostResponse> getPublicPosts(Long boardId, SearchType searchType, String keyword, Pageable pageable) {
        return getPublicPosts(boardId, null, searchType, keyword, pageable);
    }

    public Page<PostResponse> getPublicPosts(Long boardId, BoardType boardType, SearchType searchType, String keyword, Pageable pageable) {
        if (boardId != null) {
            return switch (searchType) {
                case TITLE -> postRepository.searchByTitle(boardId, keyword, PostStatus.PUBLISHED, pageable).map(PostResponse::from);
                case CONTENT -> postRepository.searchByContent(boardId, keyword, PostStatus.PUBLISHED, pageable).map(PostResponse::from);
                case WRITER -> {
                    Long writerId = parseLongOrNull(keyword);
                    yield postRepository.searchByWriter(boardId, writerId, PostStatus.PUBLISHED, pageable).map(PostResponse::from);
                }
                case TITLE_CONTENT -> postRepository.search(boardId, keyword, PostStatus.PUBLISHED, pageable).map(PostResponse::from);
            };
        }

        if (boardType != null) {
            return switch (searchType) {
                case TITLE -> postRepository.searchByBoardTypeTitle(boardType, keyword, PostStatus.PUBLISHED, pageable).map(PostResponse::from);
                case CONTENT -> postRepository.searchByBoardTypeContent(boardType, keyword, PostStatus.PUBLISHED, pageable).map(PostResponse::from);
                case WRITER -> {
                    Long writerId = parseLongOrNull(keyword);
                    yield postRepository.searchByBoardTypeWriter(boardType, writerId, PostStatus.PUBLISHED, pageable).map(PostResponse::from);
                }
                case TITLE_CONTENT -> postRepository.searchByBoardType(boardType, keyword, PostStatus.PUBLISHED, pageable).map(PostResponse::from);
            };
        }

        throw new BusinessException(ErrorCode.VALIDATION_FAILED, "boardId or boardType is required");
    }

    private static Long parseLongOrNull(String keyword) {
        if (keyword == null || keyword.isBlank()) return null;
        try {
            return Long.parseLong(keyword.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @Transactional
    public PostResponse getPublicPost(Long postId) {
        if (postId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "postId is required");
        }

        postRepository.increaseViewCount(postId);

        Post post = postRepository.findByPostIdAndDeletedFalse(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Post not found"));

        if (post.getStatus() != PostStatus.PUBLISHED) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Post not found");
        }
        return PostResponse.from(post);
    }

    @Transactional
    public PostResponse getPost(Long postId) {
        if (postId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "postId is required");
        }

        postRepository.increaseViewCount(postId);

        Post post = postRepository.findByPostIdAndDeletedFalse(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Post not found"));

        return PostResponse.from(post);
    }

    @Transactional
    public Long createPost(Long userId, PostCreateRequest req) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        if (req.getBoardId() == null || req.getPostTitle() == null || req.getPostTitle().isBlank() || req.getContent() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "boardId/postTitle/content is required");
        }

        Board board = boardRepository.findById(req.getBoardId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Board not found"));

        bannedWordService.validate(board.getBoardId(), req.getPostTitle(), req.getContent());

        Post post = Post.builder()
                .board(board)
                .userId(userId)
                .postTitle(req.getPostTitle())
                .content(req.getContent())
                .fileAttached("N")
                .status(PostStatus.PUBLISHED)
                .viewCount(0)
                .deleted(false)
                .commentEnabled(true)
                .build();

        return postRepository.save(post).getPostId();
    }

    @Transactional
    public void updatePost(Long userId, Long postId, PostUpdateRequest req) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        Post post = postRepository.findByPostIdAndUserIdAndDeletedFalse(postId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "No permission to update"));

        if (req.getPostTitle() == null || req.getPostTitle().isBlank() || req.getContent() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "postTitle/content is required");
        }

        bannedWordService.validate(post.getBoard().getBoardId(), req.getPostTitle(), req.getContent());

        post.updateTitleAndContent(req.getPostTitle(), req.getContent());
    }

    @Transactional
    public void deletePost(Long userId, Long postId) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        Post post = postRepository.findByPostIdAndUserIdAndDeletedFalse(postId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "No permission to delete"));

        post.markDeleted();
    }

    @Transactional
    public void closePost(Long userId, Long postId) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        Post post = postRepository.findByPostIdAndUserIdAndDeletedFalse(postId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "No permission"));

        post.close();
    }

    @Transactional
    public void adminDelete(Long postId) {
        Post post = postRepository.findByPostIdAndDeletedFalse(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Post not found"));
        post.markDeleted();
    }
}
