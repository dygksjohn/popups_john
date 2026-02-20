package com.popups.pupoo.storage.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.storage.application.StorageService;
import com.popups.pupoo.storage.dto.FileResponse;
import com.popups.pupoo.storage.dto.UploadRequest;
import com.popups.pupoo.storage.dto.UploadResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;

@RestController
@RequestMapping("/api/files")
public class StorageController {

    private final StorageService storageService;

    public StorageController(StorageService storageService) {
        this.storageService = storageService;
    }

    /**
     * POST / NOTICE 첨부파일 업로드 (files 테이블에 저장).
     *
     * 요청 형식: multipart/form-data
     * - file: 업로드할 파일 (MultipartFile)
     * - targetType: POST 또는 NOTICE
     * - contentId: 게시글 ID 또는 공지 ID
     */
    @PostMapping
    public ApiResponse<UploadResponse> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam("targetType") String targetType,
            @RequestParam("contentId") Long contentId
    ) {
        UploadRequest req = new UploadRequest(targetType, contentId);
        return ApiResponse.success(storageService.uploadForFilesTable(file, req));
    }

    /**
     * 파일 메타데이터 조회.
     * (DB에 저장된 파일 정보 반환)
     */
    @GetMapping("/{fileId}")
    public ApiResponse<FileResponse> get(@PathVariable Long fileId) {
        return ApiResponse.success(storageService.getFile(fileId));
    }

    /**
     * 퍼블릭 파일 다운로드.
     *
     * 실제 파일은 Nginx가 /static 경로로 정적 서빙하므로,
     * 해당 파일의 공개 경로(publicPath)로 302 리다이렉트한다.
     */
    @GetMapping("/{fileId}/download")
    public ResponseEntity<Void> redirectToStatic(@PathVariable Long fileId) {
        FileResponse file = storageService.getFile(fileId);
        return ResponseEntity.status(302)
                .header(HttpHeaders.LOCATION, URI.create(file.getPublicPath()).toString())
                .build();
    }

    /**
     * 파일 삭제.
     * - DB 레코드 삭제
     * - 실제 저장된 파일 삭제
     */
    @DeleteMapping("/{fileId}")
    public ApiResponse<Void> delete(@PathVariable Long fileId) {
        storageService.delete(fileId);
        return ApiResponse.success(null);
    }
}