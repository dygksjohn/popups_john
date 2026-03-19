// file: src/main/java/com/popups/pupoo/board/qna/application/QnaService.java
package com.popups.pupoo.board.qna.application;

import com.popups.pupoo.board.bannedword.application.BannedWordService;
import com.popups.pupoo.board.bannedword.application.ModerationClient;
import com.popups.pupoo.board.bannedword.application.ModerationResult;
import com.popups.pupoo.board.bannedword.domain.enums.BannedLogContentType;
import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import com.popups.pupoo.board.boardinfo.domain.model.Board;
import com.popups.pupoo.board.boardinfo.persistence.BoardRepository;
import com.popups.pupoo.board.post.domain.enums.PostStatus;
import com.popups.pupoo.board.post.domain.model.Post;
import com.popups.pupoo.board.post.persistence.PostRepository;
import com.popups.pupoo.board.qna.domain.enums.QnaStatus;
import com.popups.pupoo.board.qna.dto.QnaCreateRequest;
import com.popups.pupoo.board.qna.dto.QnaResponse;
import com.popups.pupoo.board.qna.dto.QnaUpdateRequest;
import com.popups.pupoo.board.qna.persistence.QnaRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.user.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 사용자 QnA 게시글 생성과 공개 조회를 담당한다.
 * 답변 여부는 answeredAt 존재 여부를 기준으로 WAITING/ANSWERED로 계산한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QnaService {

    private final QnaRepository qnaRepository;
    private final BoardRepository boardRepository;
    private final BannedWordService bannedWordService;
    private final ModerationClient moderationClient;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    /**
     * QNA 게시판에 공개 상태의 질문 글을 생성한다.
     * 차단 정책에 걸리면 저장하지 않고 moderation 로그만 남긴다.
     */
    @Transactional
    public QnaResponse create(Long userId, QnaCreateRequest request) {
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND, "사용자를 찾을 수 없습니다. 다시 로그인해 주세요.");
        }

        Board qnaBoard = boardRepository.findByBoardType(BoardType.QNA)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "QNA 게시판(board_type=QNA)이 존재하지 않습니다."));

        ModerationResult modResult = null;
        if (!bannedWordService.shouldSkipModeration(userId)) {
            String textToModerate = (request.getTitle() != null ? request.getTitle() : "") + " " + (request.getContent() != null ? request.getContent() : "");
            modResult = moderationClient.moderate(textToModerate.trim(), qnaBoard.getBoardId(), "POST");
            if (modResult != null && modResult.isBlock()) {
                bannedWordService.logAiModeration(
                        qnaBoard.getBoardId(),
                        null,
                        BannedLogContentType.POST,
                        userId,
                        modResult
                );
                throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "QnA 내용이 정책을 위반하여 등록할 수 없습니다.");
            }
        }

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

        Post saved = qnaRepository.save(post);
        return toResponse(saved);
    }

    /**
     * 사용자 QnA 상세 조회는 공개 상태 글만 허용하고 조회수 증가를 함께 수행한다.
     */
    @Transactional
    public QnaResponse get(Long qnaId) {
        Post post = qnaRepository.findQnaPublishedById(qnaId, PostStatus.PUBLISHED)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "QnA가 존재하지 않습니다."));

        postRepository.increaseViewCount(post.getPostId());
        int viewCountAfter = postRepository.getViewCountByPostId(post.getPostId());

        return toResponse(post, viewCountAfter);
    }

    public Page<QnaResponse> list(int page, int size) {
        return list(page, size, null);
    }

    /**
     * WAITING/ANSWERED 필터는 answeredAt 존재 여부 기준으로 해석한다.
     */
    public Page<QnaResponse> list(int page, int size, String statusFilter) {
        validatePageRequest(page, size);
        Boolean answeredOnly = null;
        if (statusFilter != null && !statusFilter.isBlank()) {
            if ("ANSWERED".equalsIgnoreCase(statusFilter)) {
                answeredOnly = true;
            } else if ("WAITING".equalsIgnoreCase(statusFilter)) {
                answeredOnly = false;
            }
        }
        Page<Post> result = answeredOnly != null
                ? qnaRepository.findAllQnaPublishedWithAnsweredFilter(PostStatus.PUBLISHED, answeredOnly, PageRequest.of(page, size))
                : qnaRepository.findAllQnaPublished(PostStatus.PUBLISHED, PageRequest.of(page, size));
        return result.map(this::toResponse);
    }

    /**
     * 수정은 작성자 본인만 허용하며, 현재 구현에서는 공개 상태 질문만 수정 가능하다.
     */
    @Transactional
    public QnaResponse update(Long userId, Long qnaId, QnaUpdateRequest request) {
        Post post = qnaRepository.findQnaPublishedById(qnaId, PostStatus.PUBLISHED)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "QnA가 존재하지 않습니다."));

        if (!post.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "수정 권한이 없습니다.");
        }

        post.updateTitleAndContent(request.getTitle(), request.getContent());

        Post saved = qnaRepository.save(post);
        return toResponse(saved);
    }

    /**
     * 삭제는 숨김 처리 후 deleted 플래그를 세우는 soft delete 흐름이다.
     */
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

    /**
     * close는 삭제와 달리 질문을 유지한 채 추가 답변 흐름만 종료한다.
     */
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
     * 과도한 페이지 요청으로 인한 조회 부하를 막기 위해 범위를 제한한다.
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
        return toResponse(post, post.getViewCount());
    }

    private QnaResponse toResponse(Post post, int viewCount) {
        String writerEmail = post.getUserId() != null
                ? userRepository.findById(post.getUserId()).map(u -> u.getEmail()).orElse(null)
                : null;
        Long boardId = post.getBoard() != null ? post.getBoard().getBoardId() : null;
        return QnaResponse.builder()
                .qnaId(post.getPostId())
                .boardId(post.getBoard().getBoardId())
                .userId(post.getUserId())
                .writerEmail(writerEmail)
                .title(post.getPostTitle())
                .content(post.getContent())
                .status(post.getAnsweredAt() == null ? QnaStatus.WAITING : QnaStatus.ANSWERED)
                .answerContent(post.getAnswerContent())
                .answeredAt(post.getAnsweredAt())
                .viewCount(viewCount)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
