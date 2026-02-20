/* file: src/main/java/com/popups/pupoo/gallery/application/GalleryService.java
 * 목적: 갤러리 조회/좋아요 등 일반 서비스
 */
package com.popups.pupoo.gallery.application;

import com.popups.pupoo.gallery.domain.model.*;
import com.popups.pupoo.gallery.dto.*;
import com.popups.pupoo.gallery.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GalleryService {

    private final GalleryRepository galleryRepository;
    private final GalleryImageRepository galleryImageRepository;
    private final GalleryLikeRepository galleryLikeRepository;

    public GalleryResponse get(Long galleryId) {
        Gallery g = galleryRepository.findById(galleryId)
                .orElseThrow(() -> new IllegalArgumentException("갤러리가 존재하지 않습니다."));

        List<String> urls = galleryImageRepository.findAllByGallery_GalleryIdOrderByImageOrderAsc(galleryId)
                .stream().map(GalleryImage::getOriginalUrl).toList();

        return GalleryResponse.builder()
                .galleryId(g.getGalleryId())
                .eventId(g.getEventId())
                .title(g.getGalleryTitle())
                .description(g.getDescription())
                .viewCount(g.getViewCount())
                .thumbnailImageId(g.getThumbnailImageId())
                .status(g.getGalleryStatus())
                .imageUrls(urls)
                .createdAt(g.getCreatedAt())
                .updatedAt(g.getUpdatedAt())
                .build();
    }

    public Page<GalleryResponse> list(int page, int size) {
        return galleryRepository.findAll(PageRequest.of(page, size))
                .map(g -> {
                    List<String> urls = galleryImageRepository.findAllByGallery_GalleryIdOrderByImageOrderAsc(g.getGalleryId())
                            .stream().map(GalleryImage::getOriginalUrl).toList();
                    return GalleryResponse.builder()
                            .galleryId(g.getGalleryId())
                            .eventId(g.getEventId())
                            .title(g.getGalleryTitle())
                            .description(g.getDescription())
                            .viewCount(g.getViewCount())
                            .thumbnailImageId(g.getThumbnailImageId())
                            .status(g.getGalleryStatus())
                            .imageUrls(urls)
                            .createdAt(g.getCreatedAt())
                            .updatedAt(g.getUpdatedAt())
                            .build();
                });
    }

    @Transactional
    public GalleryLikeResponse like(Long userId, Long galleryId) {
        Gallery g = galleryRepository.findById(galleryId)
                .orElseThrow(() -> new IllegalArgumentException("갤러리가 존재하지 않습니다."));

        GalleryLike like = galleryLikeRepository.findByGallery_GalleryIdAndUserId(galleryId, userId)
                .orElseGet(() -> galleryLikeRepository.save(
                        GalleryLike.builder()
                                .gallery(g)
                                .userId(userId)
                                .createdAt(LocalDateTime.now())
                                .build()
                ));

        return GalleryLikeResponse.builder()
                .galleryId(galleryId)
                .userId(userId)
                .createdAt(like.getCreatedAt())
                .build();
    }
}
