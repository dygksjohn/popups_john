// file: src/main/java/com/popups/pupoo/reply/application/ReplyService.java
package com.popups.pupoo.reply.application;

import com.popups.pupoo.board.bannedword.application.BannedWordService;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public ReplyService(PostCommentRepository postCommentRepository,
                        ReviewCommentRepository reviewCommentRepository,
                        ReplyTargetValidator targetValidator,
                        PostRepository postRepository,
                        BoardRepository boardRepository,
                        BannedWordService bannedWordService) {
        this.postCommentRepository = postCommentRepository;
        this.reviewCommentRepository = reviewCommentRepository;
        this.targetValidator = targetValidator;
        this.postRepository = postRepository;
        this.boardRepository = boardRepository;
        this.bannedWordService = bannedWordService;
    }

    @Transactional
    public ReplyResponse create(Long userId, ReplyCreateRequest request) {
        targetValidator.validate(request.getTargetType(), request.getTargetId());

        // 댓글 정책: FAQ 및 댓글 비활성 게시글은 댓글 생성 불가
        if (request.getTargetType() == ReplyTargetType.POST) {
            validateReplyAllowedForPost(request.getTargetId());
        }

        // 금칙어 검증 (댓글 작성 포함)
        validateBannedWordsForReplyTarget(request.getTargetType(), request.getTargetId(), request.getContent());

        LocalDateTime now = LocalDateTime.now();

        if (request.getTargetType() == ReplyTargetType.POST) {
            PostComment saved = postCommentRepository.save(PostComment.builder()
                    .postId(request.getTargetId())
                    .userId(userId)
                    .content(request.getContent())
                    .createdAt(now)
                    .updatedAt(now)
                    .deleted(false)
                    .build());

            return toResponse(saved, ReplyTargetType.POST, request.getTargetId());
        }

        if (request.getTargetType() == ReplyTargetType.REVIEW) {
            ReviewComment saved = reviewCommentRepository.save(ReviewComment.builder()
                    .reviewId(request.getTargetId())
                    .userId(userId)
                    .content(request.getContent())
                    .createdAt(now)
                    .updatedAt(now)
                    .deleted(false)
                    .build());

            return toResponse(saved, ReplyTargetType.REVIEW, request.getTargetId());
        }

        throw new BusinessException(ErrorCode.INVALID_REQUEST, "지원하지 않는 댓글 대상 타입입니다.");
    }

    private void validateReplyAllowedForPost(Long postId) {
        Post post = postRepository.findByPostIdAndDeletedFalse(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "게시글이 존재하지 않습니다."));

        if (post.getBoard() != null && post.getBoard().getBoardType() == BoardType.FAQ) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "FAQ에는 댓글을 작성할 수 없습니다.");
        }
        if (!post.isCommentEnabled()) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "댓글이 비활성화된 게시글입니다.");
        }
    }

    public Page<ReplyResponse> list(ReplyTargetType targetType, Long targetId, int page, int size) {
        validatePageRequest(page, size);

        if (targetType == ReplyTargetType.POST) {
            return postCommentRepository
                    .findAllByPostIdAndDeletedFalseOrderByCreatedAtDesc(targetId, PageRequest.of(page, size))
                    .map(c -> toResponse(c, ReplyTargetType.POST, targetId));
        }

        if (targetType == ReplyTargetType.REVIEW) {
            return reviewCommentRepository
                    .findAllByReviewIdAndDeletedFalseOrderByCreatedAtDesc(targetId, PageRequest.of(page, size))
                    .map(c -> toResponse(c, ReplyTargetType.REVIEW, targetId));
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

            validateBannedWordsForReplyTarget(ReplyTargetType.POST, comment.getPostId(), request.getContent());

            if (!comment.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "수정 권한이 없습니다.");
            }

            PostComment saved = postCommentRepository.save(comment.updateContent(request.getContent(), now));
            return toResponse(saved, ReplyTargetType.POST, comment.getPostId());
        }

        if (targetType == ReplyTargetType.REVIEW) {
            ReviewComment comment = reviewCommentRepository.findByCommentIdAndDeletedFalse(replyId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "댓글이 존재하지 않습니다."));

            validateBannedWordsForReplyTarget(ReplyTargetType.REVIEW, comment.getReviewId(), request.getContent());

            if (!comment.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "수정 권한이 없습니다.");
            }

            ReviewComment saved = reviewCommentRepository.save(comment.updateContent(request.getContent(), now));
            return toResponse(saved, ReplyTargetType.REVIEW, comment.getReviewId());
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

    private ReplyResponse toResponse(PostComment c, ReplyTargetType type, Long targetId) {
        return ReplyResponse.builder()
                .replyId(c.getCommentId())
                .targetType(type)
                .targetId(targetId)
                .userId(c.getUserId())
                .content(c.getContent())
                .status(c.isDeleted() ? ReplyStatus.DELETED : ReplyStatus.ACTIVE)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ReplyResponse toResponse(ReviewComment c, ReplyTargetType type, Long targetId) {
        return ReplyResponse.builder()
                .replyId(c.getCommentId())
                .targetType(type)
                .targetId(targetId)
                .userId(c.getUserId())
                .content(c.getContent())
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

    /**
     * 댓글 대상별로 게시판을 식별하여 금칙어 검증을 수행한다.
     * - POST 댓글: post.board_id 기준
     * - REVIEW 댓글: boards(board_type=REVIEW) 기준
     */
    private void validateBannedWordsForReplyTarget(ReplyTargetType targetType, Long targetId, String content) {
        if (content == null) return;

        if (targetType == ReplyTargetType.POST) {
            Post post = postRepository.findByPostIdAndDeletedFalse(targetId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "게시글이 존재하지 않습니다."));
            bannedWordService.validate(post.getBoard().getBoardId(), content);
            return;
        }

        if (targetType == ReplyTargetType.REVIEW) {
            Long reviewBoardId = boardRepository.findByBoardType(BoardType.REVIEW)
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "REVIEW 게시판(board_type=REVIEW)이 존재하지 않습니다."))
                    .getBoardId();
            bannedWordService.validate(reviewBoardId, content);
            return;
        }
    }
}
