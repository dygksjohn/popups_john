// file: src/main/java/com/popups/pupoo/notice/application/NoticeAdminService.java
package com.popups.pupoo.notice.application;

import com.popups.pupoo.common.audit.application.AdminLogService;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.notice.domain.enums.NoticeStatus;
import com.popups.pupoo.notice.domain.model.Notice;
import com.popups.pupoo.notice.dto.NoticeCreateRequest;
import com.popups.pupoo.notice.dto.NoticeResponse;
import com.popups.pupoo.notice.dto.NoticeUpdateRequest;
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
    private final AdminLogService adminLogService;

    /**
     * 공지사항 생성(관리자)
     */
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

        Notice saved = noticeRepository.save(notice);
        adminLogService.write("NOTICE_CREATE", AdminTargetType.NOTICE, saved.getNoticeId());
        return toResponse(saved);
    }

    /**
     * 공지사항 수정(관리자)
     */
    @Transactional
    public NoticeResponse update(Long noticeId, NoticeUpdateRequest request) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "공지사항이 존재하지 않습니다."));

        Notice updated = notice.toBuilder()
                .noticeTitle(request.getTitle())
                .content(request.getContent())
                .pinned(Boolean.TRUE.equals(request.getPinned()))
                .status(request.getStatus())
                .updatedAt(LocalDateTime.now())
                .build();

        Notice saved = noticeRepository.save(updated);
        adminLogService.write("NOTICE_UPDATE", AdminTargetType.NOTICE, noticeId);
        return toResponse(saved);
    }

    /**
     * 공지사항 삭제(관리자)
     * - 운영 안정성을 위해 물리 삭제 대신 상태를 HIDDEN으로 변경한다.
     */
    @Transactional
    public void delete(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "공지사항이 존재하지 않습니다."));

        Notice updated = notice.toBuilder()
                .status(NoticeStatus.HIDDEN)
                .pinned(false)
                .updatedAt(LocalDateTime.now())
                .build();

        noticeRepository.save(updated);
        adminLogService.write("NOTICE_DELETE_SOFT", AdminTargetType.NOTICE, noticeId);
    }

    private NoticeResponse toResponse(Notice n) {
        // PUBLIC 조회 정책에 따라 createdByAdminId는 응답에 포함하지 않는다.
        return NoticeResponse.builder()
                .noticeId(n.getNoticeId())
                .scope(n.getScope())
                .eventId(n.getEventId())
                .title(n.getNoticeTitle())
                .content(n.getContent())
                .pinned(n.isPinned())
                .status(n.getStatus())
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }
}
