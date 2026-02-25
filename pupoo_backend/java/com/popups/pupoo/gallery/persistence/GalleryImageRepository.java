// file: src/main/java/com/popups/pupoo/gallery/persistence/GalleryImageRepository.java
package com.popups.pupoo.gallery.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.gallery.domain.model.GalleryImage;

public interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {
    List<GalleryImage> findAllByGallery_GalleryIdOrderByImageOrderAsc(Long galleryId);
}
