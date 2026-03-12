package com.popups.pupoo.gallery.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.storage.application.StorageService;
import com.popups.pupoo.storage.infrastructure.StorageKeyGenerator;
import com.popups.pupoo.storage.dto.UploadResponse;
import com.popups.pupoo.storage.port.ObjectStoragePort;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequiredArgsConstructor
public class GalleryImageUploadController {

    private static final String STORAGE_BUCKET_UNUSED = "local";
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final StorageService storageService;
    private final ObjectStoragePort objectStoragePort;
    private final StorageKeyGenerator storageKeyGenerator;

    @PostMapping("/api/admin/galleries/images/upload")
    public ApiResponse<Map<String, List<String>>> uploadAdmin(
            @RequestPart("files") List<MultipartFile> files
    ) {
        if (files == null || files.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "File is required.");
        }
        if (files.size() > 10) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Up to 10 files can be uploaded.");
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            validateFile(file);
            try {
                String key = storageKeyGenerator.generateStandaloneKey("gallery", file.getOriginalFilename());
                objectStoragePort.putObject(STORAGE_BUCKET_UNUSED, key, file.getBytes(), file.getContentType());
                urls.add(objectStoragePort.getPublicPath(STORAGE_BUCKET_UNUSED, key));
            } catch (IOException e) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to read upload file: " + e.getMessage());
            }
        }
        return ApiResponse.success(Map.of("urls", urls));
    }

    @PostMapping("/api/galleries/image/upload")
    public ApiResponse<UploadResponse> uploadUser(@RequestPart("file") MultipartFile file) {
        return ApiResponse.success(storageService.uploadForGalleryTemp(file));
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Empty file is not allowed.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "File size must be 10MB or less.");
        }
        String ct = file.getContentType();
        if (ct == null || !ALLOWED_TYPES.contains(ct.toLowerCase())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Only jpg, png, gif, webp are allowed.");
        }
    }
}
