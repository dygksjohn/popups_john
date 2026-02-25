// file: src/main/java/com/popups/pupoo/gallery/domain/model/Gallery.java
package com.popups.pupoo.gallery.domain.model;

import java.time.LocalDateTime;

import com.popups.pupoo.gallery.domain.enums.GalleryStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "galleries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(toBuilder = true)
public class Gallery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gallery_id", nullable = false)
    private Long galleryId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "gallery_title", nullable = false, length = 255)
    private String galleryTitle;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "thumbnail_image_id")
    private Long thumbnailImageId;

    @Enumerated(EnumType.STRING)
    @Column(name = "gallery_status", nullable = false, columnDefinition = "ENUM('PUBLIC','PRIVATE','BLINDED','DELETED')")
    private GalleryStatus galleryStatus;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
