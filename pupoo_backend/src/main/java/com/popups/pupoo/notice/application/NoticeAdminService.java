package com.popups.pupoo.notice.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.notice.domain.enums.NoticeStatus;
import com.popups.pupoo.notice.domain.model.Notice;
import com.popups.pupoo.notice.dto.NoticeCreateRequest;
import com.popups.pupoo.notice.dto.NoticeResponse;
import com.popups.pupoo.notice.dto.NoticeUpdateRequest;
import com.popups.pupoo.notice.persistence.NoticeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 공지 관리 서비스 (관리자용, pupoo_v3.1)
 * 생성 / 수정 / 삭제
 */
@Service
public class NoticeAdminService {

    private final NoticeRepository noticeRepository;

    public NoticeAdminService(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    /**
     * 공지 생성.
     */
    @Transactional
    public NoticeResponse create(NoticeCreateRequest request, Long createdByAdminId) {
        String fileAttached = request.getFileAttached() != null ? request.getFileAttached() : "N";
        boolean pinned = request.getPinned() != null && request.getPinned();
        NoticeStatus status = request.getStatus() != null ? request.getStatus() : NoticeStatus.PUBLISHED;

        Notice notice = Notice.create(
                request.getScope(),
                request.getEventId(),
                request.getTitle(),
                request.getContent(),
                fileAttached,
                pinned,
                status,
                createdByAdminId
        );
        Notice saved = noticeRepository.save(notice);
        return NoticeResponse.from(saved);
    }

    @Transactional
    public NoticeResponse update(Long noticeId, NoticeUpdateRequest request) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST, "존재하지 않는 공지입니다. noticeId=" + noticeId));

        if (request.getScope() != null) notice.setScope(request.getScope());
        if (request.getEventId() != null) notice.setEventId(request.getEventId());
        if (request.getTitle() != null) notice.setTitle(request.getTitle());
        if (request.getContent() != null) notice.setContent(request.getContent());
        if (request.getFileAttached() != null) notice.setFileAttached(request.getFileAttached());
        if (request.getPinned() != null) notice.setPinned(request.getPinned());
        if (request.getStatus() != null) notice.setStatus(request.getStatus());

        Notice saved = noticeRepository.save(notice);
        return NoticeResponse.from(saved);
    }

    @Transactional
    public void delete(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST, "존재하지 않는 공지입니다. noticeId=" + noticeId));
        noticeRepository.delete(notice);
    }
}