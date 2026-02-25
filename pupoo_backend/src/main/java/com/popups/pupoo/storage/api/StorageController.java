// file: src/main/java/com/popups/pupoo/storage/api/StorageController.java
package com.popups.pupoo.storage.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.IdResponse;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
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
     * (유저) POST 첨부파일 업로드 (files 테이블에 저장).
     *
     * 요청 형식: multipart/form-data
     * - file: 업로드할 파일 (MultipartFile)
     * - targetType: POST (NOTICE는 어드민 전용)
     * - contentId: 게시글 ID
     */
    @PostMapping
    public ApiResponse<UploadResponse> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam("targetType") String targetType,
            @RequestParam("contentId") Long contentId
    ) {
        UploadRequest req = new UploadRequest(targetType, contentId);
        // NOTICE 업로드는 어드민 전용 (enum 파싱을 통해 엄격하게 판별)
        if (req.parsedTargetType() == com.popups.pupoo.storage.infrastructure.StorageKeyGenerator.UploadTargetType.NOTICE) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "notice file upload is admin-only");
        }
        return ApiResponse.success(storageService.uploadForFilesTable(file, req));
    }

    /**
     * (어드민) NOTICE 첨부파일 업로드 (files 테이블에 저장).
     */
    @PostMapping("/admin/notice")
    public ApiResponse<UploadResponse> uploadNoticeByAdmin(
            @RequestPart("file") MultipartFile file,
            @RequestParam("noticeId") Long noticeId
    ) {
        UploadRequest req = new UploadRequest("NOTICE", noticeId);
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
     * (유저) 파일 삭제.
     * - 작성자만 삭제 가능
     * - NOTICE 첨부파일은 유저 삭제 불가
     * - DB soft delete만 수행(오브젝트는 지연삭제 배치에서 제거)
     */
    @DeleteMapping("/{fileId}")
    public ApiResponse<IdResponse> delete(@PathVariable Long fileId) {
        storageService.deleteByUser(fileId);
        return ApiResponse.success(new IdResponse(fileId));
    }

    /**
     * (어드민) 파일 강제 삭제.
     * - POST/NOTICE 구분 없이 ADMIN은 삭제 가능
     * - DB soft delete만 수행(오브젝트는 지연삭제 배치에서 제거)
     */
    @DeleteMapping("/admin/{fileId}")
    public ApiResponse<IdResponse> deleteByAdmin(
            @PathVariable Long fileId,
            @RequestParam(value = "reason", required = false) String reason
    ) {
        storageService.deleteByAdmin(fileId, reason);
        return ApiResponse.success(new IdResponse(fileId));
    }
}
