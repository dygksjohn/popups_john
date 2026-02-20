/* file: src/main/java/com/popups/pupoo/board/qna/application/QnaService.java
 * 목적: QnA 기능 구현(posts 기반)
 * 주의: QnA 전용 테이블(qnas)은 사용하지 않는다.
 */
package com.popups.pupoo.board.qna.application;

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

    @Transactional
    public QnaResponse create(Long userId, QnaCreateRequest request) {
        Board qnaBoard = boardRepository.findByBoardType(BoardType.QNA)
                .orElseThrow(() -> new IllegalStateException("QNA 게시판(board_type=QNA)이 존재하지 않습니다."));

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
                .commentEnabled(true)
                .build();

        return toResponse(qnaRepository.save(post));
    }

    public QnaResponse get(Long qnaId) {
        Post post = qnaRepository.findQnaById(qnaId)
                .orElseThrow(() -> new IllegalArgumentException("QnA가 존재하지 않습니다."));
        return toResponse(post);
    }

    public Page<QnaResponse> list(int page, int size) {
        Page<Post> result = qnaRepository.findAllQna(PageRequest.of(page, size));
        return result.map(this::toResponse);
    }

    @Transactional
    public QnaResponse update(Long userId, Long qnaId, QnaUpdateRequest request) {
        Post post = qnaRepository.findQnaById(qnaId)
                .orElseThrow(() -> new IllegalArgumentException("QnA가 존재하지 않습니다."));

        if (!post.getUserId().equals(userId)) {
            throw new SecurityException("수정 권한이 없습니다.");
        }

        Post updated = post.updateTitleAndContent(request.getTitle(), request.getContent())
                .toBuilder()
                .updatedAt(LocalDateTime.now())
                .build();

        return toResponse(qnaRepository.save(updated));
    }

    @Transactional
    public void delete(Long userId, Long qnaId) {
        Post post = qnaRepository.findQnaById(qnaId)
                .orElseThrow(() -> new IllegalArgumentException("QnA가 존재하지 않습니다."));

        if (!post.getUserId().equals(userId)) {
            throw new SecurityException("삭제 권한이 없습니다.");
        }

        qnaRepository.save(post.markDeleted().toBuilder().updatedAt(LocalDateTime.now()).build());
    }

    @Transactional
    public void close(Long userId, Long qnaId) {
        Post post = qnaRepository.findQnaById(qnaId)
                .orElseThrow(() -> new IllegalArgumentException("QnA가 존재하지 않습니다."));

        if (!post.getUserId().equals(userId)) {
            throw new SecurityException("마감 권한이 없습니다.");
        }

        qnaRepository.save(post.close().toBuilder().updatedAt(LocalDateTime.now()).build());
    }

    private QnaResponse toResponse(Post post) {
        return QnaResponse.builder()
                .qnaId(post.getPostId())
                .boardId(post.getBoard().getBoardId())
                .userId(post.getUserId())
                .title(post.getPostTitle())
                .content(post.getContent())
                .status(post.getStatus() == PostStatus.HIDDEN ? QnaStatus.CLOSED : QnaStatus.OPEN)
                .viewCount(post.getViewCount())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
