/* file: src/main/java/com/popups/pupoo/board/qna/domain/model/Qna.java
 * 목적: QnA 응답용 도메인 모델
 * 주의:
 *  - DB에는 qnas 테이블이 없고 posts에 저장된다.
 *  - 본 클래스는 JPA Entity가 아니다.
 */
package com.popups.pupoo.board.qna.domain.model;

import com.popups.pupoo.board.qna.domain.enums.QnaStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Qna {

    private Long qnaId;     // posts.post_id
    private Long boardId;   // boards.board_id
    private Long userId;    // users.user_id

    private String title;
    private String content;

    private QnaStatus status;

    private int viewCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
