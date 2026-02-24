// file: src/main/java/com/popups/pupoo/board/post/application/PostService.java
package com.popups.pupoo.board.post.application;

import com.popups.pupoo.board.boardinfo.domain.model.Board;
import com.popups.pupoo.board.boardinfo.persistence.BoardRepository;
import com.popups.pupoo.board.bannedword.application.BannedWordService;
import com.popups.pupoo.board.post.domain.enums.PostStatus;
import com.popups.pupoo.board.post.domain.model.Post;
import com.popups.pupoo.board.post.dto.PostCreateRequest;
import com.popups.pupoo.board.post.dto.PostResponse;
import com.popups.pupoo.board.post.dto.PostUpdateRequest;
import com.popups.pupoo.board.post.persistence.PostRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
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
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "boardId는 필수입니다.");
        }
        return postRepository.search(boardId, keyword, status, pageable).map(PostResponse::from);
    }

    /**
     * 게시글 목록 공개 조회
     * - 정책: PUBLISHED + deleted=false만 조회한다.
     */
    public Page<PostResponse> getPublicPosts(Long boardId, String keyword, Pageable pageable) {
        if (boardId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "boardId는 필수입니다.");
        }
        return postRepository.search(boardId, keyword, PostStatus.PUBLISHED, pageable)
                .map(PostResponse::from);
    }

    /**
     * 게시글 단건 공개 조회
     * - 정책: PUBLISHED + deleted=false만 조회한다.
     */
    @Transactional
    public PostResponse getPublicPost(Long postId) {
        if (postId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "postId는 필수입니다.");
        }

        postRepository.increaseViewCount(postId);

        Post post = postRepository.findByPostIdAndDeletedFalse(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "게시글이 존재하지 않습니다."));

        if (post.getStatus() != PostStatus.PUBLISHED) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "게시글이 존재하지 않습니다.");
        }
        return PostResponse.from(post);
    }

    @Transactional
    public PostResponse getPost(Long postId) {
        if (postId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "postId는 필수입니다.");
        }

        postRepository.increaseViewCount(postId);

        Post post = postRepository.findByPostIdAndDeletedFalse(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "게시글이 존재하지 않습니다."));

        return PostResponse.from(post);
    }

    @Transactional
    public Long createPost(Long userId, PostCreateRequest req) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        if (req.getBoardId() == null || req.getPostTitle() == null || req.getPostTitle().isBlank() || req.getContent() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "boardId/postTitle/content는 필수입니다.");
        }

        Board board = boardRepository.findById(req.getBoardId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "게시판이 존재하지 않습니다."));

        // 금칙어 검증 (DB: board_banned_words)
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
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "수정 권한이 없습니다."));

        if (req.getPostTitle() == null || req.getPostTitle().isBlank() || req.getContent() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "postTitle/content는 필수입니다.");
        }

        // 금칙어 검증 (게시글 수정 포함)
        bannedWordService.validate(post.getBoard().getBoardId(), req.getPostTitle(), req.getContent());

        post.updateTitleAndContent(req.getPostTitle(), req.getContent());
    }

    @Transactional
    public void deletePost(Long userId, Long postId) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        Post post = postRepository.findByPostIdAndUserIdAndDeletedFalse(postId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "삭제 권한이 없습니다."));

        post.markDeleted();
    }

    @Transactional
    public void closePost(Long userId, Long postId) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        Post post = postRepository.findByPostIdAndUserIdAndDeletedFalse(postId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "권한이 없습니다."));

        post.close();
    }

    /**
     * 관리자 강제 삭제
     * - 작성자(userId) 검증을 수행하지 않는다.
     * - 삭제 정책은 소프트 삭제(markDeleted)로 통일한다.
     */
    @Transactional
    public void adminDelete(Long postId) {
        Post post = postRepository.findByPostIdAndDeletedFalse(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "게시글이 존재하지 않습니다."));
        post.markDeleted();
    }
}
