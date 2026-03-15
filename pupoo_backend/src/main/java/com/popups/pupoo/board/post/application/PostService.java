// file: src/main/java/com/popups/pupoo/board/post/application/PostService.java
package com.popups.pupoo.board.post.application;

import com.popups.pupoo.board.bannedword.application.BannedWordService;
import com.popups.pupoo.board.bannedword.application.ModerationClient;
import com.popups.pupoo.board.bannedword.application.ModerationResult;
import com.popups.pupoo.board.bannedword.domain.enums.BannedLogContentType;
import com.popups.pupoo.board.bannedword.dto.BannedWordDetection;
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
import com.popups.pupoo.user.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final BoardRepository boardRepository;
    private final BannedWordService bannedWordService;
    private final ModerationClient moderationClient;
    private final UserRepository userRepository;

    private Long resolveBoardId(Long boardId, BoardType boardType) {
        if (boardId != null) return boardId;
        if (boardType == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "boardId or boardType is required");
        }
        return boardRepository.findByBoardType(boardType)
                .map(Board::getBoardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Board not found for boardType: " + boardType));
    }

    public Page<PostResponse> getPosts(Long boardId, String keyword, PostStatus status, Pageable pageable) {
        if (boardId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "boardId is required");
        }
        Page<Post> page = postRepository.search(boardId, keyword, status, pageable);
        List<PostResponse> content = page.getContent().stream().map(this::toResponse).toList();
        return new PageImpl<>(content, page.getPageable(), page.getTotalElements());
    }

    public Page<PostResponse> getPublicPosts(Long boardId, String keyword, Pageable pageable) {
        return getPublicPosts(boardId, (BoardType) null, keyword, pageable);
    }

    public Page<PostResponse> getPublicPosts(Long boardId, BoardType boardType, String keyword, Pageable pageable) {
        Long resolvedBoardId = resolveBoardId(boardId, boardType);
        Page<Post> page = postRepository.search(resolvedBoardId, keyword, PostStatus.PUBLISHED, pageable);
        List<PostResponse> content = page.getContent().stream().map(this::toResponse).toList();
        return new PageImpl<>(content, page.getPageable(), page.getTotalElements());
    }

    public Page<PostResponse> getPublicPosts(Long boardId, SearchType searchType, String keyword, Pageable pageable) {
        return getPublicPosts(boardId, null, searchType, keyword, pageable);
    }

    public Page<PostResponse> getPublicPosts(Long boardId, BoardType boardType, SearchType searchType, String keyword, Pageable pageable) {
        Long resolvedBoardId = resolveBoardId(boardId, boardType);
        SearchType effectiveType = (searchType != null) ? searchType : SearchType.TITLE_CONTENT;

        Page<Post> page = switch (effectiveType) {
            case TITLE -> postRepository.searchByTitle(resolvedBoardId, keyword, PostStatus.PUBLISHED, pageable);
            case CONTENT -> postRepository.searchByContent(resolvedBoardId, keyword, PostStatus.PUBLISHED, pageable);
            case WRITER -> {
                Long writerId = parseLongOrNull(keyword);
                yield postRepository.searchByWriter(resolvedBoardId, writerId, PostStatus.PUBLISHED, pageable);
            }
            default -> postRepository.search(resolvedBoardId, keyword, PostStatus.PUBLISHED, pageable);
        };
        List<PostResponse> content = page.getContent().stream().map(this::toResponse).toList();
        return new PageImpl<>(content, page.getPageable(), page.getTotalElements());
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
        return toResponse(post);
    }

    @Transactional
    public PostResponse getPost(Long postId) {
        if (postId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "postId is required");
        }

        postRepository.increaseViewCount(postId);

        Post post = postRepository.findByPostIdAndDeletedFalse(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Post not found"));

        return toResponse(post);
    }

    private String getWriterEmail(Long userId) {
        return userId != null ? userRepository.findById(userId).map(u -> u.getEmail()).orElse(null) : null;
    }

    private PostResponse toResponse(Post post) {
        return PostResponse.from(post, getWriterEmail(post.getUserId()), post.getPostTitle(), post.getContent());
    }

    @Transactional
    public Long createPost(Long userId, PostCreateRequest req) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        if (req.getBoardId() == null || req.getPostTitle() == null || req.getPostTitle().isBlank() || req.getContent() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "boardId/postTitle/content is required");
        }

        Board board = boardRepository.findById(req.getBoardId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Board not found"));

        List<BannedWordDetection> level1Detections = bannedWordService.validate(req.getBoardId(), req.getPostTitle(), req.getContent());

        String textToModerate = (req.getPostTitle() != null ? req.getPostTitle() : "") + " " + (req.getContent() != null ? req.getContent() : "");
        ModerationResult modResult = moderationClient.moderate(textToModerate.trim(), req.getBoardId(), "POST");
        if (modResult != null && modResult.isBlock()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    modResult.getReason() != null ? modResult.getReason() : "게시글 내용이 정책에 위반될 수 있어 등록할 수 없습니다.");
        }

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

        Post saved = postRepository.save(post);
        if (!level1Detections.isEmpty()) {
            bannedWordService.logDetections(req.getBoardId(), saved.getPostId(), BannedLogContentType.POST, userId, level1Detections);
        }
        if (modResult != null && modResult.isReview()) {
            bannedWordService.logAiModeration(req.getBoardId(), saved.getPostId(), BannedLogContentType.POST, userId, modResult);
        }
        return saved.getPostId();
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
        String textToModerate = (req.getPostTitle() != null ? req.getPostTitle() : "") + " " + (req.getContent() != null ? req.getContent() : "");
        ModerationResult modResult = moderationClient.moderate(textToModerate.trim(), post.getBoard().getBoardId(), "POST");
        if (modResult != null && modResult.isBlock()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    modResult.getReason() != null ? modResult.getReason() : "게시글 내용이 정책에 위반될 수 있어 수정할 수 없습니다.");
        }

        post.updateTitleAndContent(req.getPostTitle(), req.getContent());
        if (modResult != null && modResult.isReview()) {
            bannedWordService.logAiModeration(post.getBoard().getBoardId(), postId, BannedLogContentType.POST, userId, modResult);
        }
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
