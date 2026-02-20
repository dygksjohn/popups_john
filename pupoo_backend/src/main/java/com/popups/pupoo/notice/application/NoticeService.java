/* file: src/main/java/com/popups/pupoo/notice/application/NoticeService.java
 * 목적: 공지 조회 서비스
 */
package com.popups.pupoo.notice.application;

import com.popups.pupoo.notice.domain.model.Notice;
import com.popups.pupoo.notice.dto.NoticeResponse;
import com.popups.pupoo.notice.persistence.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final NoticeRepository noticeRepository;

    public NoticeResponse get(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("공지사항이 존재하지 않습니다."));
        return toResponse(notice);
    }

    public Page<NoticeResponse> list(int page, int size) {
        return noticeRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    protected NoticeResponse toResponse(Notice n) {
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
