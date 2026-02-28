package com.popups.pupoo.gallery.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.popups.pupoo.storage.application.StorageService;
import com.popups.pupoo.storage.dto.UploadResponse;

import lombok.RequiredArgsConstructor;

/**
 * 갤러리 이미지 업로드 전용 컨트롤러.
 * GET /{galleryId} 와 경로가 겹치지 않도록 /api/galleries/image 하위로 분리.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/galleries/image")
public class GalleryImageUploadController {

    private final StorageService storageService;

    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> upload(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(storageService.uploadForGalleryTemp(file));
    }
}
