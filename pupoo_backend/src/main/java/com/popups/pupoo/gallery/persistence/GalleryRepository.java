// file: src/main/java/com/popups/pupoo/gallery/persistence/GalleryRepository.java
package com.popups.pupoo.gallery.persistence;

import com.popups.pupoo.gallery.domain.model.Gallery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GalleryRepository extends JpaRepository<Gallery, Long> {

    Page<Gallery> findByEventId(Long eventId, Pageable pageable);
}