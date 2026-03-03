// file: src/main/java/com/popups/pupoo/board/qna/application/QnaService.java
package com.popups.pupoo.board.qna.application;

import com.popups.pupoo.board.bannedword.application.BannedWordService;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.domain.model.Board;
import com.popups.pupoo.board.boardinfo.persistence.BoardRepository;
import com.popups.pupoo.board.post.domain.enums.PostStatus;
import com.popups.pupoo.board.post.domain.model.Post;
import com.popups.pupoo.board.qna.domain.enums.QnaStatus;
import com.popups.pupoo.board.qna.dto.*;
import com.popups.pupoo.board.qna.persistence.QnaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QnaService {

    private final QnaRepository qnaRepository;
    private final BoardRepository boardRepository;
    private final BannedWordService bannedWordService;

    @Transactional
    public QnaResponse create(Long userId, QnaCreateRequest request) {
        Board qnaBoard = boardRepository.findByBoardType(BoardType.QNA)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "QNA 게시판(board_type=QNA)이 존재하지 않습니다."));

        // 금칙어 검증 (QnA 작성 포함)
        bannedWordService.validate(qnaBoard.getBoardId(), request.getTitle(), request.getContent());

        Post post = Post.builder()
                .board(qnaBoard)
                .userId(userId)
                .postTitle(request.getTitle())
                .content(request.getContent())
                .fileAttached("N")
                .status(PostStatus.PUBLISHED)
                .viewCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .deleted(false)
                .commentEnabled(false)
                .build();

        return toResponse(qnaRepository.save(post));
    }

    public QnaResponse get(Long qnaId) {
        Post post = qnaRepository.findQnaPublishedById(qnaId, PostStatus.PUBLISHED)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "QnA가 존재하지 않습니다."));
        return toResponse(post);
    }

    public Page<QnaResponse> list(int page, int size) {
        validatePageRequest(page, size);
        Page<Post> result = qnaRepository.findAllQnaPublished(PostStatus.PUBLISHED, PageRequest.of(page, size));
        return result.map(this::toResponse);
    }

    @Transactional
    public QnaResponse update(Long userId, Long qnaId, QnaUpdateRequest request) {
        Post post = qnaRepository.findQnaPublishedById(qnaId, PostStatus.PUBLISHED)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "QnA가 존재하지 않습니다."));

        if (!post.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "수정 권한이 없습니다.");
        }

        // 금칙어 검증 (QnA 수정 포함)
        bannedWordService.validate(post.getBoard().getBoardId(), request.getTitle(), request.getContent());

        post.updateTitleAndContent(request.getTitle(), request.getContent());

        // 운영안정(v2): mutating + dirty checking 기반으로 updatedAt은 @PreUpdate에서 자동 반영된다.
        return toResponse(qnaRepository.save(post));
    }

    @Transactional
    public void delete(Long userId, Long qnaId) {
        Post post = qnaRepository.findQnaPublishedById(qnaId, PostStatus.PUBLISHED)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "QnA가 존재하지 않습니다."));

        if (!post.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "삭제 권한이 없습니다.");
        }

        post.hide();
        post.markDeleted();
        qnaRepository.save(post);
    }

    @Transactional
    public void close(Long userId, Long qnaId) {
        Post post = qnaRepository.findQnaPublishedById(qnaId, PostStatus.PUBLISHED)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "QnA가 존재하지 않습니다."));

        if (!post.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "마감 권한이 없습니다.");
        }

        post.close();
        qnaRepository.save(post);
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

private QnaResponse toResponse(Post post) {
        return QnaResponse.builder()
                .qnaId(post.getPostId())
                .boardId(post.getBoard().getBoardId())
                .userId(post.getUserId())
                .title(post.getPostTitle())
                .content(post.getContent())
                .status(post.getAnsweredAt() == null ? QnaStatus.WAITING : QnaStatus.ANSWERED)
                .answerContent(post.getAnswerContent())
                .answeredAt(post.getAnsweredAt())
                .viewCount(post.getViewCount())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
