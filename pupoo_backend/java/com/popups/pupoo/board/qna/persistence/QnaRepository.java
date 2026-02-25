// file: src/main/java/com/popups/pupoo/board/qna/persistence/QnaRepository.java
package com.popups.pupoo.board.qna.persistence;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.popups.pupoo.board.post.domain.model.Post;

public interface QnaRepository extends JpaRepository<Post, Long> {

    @Query("""
        select p
        from Post p
        join p.board b
        where b.boardType = com.popups.pupoo.board.boardinfo.domain.enums.BoardType.QNA
          and p.deleted = false
        order by p.createdAt desc
    """)
    Page<Post> findAllQna(Pageable pageable);

    @Query("""
        select p
        from Post p
        join p.board b
        where b.boardType = com.popups.pupoo.board.boardinfo.domain.enums.BoardType.QNA
          and p.deleted = false
          and p.postId = :postId
    """)
    Optional<Post> findQnaById(@Param("postId") Long postId);
}
