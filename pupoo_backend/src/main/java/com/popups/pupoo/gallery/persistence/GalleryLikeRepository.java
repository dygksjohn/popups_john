/* file: src/main/java/com/popups/pupoo/gallery/persistence/GalleryLikeRepository.java
 * 목적: gallery_likes 접근(JPA)
 */
package com.popups.pupoo.gallery.persistence;

import com.popups.pupoo.gallery.domain.model.GalleryLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GalleryLikeRepository extends JpaRepository<GalleryLike, Long> {
    Optional<GalleryLike> findByGallery_GalleryIdAndUserId(Long galleryId, Long userId);
}
