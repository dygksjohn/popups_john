// file: src/main/java/com/popups/pupoo/board/qna/persistence/QnaRepository.java
package com.popups.pupoo.board.qna.persistence;

import com.popups.pupoo.board.post.domain.enums.PostStatus;
import com.popups.pupoo.board.post.domain.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

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


    @Query("""
        select p
        from Post p
        join p.board b
        where b.boardType = com.popups.pupoo.board.boardinfo.domain.enums.BoardType.QNA
          and p.deleted = false
          and p.status = :status
        order by p.createdAt desc
    """)
    Page<Post> findAllQnaPublished(@Param("status") PostStatus status, Pageable pageable);

    @Query("""
        select p
        from Post p
        join p.board b
        where b.boardType = com.popups.pupoo.board.boardinfo.domain.enums.BoardType.QNA
          and p.deleted = false
          and p.status = :status
          and p.postId = :postId
    """)
    Optional<Post> findQnaPublishedById(@Param("postId") Long postId, @Param("status") PostStatus status);

}
