// file: src/main/java/com/popups/pupoo/board/boardinfo/domain/model/Board.java
package com.popups.pupoo.board.boardinfo.domain.model;

import java.time.LocalDateTime;

import com.popups.pupoo.board.boardinfo.domain.enums.BoardType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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
    @Column(name = "board_type", nullable = false, columnDefinition = "ENUM('FREE','INFO','REVIEW','QNA','FAQ')")
    private BoardType boardType;

    @Column(name = "is_active", nullable = false, columnDefinition = "TINYINT(1)")
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public void updateBoardName(String boardName) {
        this.boardName = boardName;
    }

    public void changeActive(boolean active) {
        this.active = active;
    }
}
