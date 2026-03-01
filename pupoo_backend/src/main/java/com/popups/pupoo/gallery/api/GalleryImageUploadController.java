// file: src/main/java/com/popups/pupoo/gallery/api/GalleryImageUploadController.java
package com.popups.pupoo.gallery.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * 갤러리 이미지 업로드 전용 API (관리자)
 *
 * POST /api/admin/galleries/images/upload
 *   - multipart/form-data
 *   - 파라미터: files (MultipartFile[])
 *   - 응답: { success: true, data: { urls: ["/uploads/gallery/xxx.jpg", ...] } }
 *
 * SecurityConfig: /uploads/** → permitAll → 이미지 접근에 인증 불필요
 */
@RestController
@RequestMapping("/api/admin/galleries/images")
public class GalleryImageUploadController {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final String basePath;

    public GalleryImageUploadController(
            @Value("${storage.base-path:./uploads}") String basePath
    ) {
        this.basePath = basePath;
    }

    @PostMapping("/upload")
    public ApiResponse<Map<String, List<String>>> upload(
            @RequestPart("files") List<MultipartFile> files
    ) {
        if (files == null || files.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "파일을 선택해주세요.");
        }
        if (files.size() > 10) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "최대 10개까지 업로드 가능합니다.");
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            validateFile(file);
            String ext = extractExt(file.getOriginalFilename());
            String storedName = UUID.randomUUID().toString().replace("-", "") + ext;
            Path dir = Paths.get(basePath, "gallery");
            try {
                Files.createDirectories(dir);
                Files.write(dir.resolve(storedName), file.getBytes());
            } catch (IOException e) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "파일 저장 실패: " + e.getMessage());
            }
            urls.add("/uploads/gallery/" + storedName);
        }
        return ApiResponse.success(Map.of("urls", urls));
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty())
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "빈 파일입니다.");
        if (file.getSize() > MAX_FILE_SIZE)
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "10MB 이하만 가능합니다.");
        String ct = file.getContentType();
        if (ct == null || !ALLOWED_TYPES.contains(ct.toLowerCase()))
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "jpg, png, gif, webp만 가능합니다.");
    }

    private String extractExt(String filename) {
        if (filename == null) return "";
        int idx = filename.lastIndexOf('.');
        return (idx >= 0) ? filename.substring(idx).toLowerCase() : "";
    }
}
