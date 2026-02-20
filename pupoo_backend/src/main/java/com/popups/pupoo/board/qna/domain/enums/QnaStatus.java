/* file: src/main/java/com/popups/pupoo/board/qna/domain/enums/QnaStatus.java
 * 목적: QnA 조회/응답용 상태 정의
 * 주의: DB에는 별도 qnas 테이블이 없으므로 posts.status 기반으로 변환한다.
 */
package com.popups.pupoo.board.qna.domain.enums;

public enum QnaStatus {
    OPEN, CLOSED
}
