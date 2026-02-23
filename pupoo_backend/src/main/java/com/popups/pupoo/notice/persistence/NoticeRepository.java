// file: src/main/java/com/popups/pupoo/notice/persistence/NoticeRepository.java
package com.popups.pupoo.notice.persistence;

import com.popups.pupoo.notice.domain.model.Notice;
import com.popups.pupoo.notice.domain.enums.NoticeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // 공개 조회: PUBLISHED 상태 공지만 조회
    Page<Notice> findByStatus(NoticeStatus status, Pageable pageable);

}
