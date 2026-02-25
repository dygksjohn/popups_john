// file: src/main/java/com/popups/pupoo/gallery/application/GalleryService.java
package com.popups.pupoo.gallery.application;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.popups.pupoo.gallery.domain.model.Gallery;
import com.popups.pupoo.gallery.domain.model.GalleryImage;
import com.popups.pupoo.gallery.domain.model.GalleryLike;
import com.popups.pupoo.gallery.dto.GalleryLikeResponse;
import com.popups.pupoo.gallery.dto.GalleryResponse;
import com.popups.pupoo.gallery.persistence.GalleryImageRepository;
import com.popups.pupoo.gallery.persistence.GalleryLikeRepository;
import com.popups.pupoo.gallery.persistence.GalleryRepository;

import lombok.RequiredArgsConstructor;

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
