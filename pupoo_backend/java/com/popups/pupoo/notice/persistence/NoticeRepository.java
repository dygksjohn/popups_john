// file: src/main/java/com/popups/pupoo/notice/persistence/NoticeRepository.java
package com.popups.pupoo.notice.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.popups.pupoo.notice.domain.enums.NoticeStatus;
import com.popups.pupoo.notice.domain.model.Notice;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // 공개 조회: PUBLISHED 상태 공지만 조회
    Page<Notice> findByStatus(NoticeStatus status, Pageable pageable);

    Page<Notice> findByStatusAndCreatedByAdminId(NoticeStatus status, Long createdByAdminId, Pageable pageable);

    @Query("""
        select n
        from Notice n
        where n.status = :status
          and (:keyword is null or :keyword = '' or n.noticeTitle like concat('%', :keyword, '%'))
        order by n.pinned desc, n.createdAt desc, n.noticeId desc
        """)
    Page<Notice> searchByTitle(@Param("status") NoticeStatus status,
                              @Param("keyword") String keyword,
                              Pageable pageable);

    @Query("""
        select n
        from Notice n
        where n.status = :status
          and (:keyword is null or :keyword = '' or n.content like concat('%', :keyword, '%'))
        order by n.pinned desc, n.createdAt desc, n.noticeId desc
        """)
    Page<Notice> searchByContent(@Param("status") NoticeStatus status,
                                @Param("keyword") String keyword,
                                Pageable pageable);

    @Query("""
        select n
        from Notice n
        where n.status = :status
          and (
                :keyword is null
             or :keyword = ''
             or n.noticeTitle like concat('%', :keyword, '%')
             or n.content like concat('%', :keyword, '%')
          )
        order by n.pinned desc, n.createdAt desc, n.noticeId desc
        """)
    Page<Notice> searchByTitleOrContent(@Param("status") NoticeStatus status,
                                       @Param("keyword") String keyword,
                                       Pageable pageable);

}
