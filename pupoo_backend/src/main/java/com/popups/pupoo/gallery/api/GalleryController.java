/* file: src/main/java/com/popups/pupoo/gallery/api/GalleryController.java
 * 목적: 갤러리 API 컨트롤러
 */
package com.popups.pupoo.gallery.api;

import com.popups.pupoo.gallery.application.GalleryAdminService;
import com.popups.pupoo.gallery.application.GalleryService;
import com.popups.pupoo.gallery.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<Page<GalleryResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(galleryService.list(page, size));
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
}
