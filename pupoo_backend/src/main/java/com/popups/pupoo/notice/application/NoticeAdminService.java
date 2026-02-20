/* file: src/main/java/com/popups/pupoo/notice/application/NoticeAdminService.java
 * 목적: 공지 관리자용 생성/수정/삭제 서비스
 */
package com.popups.pupoo.notice.application;

import com.popups.pupoo.notice.domain.model.Notice;
import com.popups.pupoo.notice.dto.*;
import com.popups.pupoo.notice.persistence.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeAdminService {

    private final NoticeRepository noticeRepository;

    @Transactional
    public NoticeResponse create(Long adminUserId, NoticeCreateRequest request) {
        Notice notice = Notice.builder()
                .scope(request.getScope())
                .eventId(request.getEventId())
                .noticeTitle(request.getTitle())
                .content(request.getContent())
                .fileAttached("N")
                .pinned(Boolean.TRUE.equals(request.getPinned()))
                .status(request.getStatus())
                .createdByAdminId(adminUserId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return toResponse(noticeRepository.save(notice));
    }

    @Transactional
    public NoticeResponse update(Long noticeId, NoticeUpdateRequest request) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("공지사항이 존재하지 않습니다."));

        Notice updated = notice.toBuilder()
                .noticeTitle(request.getTitle())
                .content(request.getContent())
                .pinned(Boolean.TRUE.equals(request.getPinned()))
                .status(request.getStatus())
                .updatedAt(LocalDateTime.now())
                .build();

        return toResponse(noticeRepository.save(updated));
    }

    @Transactional
    public void delete(Long noticeId) {
        noticeRepository.deleteById(noticeId);
    }

    private NoticeResponse toResponse(Notice n) {
        return NoticeResponse.builder()
                .noticeId(n.getNoticeId())
                .scope(n.getScope())
                .eventId(n.getEventId())
                .title(n.getNoticeTitle())
                .content(n.getContent())
                .pinned(n.isPinned())
                .status(n.getStatus())
                .createdByAdminId(n.getCreatedByAdminId())
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }
}
