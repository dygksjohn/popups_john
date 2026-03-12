// file: src/main/java/com/popups/pupoo/reply/application/ReplyService.java
package com.popups.pupoo.reply.application;

import com.popups.pupoo.board.bannedword.application.BannedWordService;
import com.popups.pupoo.board.bannedword.domain.enums.BannedLogContentType;
import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.persistence.BoardRepository;
import com.popups.pupoo.board.post.domain.model.Post;
import com.popups.pupoo.board.post.persistence.PostRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.reply.domain.enums.ReplyStatus;
import com.popups.pupoo.reply.domain.enums.ReplyTargetType;
import com.popups.pupoo.reply.domain.model.PostComment;
import com.popups.pupoo.reply.domain.model.ReviewComment;
import com.popups.pupoo.reply.dto.ReplyCreateRequest;
import com.popups.pupoo.reply.dto.ReplyResponse;
import com.popups.pupoo.reply.dto.ReplyUpdateRequest;
import com.popups.pupoo.reply.persistence.PostCommentRepository;
import com.popups.pupoo.reply.persistence.ReviewCommentRepository;
import com.popups.pupoo.user.persistence.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.LocalDateTime;

@Service
@Transactional(readOnly = true)
public class ReplyService {

    private final PostCommentRepository postCommentRepository;
    private final ReviewCommentRepository reviewCommentRepository;
    private final ReplyTargetValidator targetValidator;
    private final PostRepository postRepository;
    private final BoardRepository boardRepository;
    private final BannedWordService bannedWordService;
    private final UserRepository userRepository;

    public ReplyService(PostCommentRepository postCommentRepository,
                        ReviewCommentRepository reviewCommentRepository,
                        ReplyTargetValidator targetValidator,
                        PostRepository postRepository,
                        BoardRepository boardRepository,
                        BannedWordService bannedWordService,
                        UserRepository userRepository) {
        this.postCommentRepository = postCommentRepository;
        this.reviewCommentRepository = reviewCommentRepository;
        this.targetValidator = targetValidator;
        this.postRepository = postRepository;
        this.boardRepository = boardRepository;
        this.bannedWordService = bannedWordService;
        this.userRepository = userRepository;
    }

    private String getWriterEmail(Long userId) {
        if (userId == null) return null;
        return userRepository.findById(userId).map(u -> u.getEmail()).orElse(null);
    }

    @Transactional
    public ReplyResponse create(Long userId, ReplyCreateRequest request) {
        targetValidator.validate(request.getTargetType(), request.getTargetId());

        // 댓글 정책: FAQ 및 댓글 비활성 게시글은 댓글 생성 불가
        if (request.getTargetType() == ReplyTargetType.POST) {
            validateReplyAllowedForPost(request.getTargetId());
        }

        LocalDateTime now = LocalDateTime.now();

        if (request.getTargetType() == ReplyTargetType.POST) {
            Post post = postRepository.findByPostIdAndDeletedFalse(request.getTargetId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "게시글이 존재하지 않습니다."));
            Long boardId = post.getBoard() != null ? post.getBoard().getBoardId() : null;

            PostComment saved = postCommentRepository.save(PostComment.builder()
                    .postId(request.getTargetId())
                    .userId(userId)
                    .content(request.getContent())
                    .createdAt(now)
                    .updatedAt(now)
                    .deleted(false)
                    .build());

            return toResponse(saved, ReplyTargetType.POST, request.getTargetId(), boardId);
        }

        if (request.getTargetType() == ReplyTargetType.REVIEW) {
            Long reviewBoardId = boardRepository.findByBoardType(BoardType.REVIEW)
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "REVIEW 게시판이 존재하지 않습니다."))
                    .getBoardId();

            ReviewComment saved = reviewCommentRepository.save(ReviewComment.builder()
                    .reviewId(request.getTargetId())
                    .userId(userId)
                    .content(request.getContent())
                    .createdAt(now)
                    .updatedAt(now)
                    .deleted(false)
                    .build());

            return toResponse(saved, ReplyTargetType.REVIEW, request.getTargetId(), reviewBoardId);
        }

        throw new BusinessException(ErrorCode.INVALID_REQUEST, "지원하지 않는 댓글 대상 타입입니다.");
    }

    private void validateReplyAllowedForPost(Long postId) {
        Post post = postRepository.findByPostIdAndDeletedFalse(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "게시글이 존재하지 않습니다."));

        // 정책: 숨김(HIDDEN) 게시글에는 댓글 작성 불가
        if (post.getStatus() == com.popups.pupoo.board.post.domain.enums.PostStatus.HIDDEN) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "숨김 처리된 게시글에는 댓글을 작성할 수 없습니다.");
        }

        // 정책: 댓글은 FREE/INFO만 허용
        BoardType bt = (post.getBoard() == null) ? null : post.getBoard().getBoardType();
        if (bt != BoardType.FREE && bt != BoardType.INFO) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "해당 게시판에는 댓글을 작성할 수 없습니다.");
        }
        if (!post.isCommentEnabled()) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "댓글이 비활성화된 게시글입니다.");
        }
    }

    public Page<ReplyResponse> list(ReplyTargetType targetType, Long targetId, int page, int size) {
        validatePageRequest(page, size);

        // 공개 댓글 목록 조회 시 부모 컨텐츠 공개 상태 검증
        targetValidator.validatePublicReadable(targetType, targetId);

        if (targetType == ReplyTargetType.POST) {
            Long boardId = postRepository.findByPostIdAndDeletedFalse(targetId)
                    .map(p -> p.getBoard() != null ? p.getBoard().getBoardId() : null)
                    .orElse(null);
            return postCommentRepository
                    .findAllByPostIdAndDeletedFalseOrderByCreatedAtDesc(targetId, PageRequest.of(page, size))
                    .map(c -> toResponse(c, ReplyTargetType.POST, targetId, boardId));
        }

        if (targetType == ReplyTargetType.REVIEW) {
            Long reviewBoardId = boardRepository.findByBoardType(BoardType.REVIEW).map(b -> b.getBoardId()).orElse(null);
            return reviewCommentRepository
                    .findAllByReviewIdAndDeletedFalseOrderByCreatedAtDesc(targetId, PageRequest.of(page, size))
                    .map(c -> toResponse(c, ReplyTargetType.REVIEW, targetId, reviewBoardId));
        }

        throw new BusinessException(ErrorCode.INVALID_REQUEST, "지원하지 않는 댓글 대상 타입입니다.");
    }

    @Transactional
    public ReplyResponse update(Long userId, ReplyTargetType targetType, Long replyId, ReplyUpdateRequest request) {
        LocalDateTime now = LocalDateTime.now();

        // 금칙어 검증 (댓글 수정 포함)
        // - update에서는 replyId만으로는 targetId를 알기 어려우므로, 실제 엔티티에서 targetId를 꺼내서 검증한다.

        if (targetType == ReplyTargetType.POST) {
            PostComment comment = postCommentRepository.findByCommentIdAndDeletedFalse(replyId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "댓글이 존재하지 않습니다."));

            if (!comment.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "수정 권한이 없습니다.");
            }

            PostComment saved = postCommentRepository.save(comment.updateContent(request.getContent(), now));
            Long boardId = postRepository.findByPostIdAndDeletedFalse(comment.getPostId()).map(p -> p.getBoard() != null ? p.getBoard().getBoardId() : null).orElse(null);
            return toResponse(saved, ReplyTargetType.POST, comment.getPostId(), boardId);
        }

        if (targetType == ReplyTargetType.REVIEW) {
            ReviewComment comment = reviewCommentRepository.findByCommentIdAndDeletedFalse(replyId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "댓글이 존재하지 않습니다."));

            if (!comment.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "수정 권한이 없습니다.");
            }

            ReviewComment saved = reviewCommentRepository.save(comment.updateContent(request.getContent(), now));
            Long reviewBoardId = boardRepository.findByBoardType(BoardType.REVIEW).map(b -> b.getBoardId()).orElse(null);
            return toResponse(saved, ReplyTargetType.REVIEW, comment.getReviewId(), reviewBoardId);
        }

        throw new BusinessException(ErrorCode.INVALID_REQUEST, "지원하지 않는 댓글 대상 타입입니다.");
    }

    @Transactional
    public void delete(Long userId, ReplyTargetType targetType, Long replyId) {
        LocalDateTime now = LocalDateTime.now();

        if (targetType == ReplyTargetType.POST) {
            PostComment comment = postCommentRepository.findByCommentIdAndDeletedFalse(replyId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "댓글이 존재하지 않습니다."));

            if (!comment.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "삭제 권한이 없습니다.");
            }

            postCommentRepository.save(comment.markDeleted(now));
            return;
        }

        if (targetType == ReplyTargetType.REVIEW) {
            ReviewComment comment = reviewCommentRepository.findByCommentIdAndDeletedFalse(replyId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "댓글이 존재하지 않습니다."));

            if (!comment.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "삭제 권한이 없습니다.");
            }

            reviewCommentRepository.save(comment.markDeleted(now));
            return;
        }

        throw new BusinessException(ErrorCode.INVALID_REQUEST, "지원하지 않는 댓글 대상 타입입니다.");
    }

    private ReplyResponse toResponse(PostComment c, ReplyTargetType type, Long targetId, Long boardId) {
        String content = c.getContent();
        return ReplyResponse.builder()
                .replyId(c.getCommentId())
                .targetType(type)
                .targetId(targetId)
                .userId(c.getUserId())
                .writerEmail(getWriterEmail(c.getUserId()))
                .content(content)
                .status(c.isDeleted() ? ReplyStatus.DELETED : ReplyStatus.ACTIVE)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ReplyResponse toResponse(ReviewComment c, ReplyTargetType type, Long targetId, Long boardId) {
        String content = c.getContent();
        return ReplyResponse.builder()
                .replyId(c.getCommentId())
                .targetType(type)
                .targetId(targetId)
                .userId(c.getUserId())
                .writerEmail(getWriterEmail(c.getUserId()))
                .content(content)
                .status(c.isDeleted() ? ReplyStatus.DELETED : ReplyStatus.ACTIVE)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    /**
     * 운영 환경에서 과도한 페이징 요청으로 DB 부하가 커지는 것을 방지하기 위해,
     * page/size 범위를 서비스 레이어에서 한번 더 제한한다.
     */
    private void validatePageRequest(int page, int size) {
        if (page < 0) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "page는 0 이상이어야 합니다.");
        }
        if (size < 1 || size > 100) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "size는 1~100 범위여야 합니다.");
        }
    }

}
