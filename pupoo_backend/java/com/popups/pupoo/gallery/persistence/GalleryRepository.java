// file: src/main/java/com/popups/pupoo/gallery/persistence/GalleryRepository.java
package com.popups.pupoo.gallery.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.gallery.domain.model.Gallery;

public interface GalleryRepository extends JpaRepository<Gallery, Long> {
}
