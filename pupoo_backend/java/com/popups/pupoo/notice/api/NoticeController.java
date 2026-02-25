// file: src/main/java/com/popups/pupoo/notice/api/NoticeController.java
package com.popups.pupoo.notice.api;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.search.SearchType;
import com.popups.pupoo.notice.application.NoticeService;
import com.popups.pupoo.notice.dto.NoticeResponse;

import lombok.RequiredArgsConstructor;

/**
 * 공지(사용자) API
 * - GET /api/notices
 * - GET /api/notices/{noticeId}
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public ApiResponse<Page<NoticeResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String searchType,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.success(noticeService.list(SearchType.from(searchType), keyword, page, size));
    }

    @GetMapping("/{noticeId}")
    public ApiResponse<NoticeResponse> get(@PathVariable Long noticeId) {
        return ApiResponse.success(noticeService.get(noticeId));
    }
}
