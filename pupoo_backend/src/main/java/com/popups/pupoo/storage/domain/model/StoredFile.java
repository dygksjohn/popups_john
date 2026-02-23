// file: src/main/java/com/popups/pupoo/storage/domain/model/StoredFile.java
package com.popups.pupoo.storage.domain.model;

import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "files")
public class StoredFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "file_id")
    private Long fileId;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "stored_name", nullable = false, length = 255, unique = true)
    private String storedName;

    @Column(name = "post_id")
    private Long postId;

    @Column(name = "notice_id")
    private Long noticeId;

    protected StoredFile() {}

    private StoredFile(String originalName, String storedName, Long postId, Long noticeId) {
        this.originalName = originalName;
        this.storedName = storedName;
        this.postId = postId;
        this.noticeId = noticeId;
    }

    public static StoredFile forPost(String originalName, String storedName, Long postId) {
        return new StoredFile(originalName, storedName, postId, null);
    }

    public static StoredFile forNotice(String originalName, String storedName, Long noticeId) {
        return new StoredFile(originalName, storedName, null, noticeId);
    }
}
