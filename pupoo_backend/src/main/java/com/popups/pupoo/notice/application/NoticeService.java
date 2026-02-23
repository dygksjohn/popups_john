// file: src/main/java/com/popups/pupoo/notice/application/NoticeService.java
package com.popups.pupoo.notice.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.notice.domain.model.Notice;
import com.popups.pupoo.notice.domain.enums.NoticeStatus;
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
        // 공개 조회 정책: PUBLISHED만 조회 가능
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "공지사항이 존재하지 않습니다."));
        if (notice.getStatus() != NoticeStatus.PUBLISHED) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "공지사항이 존재하지 않습니다.");
        }
        return toResponse(notice);
    }

    public Page<NoticeResponse> list(int page, int size) {
        validatePageRequest(page, size);
        return noticeRepository.findByStatus(NoticeStatus.PUBLISHED, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    

/**
 * 운영 환경에서 과도한 페이징 요청으로 DB 부하가 커지는 것을 방지하기 위해,
 * page/size 범위를 서비스 레이어에서 한번 더 제한한다.
 */
private void validatePageRequest(int page, int size) {
    if (page < 0) {
        throw new BusinessException(ErrorCode.INVALID_REQUEST, "page는 0 이상이어야 합니다.");
    }
    if (size < 1 || size > 100) {
        throw new BusinessException(ErrorCode.INVALID_REQUEST, "size는 1~100 범위여야 합니다.");
    }
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
                                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }
}
