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
import com.popups.pupoo.storage.support.StorageKeyNormalizer;
import com.popups.pupoo.storage.support.StorageUrlResolver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class StorageService {

    private static final String LOCAL_BUCKET_UNUSED = "local";
    private static final int MAX_GALLERY_IMAGE_UPLOAD_COUNT = 10;
    private static final Set<String> ALLOWED_GALLERY_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp"
    );
    private static final long MAX_GALLERY_IMAGE_SIZE = 10L * 1024 * 1024;

    private final ObjectStoragePort objectStoragePort;
    private final StorageKeyGenerator keyGenerator;
    private final StoredFileRepository storedFileRepository;
    private final SecurityUtil securityUtil;
    private final StorageKeyNormalizer storageKeyNormalizer;
    private final StorageUrlResolver storageUrlResolver;

    public StorageService(ObjectStoragePort objectStoragePort,
                          StorageKeyGenerator keyGenerator,
                          StoredFileRepository storedFileRepository,
                          SecurityUtil securityUtil,
                          StorageKeyNormalizer storageKeyNormalizer,
                          StorageUrlResolver storageUrlResolver) {
        this.objectStoragePort = objectStoragePort;
        this.keyGenerator = keyGenerator;
        this.storedFileRepository = storedFileRepository;
        this.securityUtil = securityUtil;
        this.storageKeyNormalizer = storageKeyNormalizer;
        this.storageUrlResolver = storageUrlResolver;
    }

    /**
     * POST/NOTICE 첨부파일 업로드 API입니다.
     * NOTICE 업로드는 관리자만 허용합니다.
     */
    @Transactional
    public UploadResponse uploadForFilesTable(MultipartFile file, UploadRequest request) {
        try {
            request.validateForFilesTable();

            if (file == null || file.isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "file is required");
            }

            StorageKeyGenerator.UploadTargetType type = request.parsedTargetType();
            if (type == StorageKeyGenerator.UploadTargetType.NOTICE && !securityUtil.isAdmin()) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "notice file upload is admin-only");
            }

            Long uploaderId = securityUtil.currentUserId();
            Long contentId = request.getContentId();
            String originalName = safeOriginalName(file.getOriginalFilename());

            String key = keyGenerator.generateKey(type, contentId, originalName);
            String storedName = keyGenerator.extractFileName(key);

            try {
                objectStoragePort.putObject(LOCAL_BUCKET_UNUSED, key, file.getBytes(), file.getContentType());
            } catch (IOException e) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to read upload bytes: " + e.getMessage());
            }

            StoredFile storedFile = (type == StorageKeyGenerator.UploadTargetType.POST)
                    ? StoredFile.forPost(originalName, key, uploaderId, contentId)
                    : StoredFile.forNotice(originalName, key, uploaderId, contentId);

            StoredFile saved = storedFileRepository.save(storedFile);
            String publicPath = storageUrlResolver.toPublicUrlFromKey(key);

            return UploadResponse.of(saved.getFileId(), saved.getOriginalName(), storedName, publicPath);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("File upload error: {}", e.getMessage(), e);
            String msg = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : e.getClass().getSimpleName();
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "File upload failed: " + msg);
        }
    }

    /**
     * 갤러리 이미지 임시 업로드 API입니다.
     * files 테이블에는 저장하지 않고 object storage 경로만 반환합니다.
     */
    public UploadResponse uploadForGalleryTemp(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "file is required");
        }

        Long userId = securityUtil.currentUserId();
        String originalName = safeOriginalName(file.getOriginalFilename());
        String key = keyGenerator.generateKeyForGalleryTemp(userId, originalName);
        String storedName = keyGenerator.extractFileName(key);

        try {
            objectStoragePort.putObject(LOCAL_BUCKET_UNUSED, key, file.getBytes(), file.getContentType());
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to read upload bytes: " + e.getMessage());
        }

        String publicPath = storageUrlResolver.toPublicUrlFromKey(key);
        return UploadResponse.of(0L, originalName, storedName, publicPath);
    }

    /**
     * Admin gallery uploads return public URLs immediately, but URL assembly stays in the service layer.
     */
    public List<String> uploadGalleryImagesForAdmin(List<MultipartFile> files) {
        validateGalleryUploadBatch(files);

        List<String> publicUrls = new ArrayList<>(files.size());
        for (MultipartFile file : files) {
            validateGalleryImageFile(file);
            String originalName = safeOriginalName(file.getOriginalFilename());
            String key = keyGenerator.generateStandaloneKey("gallery", originalName);
            try {
                objectStoragePort.putObject(LOCAL_BUCKET_UNUSED, key, file.getBytes(), file.getContentType());
            } catch (IOException e) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to read upload file: " + e.getMessage());
            }
            publicUrls.add(storageUrlResolver.toPublicUrlFromKey(key));
        }
        return publicUrls;
    }

    @Transactional(readOnly = true)
    public FileResponse getFile(Long fileId) {
        StoredFile f = storedFileRepository.findByFileIdAndDeletedAtIsNull(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "file not found"));

        String key = toKey(f);
        String publicPath = storageUrlResolver.toPublicUrlFromKey(key);
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
                    String publicPath = storageUrlResolver.toPublicUrlFromKey(key);
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
        storedFileRepository.save(f);
    }

    @Transactional
    public void deleteByAdmin(Long fileId, String reason) {
        Long adminId = securityUtil.currentUserId();

        StoredFile f = storedFileRepository.findByFileIdAndDeletedAtIsNull(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "file not found"));

        String r = (reason == null || reason.isBlank()) ? "ADMIN_DELETE" : reason;
        f.markDeleted(adminId, r);
        storedFileRepository.save(f);
    }

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
                storedFileRepository.save(f);
                deletedCount++;
            } catch (Exception e) {
                // 실패 건은 다음 주기에서 재시도합니다.
            }
        }
        return deletedCount;
    }

    private String toKey(StoredFile f) {
        String normalizedStoredValue = storageKeyNormalizer.extractStorageKey(f.getStoredName());
        if (normalizedStoredValue != null) {
            return normalizedStoredValue;
        }
        if (f.getPostId() != null) {
            return keyGenerator.buildKey(StorageKeyGenerator.UploadTargetType.POST, f.getPostId(), f.getStoredName());
        }
        if (f.getNoticeId() != null) {
            return keyGenerator.buildKey(StorageKeyGenerator.UploadTargetType.NOTICE, f.getNoticeId(), f.getStoredName());
        }
        throw new BusinessException(ErrorCode.INTERNAL_ERROR, "files row has no owner (post_id/notice_id)");
    }

    private static String safeOriginalName(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "file";
        }

        int idx1 = originalFilename.lastIndexOf('/');
        int idx2 = originalFilename.lastIndexOf('\\');
        int idx = Math.max(idx1, idx2);

        return (idx >= 0) ? originalFilename.substring(idx + 1) : originalFilename;
    }

    private void validateGalleryUploadBatch(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "File is required.");
        }
        if (files.size() > MAX_GALLERY_IMAGE_UPLOAD_COUNT) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Up to 10 files can be uploaded.");
        }
    }

    private void validateGalleryImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Empty file is not allowed.");
        }
        if (file.getSize() > MAX_GALLERY_IMAGE_SIZE) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "File size must be 10MB or less.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_GALLERY_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Only jpg, png, gif, webp are allowed.");
        }
    }
}
