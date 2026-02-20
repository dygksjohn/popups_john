package com.popups.pupoo.storage.persistence;

import com.popups.pupoo.storage.domain.model.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StoredFileRepository extends JpaRepository<StoredFile, Long> {

    Optional<StoredFile> findByPostId(Long postId);

    Optional<StoredFile> findByNoticeId(Long noticeId);
}
