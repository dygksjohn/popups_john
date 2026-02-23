// file: src/main/java/com/popups/pupoo/storage/application/StorageService.java
package com.popups.pupoo.storage.application;

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

@Service
public class StorageService {

    private static final String LOCAL_BUCKET_UNUSED = "local";

    private final ObjectStoragePort objectStoragePort;
    private final StorageKeyGenerator keyGenerator;
    private final StoredFileRepository storedFileRepository;

    public StorageService(ObjectStoragePort objectStoragePort,
                          StorageKeyGenerator keyGenerator,
                          StoredFileRepository storedFileRepository) {
        this.objectStoragePort = objectStoragePort;
        this.keyGenerator = keyGenerator;
        this.storedFileRepository = storedFileRepository;
    }

    /**
     * POST/NOTICE 첨부파일 업로드 → files 테이블에 기록한다.
 *
 *
 * 외부 공개 접근은(로컬 파일 저장소 구성 기준) Nginx가 /static/** 경로로 정적 파일을 서빙하는 것을 전제로 한다.
 *
 *
 * 스토리지 구현체를 S3로 바꾸더라도, 이 서비스는 ObjectStoragePort만 호출하므로
     * 도메인 로직/DB 로직은 그대로 유지된다.
 *
 *
 * 전환 메모(복붙용)
     *
     * - 로컬(Ubuntu/Nginx):
     *   1) storage.local.base-path 를 서버 디렉토리로 지정
     *   2) Nginx에서 /static/ 을 alias로 연결
     *
     * - S3:
     *   1) ObjectStoragePort Bean을 S3ObjectStorageService로 교체
     *   2) getPublicPath()가 S3/CloudFront URL을 리턴하도록 구현
     *
     */
    @Transactional
    public UploadResponse uploadForFilesTable(MultipartFile file, UploadRequest request) {
        request.validateForFilesTable();
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "file is required");
        }

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
                ? StoredFile.forPost(originalName, storedName, contentId)
                : StoredFile.forNotice(originalName, storedName, contentId);

        StoredFile saved = storedFileRepository.save(storedFile);
        String publicPath = objectStoragePort.getPublicPath(LOCAL_BUCKET_UNUSED, key);

        return UploadResponse.of(saved.getFileId(), saved.getOriginalName(), saved.getStoredName(), publicPath);
    }

    @Transactional(readOnly = true)
    public FileResponse getFile(Long fileId) {
        StoredFile f = storedFileRepository.findById(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "file not found"));
        String key = toKey(f);
        String publicPath = objectStoragePort.getPublicPath(LOCAL_BUCKET_UNUSED, key);
        return FileResponse.of(f.getFileId(), f.getOriginalName(), publicPath);
    }

    @Transactional(readOnly = true)
    public InputStream download(Long fileId) {
        StoredFile f = storedFileRepository.findById(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "file not found"));
        String key = toKey(f);
        return objectStoragePort.getObject(LOCAL_BUCKET_UNUSED, key);
    }

    @Transactional
    public void delete(Long fileId) {
        StoredFile f = storedFileRepository.findById(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "file not found"));
        String key = toKey(f);
        objectStoragePort.deleteObject(LOCAL_BUCKET_UNUSED, key);
        storedFileRepository.delete(f);
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
        // 파일명에 경로가 섞여 들어오면(브라우저/OS별) 경로 부분을 제거한다.
        int idx1 = originalFilename.lastIndexOf('/');
        int idx2 = originalFilename.lastIndexOf('\\');
        int idx = Math.max(idx1, idx2);
        return (idx >= 0) ? originalFilename.substring(idx + 1) : originalFilename;
    }
}
