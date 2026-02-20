package com.popups.pupoo.notice.persistence;

import com.popups.pupoo.notice.domain.enums.NoticeStatus;
import com.popups.pupoo.notice.domain.model.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 공지 레포지토리 (pupoo_v3.1 notices 테이블)
 */
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    /**
     * 공개된 공지 목록 (고정 공지 우선, 이후 최신순)
     * GET /api/notices 목록 조회용
     */
    Page<Notice> findByStatusOrderByPinnedDescCreatedAtDesc(NoticeStatus status, Pageable pageable);
}