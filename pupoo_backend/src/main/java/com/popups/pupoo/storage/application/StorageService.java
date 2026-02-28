// file: src/main/java/com/popups/pupoo/storage/application/StorageService.java
package com.popups.pupoo.storage.application;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.storage.domain.model.StoredFile;
import com.popups.pupoo.storage.dto.FileResponse;
import com.popups.pupoo.storage.dto.UploadRequest;
import com.popups.pupoo.storage.dto.UploadResponse;
import com.popups.pupoo.storage.infrastructure.StorageKeyGenerator;
import com.popups.pupoo.storage.persistence.StoredFileRepository;
import com.popups.pupoo.storage.port.ObjectStoragePort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;

@Service
public class StorageService {

    private static final String LOCAL_BUCKET_UNUSED = "local";

    private final ObjectStoragePort objectStoragePort;
    private final StorageKeyGenerator keyGenerator;
    private final StoredFileRepository storedFileRepository;
    private final SecurityUtil securityUtil;

    public StorageService(ObjectStoragePort objectStoragePort,
                          StorageKeyGenerator keyGenerator,
                          StoredFileRepository storedFileRepository,
                          SecurityUtil securityUtil) {
        this.objectStoragePort = objectStoragePort;
        this.keyGenerator = keyGenerator;
        this.storedFileRepository = storedFileRepository;
        this.securityUtil = securityUtil;
    }

    /**
     * POST/NOTICE 첨부파일 업로드 → files 테이블에 기록한다.
     * - 업로더(user_id)는 현재 로그인 사용자로 저장한다.
     */
    @Transactional
    public UploadResponse uploadForFilesTable(MultipartFile file, UploadRequest request) {
        request.validateForFilesTable();
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "file is required");
        }

        Long uploaderId = securityUtil.currentUserId();

        StorageKeyGenerator.UploadTargetType type = request.parsedTargetType();
        Long contentId = request.getContentId();
        String originalName = safeOriginalName(file.getOriginalFilename());

        String key = keyGenerator.generateKey(type, contentId, originalName);
        String storedName = key.substring(key.lastIndexOf('/') + 1);

        try {
            objectStoragePort.putObject(LOCAL_BUCKET_UNUSED, key, file.getBytes(), file.getContentType());
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to read upload bytes: " + e.getMessage());
        }

        StoredFile storedFile = (type == StorageKeyGenerator.UploadTargetType.POST)
                ? StoredFile.forPost(originalName, storedName, uploaderId, contentId)
                : StoredFile.forNotice(originalName, storedName, uploaderId, contentId);

        StoredFile saved = storedFileRepository.save(storedFile);
        String publicPath = objectStoragePort.getPublicPath(LOCAL_BUCKET_UNUSED, key);

        return UploadResponse.of(saved.getFileId(), saved.getOriginalName(), saved.getStoredName(), publicPath);
    }

    @Transactional(readOnly = true)
    public FileResponse getFile(Long fileId) {
        StoredFile f = storedFileRepository.findByFileIdAndDeletedAtIsNull(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "file not found"));
        String key = toKey(f);
        String publicPath = objectStoragePort.getPublicPath(LOCAL_BUCKET_UNUSED, key);
        return FileResponse.of(f.getFileId(), f.getOriginalName(), publicPath);
    }

    /**
     * 게시글(postId)에 연결된 첨부파일 메타 조회. 없으면 null.
     */
    @Transactional(readOnly = true)
    public FileResponse getFileByPostId(Long postId) {
        return storedFileRepository.findByPostIdAndDeletedAtIsNull(postId)
                .map(f -> {
                    String key = toKey(f);
                    String publicPath = objectStoragePort.getPublicPath(LOCAL_BUCKET_UNUSED, key);
                    return FileResponse.of(f.getFileId(), f.getOriginalName(), publicPath);
                })
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public InputStream download(Long fileId) {
        StoredFile f = storedFileRepository.findByFileIdAndDeletedAtIsNull(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "file not found"));
        String key = toKey(f);
        return objectStoragePort.getObject(LOCAL_BUCKET_UNUSED, key);
    }

    /**
     * (유저) 파일 삭제
     * - 작성자만 가능
     * - NOTICE 첨부파일은 유저 삭제 불가
     * - DB soft delete만 수행(오브젝트는 지연삭제 배치에서 제거)
     */
    @Transactional
    public void deleteByUser(Long fileId) {
        Long currentUserId = securityUtil.currentUserId();

        StoredFile f = storedFileRepository.findByFileIdAndDeletedAtIsNull(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "file not found"));

        if (f.getNoticeId() != null) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "notice file cannot be deleted by user");
        }

        if (!currentUserId.equals(f.getUserId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "only uploader can delete this file");
        }

        f.markDeleted(currentUserId, "USER_DELETE");
    }

    /**
     * (어드민) 파일 강제 삭제
     * - POST/NOTICE 구분 없이 가능
     * - DB soft delete만 수행(오브젝트는 지연삭제 배치에서 제거)
     */
    @Transactional
    public void deleteByAdmin(Long fileId, String reason) {
        Long adminId = securityUtil.currentUserId();
        StoredFile f = storedFileRepository.findByFileIdAndDeletedAtIsNull(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "file not found"));

        String r = (reason == null || reason.isBlank()) ? "ADMIN_DELETE" : reason;
        f.markDeleted(adminId, r);
    }

    /**
     * 지연삭제 배치
     * - soft delete 된 파일 중 retentionDays가 지난 오브젝트를 실제로 제거한다.
     * - 삭제 성공 시 object_deleted_at을 세팅하여 멱등/재시도 가능
     */
    @Transactional
    public int purgeDeletedObjects(int retentionDays) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        var targets = storedFileRepository
                .findTop100ByDeletedAtIsNotNullAndObjectDeletedAtIsNullAndDeletedAtBefore(cutoff);

        int deletedCount = 0;
        for (StoredFile f : targets) {
            try {
                String key = toKey(f);
                objectStoragePort.deleteObject(LOCAL_BUCKET_UNUSED, key);
                f.markObjectDeleted();
                deletedCount++;
            } catch (Exception e) {
                // 실패 시 다음 주기에 재시도 (objectDeletedAt 미세팅)
            }
        }
        return deletedCount;
    }

    private String toKey(StoredFile f) {
        if (f.getPostId() != null) {
            return keyGenerator.buildKey(StorageKeyGenerator.UploadTargetType.POST, f.getPostId(), f.getStoredName());
        }
        if (f.getNoticeId() != null) {
            return keyGenerator.buildKey(StorageKeyGenerator.UploadTargetType.NOTICE, f.getNoticeId(), f.getStoredName());
        }
        throw new BusinessException(ErrorCode.INTERNAL_ERROR, "files row has no owner (post_id/notice_id)");
    }

    private static String safeOriginalName(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) return "file";
        int idx1 = originalFilename.lastIndexOf('/');
        int idx2 = originalFilename.lastIndexOf('\\');
        int idx = Math.max(idx1, idx2);
        return (idx >= 0) ? originalFilename.substring(idx + 1) : originalFilename;
    }
}