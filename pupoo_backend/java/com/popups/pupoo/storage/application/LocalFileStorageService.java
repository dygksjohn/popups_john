// file: src/main/java/com/popups/pupoo/storage/application/LocalFileStorageService.java
package com.popups.pupoo.storage.application;

import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.storage.infrastructure.LocalStorageClient;
import com.popups.pupoo.storage.port.ObjectStoragePort;

/**
 * 로컬 파일시스템 기반 스토리지 구현체.
 *
 * - 현재(개발): 프로젝트 내부에 저장
 *   - basePath = ./uploads
 *   - key      = post/{postId}/{storedName}
 *   - realPath = basePath + "/" + key
 *   - public   = /static/{key}
 *
 * - 운영(우분투 + Nginx) 전환 시(주석 참고해서 설정 변경)
 *   - storage.base-path: /var/app/uploads
 *   - Nginx: /static/** -> /var/app/uploads/** (alias)
 *   - 코드 변경 거의 없음
 *
 * - S3 전환 시(주석 참고)
 *   - storage.mode=S3 로 변경
 *   - S3 구현체(ObjectStoragePort) 활성화
 */
@Service
@ConditionalOnProperty(name = "storage.mode", havingValue = "LOCAL", matchIfMissing = true)
public class LocalFileStorageService implements ObjectStoragePort {

    private final LocalStorageClient localStorageClient;

    /**
     * 개발 기본값: 프로젝트 내부 ./uploads
     *
     * [운영(우분투) 전환 시]
     * - application-prod.yml에서 /var/app/uploads 로 변경
     */
    private final String basePath;

    /**
     * 퍼블릭 접근 prefix
     * - 개발: Spring 정적 서빙(/static/** -> file:{basePath}) 또는
     * - 운영: Nginx 정적 서빙(/static/** -> basePath)
     */
    private final String publicPrefix;

    public LocalFileStorageService(
            LocalStorageClient localStorageClient,
            @Value("${storage.base-path:./uploads}") String basePath,
            @Value("${storage.public-prefix:/static}") String publicPrefix
    ) {
        this.localStorageClient = localStorageClient;
        this.basePath = basePath;
        this.publicPrefix = normalizePrefix(publicPrefix);
    }

    @Override
    public void putObject(String bucket, String key, byte[] bytes, String contentType) {
        // bucket은 LOCAL에서는 의미 없음(S3 전환 대비 시그니처 유지)
        if (key == null || key.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "key is required");
        }
        Path path = resolvePath(key);
        localStorageClient.write(path, bytes);
    }

    @Override
    public InputStream getObject(String bucket, String key) {
        if (key == null || key.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "key is required");
        }
        Path path = resolvePath(key);
        return localStorageClient.read(path);
    }

    @Override
    public void deleteObject(String bucket, String key) {
        if (key == null || key.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "key is required");
        }
        Path path = resolvePath(key);
        localStorageClient.delete(path);
    }

    @Override
    public String getPublicPath(String bucket, String key) {
        if (key == null || key.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "key is required");
        }
        return publicPrefix + "/" + stripLeadingSlash(key);
    }

    private Path resolvePath(String key) {
        // 절대경로 입력을 막고, basePath 하위로만 저장되도록 강제한다.
        String safeKey = stripLeadingSlash(key);
        return Paths.get(basePath, safeKey);
    }

    private static String stripLeadingSlash(String key) {
        return key.startsWith("/") ? key.substring(1) : key;
    }

    private static String normalizePrefix(String prefix) {
        if (prefix == null || prefix.isBlank()) return "/static";
        String p = prefix.trim();
        if (!p.startsWith("/")) p = "/" + p;
        if (p.endsWith("/")) p = p.substring(0, p.length() - 1);
        return p;
    }
}
