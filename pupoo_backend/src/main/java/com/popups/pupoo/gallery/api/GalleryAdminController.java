package com.popups.pupoo.gallery.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.gallery.application.GalleryAdminService;
import com.popups.pupoo.gallery.dto.GalleryCreateRequest;
import com.popups.pupoo.gallery.dto.GalleryResponse;
import com.popups.pupoo.gallery.dto.GalleryUpdateRequest;

import org.springframework.web.bind.annotation.*;

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

    public GalleryAdminController(GalleryAdminService galleryAdminService) {
        this.galleryAdminService = galleryAdminService;
    }

    @PostMapping
    public ApiResponse<GalleryResponse> create(@RequestBody GalleryCreateRequest request) {
        return ApiResponse.success(galleryAdminService.create(request));
    }

    @PatchMapping("/{galleryId}")
    public ApiResponse<GalleryResponse> update(
            @PathVariable("galleryId") Long galleryId,
            @RequestBody GalleryUpdateRequest request) {
        return ApiResponse.success(galleryAdminService.update(galleryId, request));
    }

    @DeleteMapping("/{galleryId}")
    public ApiResponse<Void> delete(@PathVariable("galleryId") Long galleryId) {
        galleryAdminService.delete(galleryId);
        return ApiResponse.success(null);
    }
}
