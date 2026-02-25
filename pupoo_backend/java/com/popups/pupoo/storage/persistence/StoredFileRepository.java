// file: src/main/java/com/popups/pupoo/storage/persistence/StoredFileRepository.java
package com.popups.pupoo.storage.persistence;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.storage.domain.model.StoredFile;

public interface StoredFileRepository extends JpaRepository<StoredFile, Long> {

    Optional<StoredFile> findByIdAndDeletedAtIsNull(Long fileId);

    Optional<StoredFile> findByPostIdAndDeletedAtIsNull(Long postId);

    Optional<StoredFile> findByNoticeIdAndDeletedAtIsNull(Long noticeId);

    List<StoredFile> findTop100ByDeletedAtIsNotNullAndObjectDeletedAtIsNullAndDeletedAtBefore(LocalDateTime cutoff);
}
