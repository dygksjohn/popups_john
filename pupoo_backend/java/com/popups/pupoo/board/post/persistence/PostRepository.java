// file: src/main/java/com/popups/pupoo/board/post/persistence/PostRepository.java
package com.popups.pupoo.board.post.persistence;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.popups.pupoo.board.post.domain.enums.PostStatus;
import com.popups.pupoo.board.post.domain.model.Post;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("""
        select p
        from Post p
        where p.board.boardId = :boardId
          and p.deleted = false
          and (:keyword is null or :keyword = '' or p.postTitle like concat('%', :keyword, '%'))
          and (:status is null or p.status = :status)
        """)
    Page<Post> searchByTitle(@Param("boardId") Long boardId,
                             @Param("keyword") String keyword,
                             @Param("status") PostStatus status,
                             Pageable pageable);

    @Query("""
        select p
        from Post p
        where p.board.boardId = :boardId
          and p.deleted = false
          and (:keyword is null or :keyword = '' or p.content like concat('%', :keyword, '%'))
          and (:status is null or p.status = :status)
        """)
    Page<Post> searchByContent(@Param("boardId") Long boardId,
                               @Param("keyword") String keyword,
                               @Param("status") PostStatus status,
                               Pageable pageable);

    @Query("""
        select p
        from Post p
        where p.board.boardId = :boardId
          and p.deleted = false
          and (:writerId is null or p.userId = :writerId)
          and (:status is null or p.status = :status)
        """)
    Page<Post> searchByWriter(@Param("boardId") Long boardId,
                              @Param("writerId") Long writerId,
                              @Param("status") PostStatus status,
                              Pageable pageable);

    @Query("""
        select p
        from Post p
        where p.board.boardId = :boardId
          and p.deleted = false
          and (
                :keyword is null
             or :keyword = ''
             or p.postTitle like concat('%', :keyword, '%')
             or p.content like concat('%', :keyword, '%')
          )
          and (:status is null or p.status = :status)
        """)
    Page<Post> search(@Param("boardId") Long boardId,
                      @Param("keyword") String keyword,
                      @Param("status") PostStatus status,
                      Pageable pageable);

    Optional<Post> findByPostIdAndDeletedFalse(Long postId);

    Optional<Post> findByPostIdAndUserIdAndDeletedFalse(Long postId, Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update Post p
        set p.viewCount = p.viewCount + 1
        where p.postId = :postId
          and p.deleted = false
        """)
    int increaseViewCount(@Param("postId") Long postId);

    /**
     * 관리자 모더레이션 큐 조회용: 삭제/숨김 포함 검색.
     */
    @Query("""
        select p
        from Post p
        where (:boardId is null or p.board.boardId = :boardId)
          and (:postIds is null or p.postId in :postIds)
          and (:userId is null or p.userId = :userId)
          and (:deleted is null or p.deleted = :deleted)
          and (:status is null or p.status = :status)
          and (
                :keyword is null
             or :keyword = ''
             or p.postTitle like concat('%', :keyword, '%')
             or p.content like concat('%', :keyword, '%')
          )
          and (:from is null or p.createdAt >= :from)
          and (:to is null or p.createdAt <= :to)
        """)
    Page<Post> adminSearch(@Param("boardId") Long boardId,
                           @Param("keyword") String keyword,
                           @Param("status") PostStatus status,
                           @Param("deleted") Boolean deleted,
                           @Param("userId") Long userId,
                           @Param("from") LocalDateTime from,
                           @Param("to") LocalDateTime to,
                           @Param("postIds") List<Long> postIds,
                           Pageable pageable);
}
