// file: src/main/java/com/popups/pupoo/gallery/api/GalleryController.java
package com.popups.pupoo.gallery.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.PageResponse;
import com.popups.pupoo.gallery.application.GalleryAdminService;
import com.popups.pupoo.gallery.application.GalleryService;
import com.popups.pupoo.gallery.dto.GalleryCreateRequest;
import com.popups.pupoo.gallery.dto.GalleryLikeResponse;
import com.popups.pupoo.gallery.dto.GalleryResponse;
import com.popups.pupoo.gallery.dto.GalleryUpdateRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/galleries")
public class GalleryController {

    private final GalleryService galleryService;
    private final GalleryAdminService galleryAdminService;

    @GetMapping("/{galleryId}")
    public ResponseEntity<GalleryResponse> get(@PathVariable Long galleryId) {
        return ResponseEntity.ok(galleryService.get(galleryId));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<GalleryResponse>>> list(
            @RequestParam(name = "page",defaultValue = "0") int page,
            @RequestParam(name = "size",defaultValue = "10") int size) {
        return ResponseEntity.ok(
                ApiResponse.success(PageResponse.from(galleryService.list(page, size)))
        );
    }

    @PostMapping
    public ResponseEntity<GalleryResponse> create(@Valid @RequestBody GalleryCreateRequest request) {
        return ResponseEntity.ok(galleryAdminService.create(request));
    }

    @PatchMapping("/{galleryId}")
    public ResponseEntity<GalleryResponse> update(@PathVariable Long galleryId,
                                                  @Valid @RequestBody GalleryUpdateRequest request) {
        return ResponseEntity.ok(galleryAdminService.update(galleryId, request));
    }

    @DeleteMapping("/{galleryId}")
    public ResponseEntity<Void> delete(@PathVariable Long galleryId) {
        galleryAdminService.delete(galleryId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{galleryId}/like")
    public ResponseEntity<GalleryLikeResponse> like(@RequestHeader("X-USER-ID") Long userId,
                                                    @PathVariable Long galleryId) {
        return ResponseEntity.ok(galleryService.like(userId, galleryId));
    }

    @DeleteMapping("/{galleryId}/like")
    public ResponseEntity<Void> unlike(@RequestHeader("X-USER-ID") Long userId,
                                       @PathVariable Long galleryId) {
        galleryService.unlike(userId, galleryId);
        return ResponseEntity.noContent().build();
    }
}
