// file: src/main/java/com/popups/pupoo/gallery/api/GalleryAdminController.java
package com.popups.pupoo.gallery.api;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.IdResponse;
import com.popups.pupoo.gallery.application.GalleryAdminService;
import com.popups.pupoo.gallery.dto.GalleryCreateRequest;
import com.popups.pupoo.gallery.dto.GalleryResponse;
import com.popups.pupoo.gallery.dto.GalleryUpdateRequest;

/**
 * 관리자용 갤러리 API
 * - POST /api/galleries
 * - PATCH /api/galleries/{galleryId}
 * - DELETE /api/galleries/{galleryId}
 */
@RestController
@RequestMapping("/api/admin/galleries")
public class GalleryAdminController {

    private final GalleryAdminService galleryAdminService;
    private final SecurityUtil securityUtil;
    
    public GalleryAdminController(GalleryAdminService galleryAdminService, SecurityUtil securityUtil) {
        this.galleryAdminService = galleryAdminService;
        this.securityUtil = securityUtil;
    }
    
    @PostMapping
    public ApiResponse<GalleryResponse> create(@RequestBody GalleryCreateRequest request) {
        Long adminUserId = securityUtil.currentUserId();
        return ApiResponse.success(galleryAdminService.create(adminUserId, request));
    }

    @PatchMapping("/{galleryId}")
    public ApiResponse<GalleryResponse> update(
            @PathVariable("galleryId") Long galleryId,
            @RequestBody GalleryUpdateRequest request) {
        return ApiResponse.success(galleryAdminService.update(galleryId, request));
    }

    @DeleteMapping("/{galleryId}")
    public ApiResponse<IdResponse> delete(@PathVariable("galleryId") Long galleryId) {
        galleryAdminService.delete(galleryId);
        return ApiResponse.success(new IdResponse(galleryId));
    }
}
