// file: src/main/java/com/popups/pupoo/storage/infrastructure/StorageKeyGenerator.java
package com.popups.pupoo.storage.infrastructure;

import org.springframework.stereotype.Component;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.common.util.FileNameUtil;

/**
 * Generates storage keys used by both local storage + Nginx and future object storages.
 */
@Component
public class StorageKeyGenerator {

    public enum UploadTargetType {
        POST, NOTICE, GALLERY, QR
    }

    /**
     * Generates a key like: post/{id}/{storedName}
     */
    public String generateKey(UploadTargetType type, Long contentId, String originalFilename) {
        String folder = resolveFolder(type, contentId);
        String storedName = FileNameUtil.generateStoredName(originalFilename);
        return folder + "/" + storedName;
    }

    public String buildKey(UploadTargetType type, Long contentId, String storedName) {
        String folder = resolveFolder(type, contentId);
        return folder + "/" + storedName;
    }

    public String resolveFolder(UploadTargetType type, Long contentId) {
        if (type == null || contentId == null || contentId <= 0) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "Invalid upload target or contentId");
        }

        return switch (type) {
            case POST -> "post/" + contentId;
            case NOTICE -> "notice/" + contentId;
            case GALLERY -> "gallery/" + contentId;
            case QR -> "qr/" + contentId;
        };
    }
}
