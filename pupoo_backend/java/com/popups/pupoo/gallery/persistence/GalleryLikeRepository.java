// file: src/main/java/com/popups/pupoo/gallery/persistence/GalleryLikeRepository.java
package com.popups.pupoo.gallery.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.gallery.domain.model.GalleryLike;

public interface GalleryLikeRepository extends JpaRepository<GalleryLike, Long> {
    Optional<GalleryLike> findByGallery_GalleryIdAndUserId(Long galleryId, Long userId);
}
