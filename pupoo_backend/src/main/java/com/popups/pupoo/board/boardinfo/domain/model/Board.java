/* file: src/main/java/com/popups/pupoo/board/boardinfo/domain/model/Board.java
 * 목적: boards 테이블 엔티티 매핑
 * 주의:
 *  - board_type은 MySQL ENUM이므로 columnDefinition으로 DB 정합성(validate) 보장
 *  - is_active는 TINYINT(0/1) 컬럼이므로 columnDefinition으로 타입 정합성(validate) 보장
 */
package com.popups.pupoo.board.boardinfo.domain.model;

import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "boards")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_id", nullable = false)
    private Long boardId;

    @Column(name = "board_name", nullable = false, length = 50)
    private String boardName;

    @Enumerated(EnumType.STRING)
    @Column(name = "board_type", nullable = false, columnDefinition = "ENUM('FREE','INFO','REVIEW','QNA')")
    private BoardType boardType;

    @Column(name = "is_active", nullable = false, columnDefinition = "TINYINT(1)")
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
