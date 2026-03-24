// file: src/main/java/com/popups/pupoo/board/post/application/PostService.java
package com.popups.pupoo.board.post.application;

import com.popups.pupoo.board.bannedword.application.BannedWordService;
import com.popups.pupoo.board.bannedword.domain.enums.BannedLogContentType;
import com.popups.pupoo.board.bannedword.application.ModerationClient;
import com.popups.pupoo.board.bannedword.application.ModerationResult;
import com.popups.pupoo.board.bannedword.application.ModerationBlockMessageResolver;
import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.domain.model.Board;
import com.popups.pupoo.board.boardinfo.persistence.BoardRepository;
import com.popups.pupoo.board.post.domain.enums.PostStatus;
import com.popups.pupoo.board.post.domain.model.Post;
import com.popups.pupoo.board.post.dto.PostCreateRequest;
import com.popups.pupoo.board.post.dto.PostResponse;
import com.popups.pupoo.board.post.dto.PostUpdateRequest;
import com.popups.pupoo.board.post.persistence.PostRepository;
import com.popups.pupoo.reply.persistence.PostCommentRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.common.search.SearchType;
import com.popups.pupoo.user.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;
    private final BoardRepository boardRepository;
    private final BannedWordService bannedWordService;
    private final ModerationClient moderationClient;
    private final UserRepository userRepository;
    private final ModerationBlockMessageResolver moderationBlockMessageResolver;

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
        return getPublicPosts(boardId, (BoardType) null, SearchType.TITLE_CONTENT, keyword, pageable, null);
    }

    public Page<PostResponse> getPublicPosts(Long boardId, BoardType boardType, String keyword, Pageable pageable) {
        return getPublicPosts(boardId, boardType, SearchType.TITLE_CONTENT, keyword, pageable, null);
    }

    public Page<PostResponse> getPublicPosts(Long boardId, SearchType searchType, String keyword, Pageable pageable) {
        return getPublicPosts(boardId, null, searchType, keyword, pageable, null);
    }

    public Page<PostResponse> getPublicPosts(Long boardId, BoardType boardType, SearchType searchType, String keyword, Pageable pageable) {
        return getPublicPosts(boardId, boardType, searchType, keyword, pageable, null);
    }

    public Page<PostResponse> getPublicPosts(Long boardId,
                                              BoardType boardType,
                                              SearchType searchType,
                                              String keyword,
                                              Pageable pageable,
                                              String sortKey) {
        Long resolvedBoardId = resolveBoardId(boardId, boardType);
        SearchType effectiveType = (searchType != null) ? searchType : SearchType.TITLE_CONTENT;

        Page<Post> page;
        String normalizedSortKey = sortKey == null ? "" : sortKey.trim().toLowerCase();
        if ("comments".equals(normalizedSortKey)
                || "comment".equals(normalizedSortKey)
                || "commentcount".equals(normalizedSortKey)) {
            String publishedStatus = PostStatus.PUBLISHED.name();
            page = switch (effectiveType) {
                case TITLE -> postRepository.searchByTitleSortedByCommentCount(resolvedBoardId, keyword, publishedStatus, pageable);
                case CONTENT -> postRepository.searchByContentSortedByCommentCount(resolvedBoardId, keyword, publishedStatus, pageable);
                case WRITER -> {
                    Long writerId = parseLongOrNull(keyword);
                    if (writerId == null) yield Page.empty(pageable);
                    yield postRepository.searchByWriterSortedByCommentCount(resolvedBoardId, writerId, publishedStatus, pageable);
                }
                default -> postRepository.searchByTitleContentSortedByCommentCount(resolvedBoardId, keyword, publishedStatus, pageable);
            };
        } else {
            page = switch (effectiveType) {
                case TITLE -> postRepository.searchByTitle(resolvedBoardId, keyword, PostStatus.PUBLISHED, pageable);
                case CONTENT -> postRepository.searchByContent(resolvedBoardId, keyword, PostStatus.PUBLISHED, pageable);
                case WRITER -> {
                    Long writerId = parseLongOrNull(keyword);
                    yield postRepository.searchByWriter(resolvedBoardId, writerId, PostStatus.PUBLISHED, pageable);
                }
                default -> postRepository.search(resolvedBoardId, keyword, PostStatus.PUBLISHED, pageable);
            };
        }

        List<Post> posts = page.getContent();
        Map<Long, Long> commentCountMap = fetchCommentCounts(posts);
        List<PostResponse> content = posts.stream()
                .map(p -> toResponse(p, commentCountMap.getOrDefault(p.getPostId(), 0L)))
                .toList();
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

    private String getWriterNickname(Long userId) {
        return userId != null ? userRepository.findById(userId).map(u -> u.getNickname()).orElse(null) : null;
    }

    private PostResponse toResponse(Post post) {
        return toResponse(post, null);
    }

    private PostResponse toResponse(Post post, Long commentCount) {
        return PostResponse.from(
                post,
                getWriterEmail(post.getUserId()),
                getWriterNickname(post.getUserId()),
                post.getPostTitle(),
                post.getContent(),
                commentCount
        );
    }

    private Map<Long, Long> fetchCommentCounts(List<Post> posts) {
        if (posts == null || posts.isEmpty()) return Map.of();
        List<Long> postIds = posts.stream().map(Post::getPostId).toList();
        List<Object[]> rows = postCommentRepository.countByPostIds(postIds);
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2) continue;
            Long postId = row[0] != null ? ((Number) row[0]).longValue() : null;
            Long cnt = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            if (postId != null) map.put(postId, cnt);
        }
        return map;
    }

    @Transactional
    public Long createPost(Long userId, PostCreateRequest req) {
        if (req == null) {
            log.warn("createPost called with null req (userId={})", userId);
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "request is required");
        }
        String title = req.getPostTitle();
        String content = req.getContent();
        int titleLen = title == null ? 0 : title.length();
        int contentLen = content == null ? 0 : content.length();
        String titlePreview = title == null ? "null" : (title.length() <= 40 ? title : title.substring(0, 40) + "...");
        String contentPreview = content == null ? "null" : (content.length() <= 40 ? content : content.substring(0, 40) + "...");
        // debugging: 400 등으로 moderation 이전에 막히는 케이스가 있어, info 대신 warn으로 항상 노출한다.
        log.warn("createPost request: userId={}, boardId={}, postTitleLen={}, contentLen={}, titlePreview='{}', contentPreview='{}'",
                userId, req.getBoardId(), titleLen, contentLen, titlePreview, contentPreview);

        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        if (req.getBoardId() == null || req.getPostTitle() == null || req.getPostTitle().isBlank() || req.getContent() == null) {
            log.warn("createPost validation failed: userId={}, boardId={}, postTitle={}, contentNull={}",
                    userId, req.getBoardId(), req.getPostTitle(), req.getContent() == null);
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "boardId/postTitle/content is required");
        }

        Board board = boardRepository.findById(req.getBoardId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Board not found"));

        ModerationResult modResult = null;
        if (!bannedWordService.shouldSkipModeration(userId)) {
            String textToModerate = (req.getPostTitle() != null ? req.getPostTitle() : "") + " " + (req.getContent() != null ? req.getContent() : "");
            log.warn("Calling AI moderation for post: textLen={}, preview='{}'",
                    textToModerate.length(), textToModerate.length() <= 60 ? textToModerate : textToModerate.substring(0, 60) + "...");
            modResult = moderationClient.moderate(textToModerate.trim(), req.getBoardId(), "POST");
            if (modResult != null && modResult.isBlock()) {
                // 생성 단계에서 BLOCK 된 요청도 로그에 남긴다 (contentId는 아직 없음).
                bannedWordService.logAiModeration(
                        req.getBoardId(),
                        null,
                        BannedLogContentType.POST,
                        userId,
                        modResult
                );
                // 기술/서버 장애 등으로 BLOCK 된 경우에도 reason/stack을 반영해 안내문구를 다르게 노출한다.
                String msg = moderationBlockMessageResolver.resolveCreateBlockMessage("게시글", modResult);
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, msg);
            }
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
        return saved.getPostId();
    }

    @Transactional
    public void updatePost(Long userId, Long postId, PostUpdateRequest req) {
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        Post post = postRepository.findByPostIdAndUserIdAndDeletedFalse(postId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "No permission to update"));

        applyPostUpdateWithModeration(post, req, userId);
    }

    /**
     * 관리자 콘솔: 작성자와 무관하게 게시글 본문/제목 수정.
     * <p>
     * 일반 사용자 수정({@link #updatePost})과 달리 AI 모더레이션 BLOCK을 적용하지 않는다.
     * 운영자가 정정·복구 목적으로 글을 편집할 때 사용자 글이 AI에 의해 저장 불가(400)로 막히지 않도록 한다.
     */
    @Transactional
    public void adminUpdatePost(Long adminUserId, Long postId, PostUpdateRequest req) {
        if (adminUserId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        Post post = postRepository.findByPostIdAndDeletedFalse(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Post not found"));

        if (req.getPostTitle() == null || req.getPostTitle().isBlank() || req.getContent() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "postTitle/content is required");
        }
        post.updateTitleAndContent(req.getPostTitle(), req.getContent());
    }

    private void applyPostUpdateWithModeration(Post post, PostUpdateRequest req, Long userIdForModeration) {
        if (req.getPostTitle() == null || req.getPostTitle().isBlank() || req.getContent() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "postTitle/content is required");
        }

        if (!bannedWordService.shouldSkipModeration(userIdForModeration)) {
            String textToModerate = (req.getPostTitle() != null ? req.getPostTitle() : "") + " " + (req.getContent() != null ? req.getContent() : "");
            ModerationResult modResult = moderationClient.moderate(textToModerate.trim(), post.getBoard().getBoardId(), "POST");
            if (modResult != null && modResult.isBlock()) {
                bannedWordService.logAiModeration(
                        post.getBoard().getBoardId(),
                        post.getPostId(),
                        BannedLogContentType.POST,
                        userIdForModeration,
                        modResult
                );
                throw new BusinessException(
                        ErrorCode.VALIDATION_FAILED,
                        moderationBlockMessageResolver.resolveUpdateBlockMessage("게시글", modResult)
                );
            }
            post.updateTitleAndContent(req.getPostTitle(), req.getContent());
        } else {
            post.updateTitleAndContent(req.getPostTitle(), req.getContent());
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
