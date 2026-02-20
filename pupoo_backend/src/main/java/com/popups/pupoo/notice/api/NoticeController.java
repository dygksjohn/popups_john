package com.popups.pupoo.notice.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.PageResponse;
import com.popups.pupoo.notice.application.NoticeService;
import com.popups.pupoo.notice.dto.NoticeResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

/**
 * 공지 조회 API (사용자용, pupoo_v3.1)
 * GET /api/notices — 목록 (페이징, 고정 우선·최신순, PUBLISHED만)
 * GET /api/notices/{noticeId} — 단건
 */
@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;

    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    /** 공지 목록 (페이징, 고정 공지 우선·최신순) */
    @GetMapping
    public ApiResponse<PageResponse<NoticeResponse>> getNotices(Pageable pageable) {
        return ApiResponse.success(
                PageResponse.from(noticeService.getNotices(pageable))
        );
    }

    /** 공지 단건 조회 */
    @GetMapping("/{noticeId}")
    public ApiResponse<NoticeResponse> getNotice(@PathVariable("noticeId") Long noticeId) {
        return ApiResponse.success(noticeService.getNotice(noticeId));
    }
}