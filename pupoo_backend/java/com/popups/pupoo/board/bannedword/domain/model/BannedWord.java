// file: src/main/java/com/popups/pupoo/board/bannedword/domain/model/BannedWord.java
package com.popups.pupoo.board.bannedword.domain.model;

import java.time.LocalDateTime;

import com.popups.pupoo.board.boardinfo.domain.model.Board;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 금칙어 엔티티
 *
 * - DB: board_banned_words
 * - 정책: 게시판(board_id) 단위로 금칙어를 관리한다.
 */
@Entity
@Table(name = "board_banned_words")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class BannedWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "banned_word_id", nullable = false)
    private Long bannedWordId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(name = "banned_word", nullable = false, length = 100)
    private String bannedWord;

    // banned_word_norm은 GENERATED 컬럼이므로 매핑하지 않는다.

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
