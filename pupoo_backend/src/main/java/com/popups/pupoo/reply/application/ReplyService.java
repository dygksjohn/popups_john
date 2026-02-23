// file: src/main/java/com/popups/pupoo/reply/application/ReplyService.java
package com.popups.pupoo.reply.application;

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

    public ReplyService(PostCommentRepository postCommentRepository,
                        ReviewCommentRepository reviewCommentRepository,
                        ReplyTargetValidator targetValidator) {
        this.postCommentRepository = postCommentRepository;
        this.reviewCommentRepository = reviewCommentRepository;
        this.targetValidator = targetValidator;
    }

    @Transactional
    public ReplyResponse create(Long userId, ReplyCreateRequest request) {
        targetValidator.validate(request.getTargetType(), request.getTargetId());

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

        if (targetType == ReplyTargetType.POST) {
            PostComment comment = postCommentRepository.findByCommentIdAndDeletedFalse(replyId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "댓글이 존재하지 않습니다."));

            if (!comment.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "수정 권한이 없습니다.");
            }

            PostComment saved = postCommentRepository.save(comment.updateContent(request.getContent(), now));
            return toResponse(saved, ReplyTargetType.POST, comment.getPostId());
        }

        if (targetType == ReplyTargetType.REVIEW) {
            ReviewComment comment = reviewCommentRepository.findByCommentIdAndDeletedFalse(replyId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "댓글이 존재하지 않습니다."));

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
}
