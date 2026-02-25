// file: src/main/java/com/popups/pupoo/gallery/domain/model/GalleryImage.java
package com.popups.pupoo.gallery.domain.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "gallery_images")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(toBuilder = true)
public class GalleryImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_id", nullable = false)
    private Long imageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gallery_id", nullable = false)
    private Gallery gallery;

    @Column(name = "original_url", nullable = false, length = 500)
    private String originalUrl;

    @Column(name = "thumb_url", length = 500)
    private String thumbUrl;

    @Column(name = "image_order")
    private Integer imageOrder;

    @Column(name = "mime_type", columnDefinition = "ENUM('jpeg','jpg','png','gif','webp','tiff','svg')")
    private String mimeType;

    @Column(name = "file_size")
    private Integer fileSize;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Long getGalleryId() {
        return gallery == null ? null : gallery.getGalleryId();
    }
}
