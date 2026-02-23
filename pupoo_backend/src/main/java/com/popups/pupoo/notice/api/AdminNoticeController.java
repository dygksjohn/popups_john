// file: src/main/java/com/popups/pupoo/notice/api/AdminNoticeController.java
package com.popups.pupoo.notice.api;

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
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping
    public ApiResponse<Page<NoticeResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(noticeService.list(page, size));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping("/{id}")
    public ApiResponse<NoticeResponse> get(@PathVariable Long id) {
        return ApiResponse.success(noticeService.get(id));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PostMapping
    public ApiResponse<NoticeResponse> create(@Valid @RequestBody NoticeCreateRequest request) {
        Long adminUserId = securityUtil.currentUserId();
        return ApiResponse.success(noticeAdminService.create(adminUserId, request));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PatchMapping("/{id}")
    public ApiResponse<NoticeResponse> update(@PathVariable Long id, @Valid @RequestBody NoticeUpdateRequest request) {
        return ApiResponse.success(noticeAdminService.update(id, request));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @DeleteMapping("/{id}")
    public ApiResponse<IdResponse> delete(@PathVariable Long id) {
        noticeAdminService.delete(id);
        return ApiResponse.success(new IdResponse(id));
    }
}
