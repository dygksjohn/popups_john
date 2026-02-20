package com.popups.pupoo.notice.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.notice.domain.enums.NoticeStatus;
import com.popups.pupoo.notice.domain.model.Notice;
import com.popups.pupoo.notice.dto.NoticeResponse;
import com.popups.pupoo.notice.persistence.NoticeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * 공지 조회 서비스 (사용자 API, pupoo_v3.1)
 * GET /api/notices, GET /api/notices/{noticeId} — PUBLISHED만 노출
 */
@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;

    public NoticeService(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    /** 공개된 공지 목록 (고정 우선, 최신순) */
    public Page<NoticeResponse> getNotices(Pageable pageable) {
        return noticeRepository
                .findByStatusOrderByPinnedDescCreatedAtDesc(NoticeStatus.PUBLISHED, pageable)
                .map(NoticeResponse::from);
    }

    /** 공지 단건 조회 (PUBLISHED만 반환, 없거나 비공개면 예외) */
    public NoticeResponse getNotice(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST, "존재하지 않는 공지입니다. noticeId=" + noticeId));
        if (notice.getStatus() != NoticeStatus.PUBLISHED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "존재하지 않는 공지입니다. noticeId=" + noticeId);
        }
        return NoticeResponse.from(notice);
    }
}