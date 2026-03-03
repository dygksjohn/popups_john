package com.popups.pupoo.gallery.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.storage.application.StorageService;
import com.popups.pupoo.storage.dto.UploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class GalleryImageUploadController {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final StorageService storageService;

    @Value("${storage.base-path:./uploads}")
    private String basePath;

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

        Path dir = resolveGalleryUploadDir();
        try {
            Files.createDirectories(dir);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to create upload directory: " + e.getMessage());
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            validateFile(file);
            String ext = extractExt(file.getOriginalFilename());
            String storedName = UUID.randomUUID().toString().replace("-", "") + ext;
            try {
                Files.write(dir.resolve(storedName), file.getBytes());
            } catch (Exception e) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to write upload file: " + e.getMessage());
            }
            urls.add("/uploads/gallery/" + storedName);
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

    private String extractExt(String filename) {
        if (filename == null) {
            return "";
        }
        int idx = filename.lastIndexOf('.');
        return (idx >= 0) ? filename.substring(idx).toLowerCase() : "";
    }

    private Path resolveGalleryUploadDir() {
        try {
            return Paths.get(basePath).toAbsolutePath().normalize().resolve("gallery");
        } catch (Exception ignored) {
            return Paths.get(".").toAbsolutePath().normalize().resolve("uploads").resolve("gallery");
        }
    }
}
