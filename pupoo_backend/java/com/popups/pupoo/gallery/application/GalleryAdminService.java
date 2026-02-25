// file: src/main/java/com/popups/pupoo/gallery/application/GalleryAdminService.java
package com.popups.pupoo.gallery.application;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.popups.pupoo.common.audit.application.AdminLogService;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.gallery.domain.enums.GalleryStatus;
import com.popups.pupoo.gallery.domain.model.Gallery;
import com.popups.pupoo.gallery.domain.model.GalleryImage;
import com.popups.pupoo.gallery.dto.GalleryCreateRequest;
import com.popups.pupoo.gallery.dto.GalleryResponse;
import com.popups.pupoo.gallery.dto.GalleryUpdateRequest;
import com.popups.pupoo.gallery.persistence.GalleryImageRepository;
import com.popups.pupoo.gallery.persistence.GalleryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GalleryAdminService {

    private final GalleryRepository galleryRepository;
    private final GalleryImageRepository galleryImageRepository;
    private final AdminLogService adminLogService;

    @Transactional
    public GalleryResponse create(GalleryCreateRequest request) {
        Gallery g = Gallery.builder()
                .eventId(request.getEventId())
                .galleryTitle(request.getTitle())
                .description(request.getDescription())
                .viewCount(0)
                .thumbnailImageId(null)
                .galleryStatus(GalleryStatus.PUBLIC)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Gallery saved = galleryRepository.save(g);

        adminLogService.write("GALLERY_CREATE", AdminTargetType.OTHER, saved.getGalleryId());

        List<String> urls = request.getImageUrls() == null ? List.of() : request.getImageUrls();
        int order = 1;
        Long firstImageId = null;

        for (String url : urls) {
            GalleryImage img = GalleryImage.builder()
                    .gallery(saved)
                    .originalUrl(url)
                    .thumbUrl(null)
                    .imageOrder(order++)
                    .mimeType(null)
                    .fileSize(null)
                    .createdAt(LocalDateTime.now())
                    .build();
            GalleryImage savedImg = galleryImageRepository.save(img);
            if (firstImageId == null) {
                firstImageId = savedImg.getImageId();
            }
        }

        if (firstImageId != null) {
            saved = galleryRepository.save(saved.toBuilder()
                    .thumbnailImageId(firstImageId)
                    .updatedAt(LocalDateTime.now())
                    .build());
        }

        return GalleryResponse.builder()
                .galleryId(saved.getGalleryId())
                .eventId(saved.getEventId())
                .title(saved.getGalleryTitle())
                .description(saved.getDescription())
                .viewCount(saved.getViewCount())
                .thumbnailImageId(saved.getThumbnailImageId())
                .status(saved.getGalleryStatus())
                .imageUrls(urls)
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Transactional
    public GalleryResponse update(Long galleryId, GalleryUpdateRequest request) {
        Gallery g = galleryRepository.findById(galleryId)
                .orElseThrow(() -> new IllegalArgumentException("갤러리가 존재하지 않습니다."));

        Gallery updated = galleryRepository.save(g.toBuilder()
                .galleryTitle(request.getTitle())
                .description(request.getDescription())
                .updatedAt(LocalDateTime.now())
                .build());

        adminLogService.write("GALLERY_UPDATE", AdminTargetType.OTHER, galleryId);

        List<String> urls = galleryImageRepository.findAllByGallery_GalleryIdOrderByImageOrderAsc(galleryId)
                .stream().map(GalleryImage::getOriginalUrl).toList();

        return GalleryResponse.builder()
                .galleryId(updated.getGalleryId())
                .eventId(updated.getEventId())
                .title(updated.getGalleryTitle())
                .description(updated.getDescription())
                .viewCount(updated.getViewCount())
                .thumbnailImageId(updated.getThumbnailImageId())
                .status(updated.getGalleryStatus())
                .imageUrls(urls)
                .createdAt(updated.getCreatedAt())
                .updatedAt(updated.getUpdatedAt())
                .build();
    }

    @Transactional
    public void delete(Long galleryId) {
        Gallery g = galleryRepository.findById(galleryId)
                .orElseThrow(() -> new IllegalArgumentException("갤러리가 존재하지 않습니다."));

        // DB 정책: 하드 삭제 금지 → 상태 전환으로 soft delete 처리
        galleryRepository.save(g.toBuilder()
                .galleryStatus(GalleryStatus.DELETED)
                .updatedAt(LocalDateTime.now())
                .build());
        adminLogService.write("GALLERY_DELETE", AdminTargetType.OTHER, galleryId);
    }
}
