// file: src/main/java/com/popups/pupoo/notice/api/AdminNoticeController.java
package com.popups.pupoo.notice.api;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.IdResponse;
import com.popups.pupoo.notice.application.NoticeAdminService;
import com.popups.pupoo.notice.application.NoticeService;
import com.popups.pupoo.notice.dto.NoticeCreateRequest;
import com.popups.pupoo.notice.dto.NoticeResponse;
import com.popups.pupoo.notice.dto.NoticeUpdateRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 공지(관리자) API
 * - GET    /api/admin/notices
 * - GET    /api/admin/notices/{id}
 * - POST   /api/admin/notices
 * - PATCH  /api/admin/notices/{id}
 * - DELETE /api/admin/notices/{id} (soft delete)
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/notices")
public class AdminNoticeController {

    private final NoticeService noticeService;
    private final NoticeAdminService noticeAdminService;
    private final SecurityUtil securityUtil;

    @GetMapping
    public ApiResponse<Page<NoticeResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(noticeService.list(page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<NoticeResponse> get(@PathVariable Long id) {
        return ApiResponse.success(noticeService.get(id));
    }

    @PostMapping
    public ApiResponse<NoticeResponse> create(@Valid @RequestBody NoticeCreateRequest request) {
        Long adminUserId = securityUtil.currentUserId();
        return ApiResponse.success(noticeAdminService.create(adminUserId, request));
    }

    @PatchMapping("/{id}")
    public ApiResponse<NoticeResponse> update(@PathVariable Long id, @Valid @RequestBody NoticeUpdateRequest request) {
        return ApiResponse.success(noticeAdminService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<IdResponse> delete(@PathVariable Long id) {
        noticeAdminService.delete(id);
        return ApiResponse.success(new IdResponse(id));
    }
}
