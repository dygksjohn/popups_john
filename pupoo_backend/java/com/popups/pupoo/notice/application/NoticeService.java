// file: src/main/java/com/popups/pupoo/notice/application/NoticeService.java
package com.popups.pupoo.notice.application;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.common.search.SearchType;
import com.popups.pupoo.notice.domain.enums.NoticeStatus;
import com.popups.pupoo.notice.domain.model.Notice;
import com.popups.pupoo.notice.dto.NoticeResponse;
import com.popups.pupoo.notice.persistence.NoticeRepository;

import lombok.RequiredArgsConstructor;

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

    /**
     * (관리자/공용) 검색 없이 목록 조회
     * - AdminNoticeController가 호출하는 시그니처(list(page,size))를 유지한다.
     * - 검색 분기 로직은 SearchType.TITLE_CONTENT + 빈 키워드로 통일한다. (null 사용 안 함)
     */
    public Page<NoticeResponse> list(int page, int size) {
        return list(SearchType.TITLE_CONTENT, "", page, size);
    }

    public Page<NoticeResponse> list(SearchType searchType, String keyword, int page, int size) {
        validatePageRequest(page, size);
        PageRequest pageable = PageRequest.of(page, size);

        SearchType type = (searchType == null) ? SearchType.TITLE_CONTENT : searchType;
        String kw = (keyword == null) ? "" : keyword.trim();

        // 키워드가 비어있으면 "검색"이 아니라 전체 목록으로 처리 (일관된 정책)
        if (kw.isBlank()) {
            return noticeRepository.findByStatus(NoticeStatus.PUBLISHED, pageable)
                    .map(this::toResponse);
        }

        return switch (type) {
            case TITLE -> noticeRepository.searchByTitle(NoticeStatus.PUBLISHED, kw, pageable).map(this::toResponse);
            case CONTENT -> noticeRepository.searchByContent(NoticeStatus.PUBLISHED, kw, pageable).map(this::toResponse);
            case WRITER -> {
                Long adminId = parseLongOrNull(kw);
                if (adminId == null) {
                    yield Page.empty(pageable);
                }
                yield noticeRepository.findByStatusAndCreatedByAdminId(NoticeStatus.PUBLISHED, adminId, pageable)
                        .map(this::toResponse);
            }
            case TITLE_CONTENT -> noticeRepository.searchByTitleOrContent(NoticeStatus.PUBLISHED, kw, pageable).map(this::toResponse);
        };
    }

    private static Long parseLongOrNull(String keyword) {
        if (keyword == null || keyword.isBlank()) return null;
        try {
            return Long.parseLong(keyword.trim());
        } catch (NumberFormatException e) {
            return null;
        }
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