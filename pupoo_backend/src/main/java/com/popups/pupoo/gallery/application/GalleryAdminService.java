// file: src/main/java/com/popups/pupoo/gallery/application/GalleryAdminService.java
package com.popups.pupoo.gallery.application;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.popups.pupoo.common.audit.application.AdminLogService;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
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

    /**
 * 관리자 갤러리 등록. user_id에 현재 관리자 ID를 저장(DB NOT NULL 대응).
 */
@Transactional
public GalleryResponse create(Long adminUserId, GalleryCreateRequest request) {Gallery g = Gallery.builder()
                .eventId(request.getEventId())
                .userId(adminUserId) 
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
                .userId(saved.getUserId())
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
    /**
     * 회원이 자신의 갤러리 작성. user_id에 현재 사용자 저장.
     */
    @Transactional
    public GalleryResponse createByUser(Long userId, GalleryCreateRequest request) {
        Gallery g = Gallery.builder()
                .eventId(request.getEventId())
                .userId(userId)
                .galleryTitle(request.getTitle())
                .description(request.getDescription())
                .viewCount(0)
                .thumbnailImageId(null)
                .galleryStatus(GalleryStatus.PUBLIC)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Gallery saved = galleryRepository.save(g);

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
    /**
     * 작성자 본인 또는 관리자만 수정 가능.
     * user_id가 null인 갤러리(관리자 등록)는 관리자만 수정 가능.
     */
    @Transactional
    public GalleryResponse updateByAuthorOrAdmin(Long galleryId, GalleryUpdateRequest request, Long currentUserId, boolean isAdmin) {
        Gallery g = galleryRepository.findById(galleryId)
                .orElseThrow(() -> new IllegalArgumentException("갤러리가 존재하지 않습니다."));

        if (!isAdmin) {
            if (g.getUserId() == null || !g.getUserId().equals(currentUserId)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "수정 권한이 없습니다.");
            }
        }

        Gallery updated = galleryRepository.save(g.toBuilder()
                .galleryTitle(request.getTitle())
                .description(request.getDescription())
                .updatedAt(LocalDateTime.now())
                .build());

        if (isAdmin) {
            adminLogService.write("GALLERY_UPDATE", AdminTargetType.OTHER, galleryId);
        }

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
    /**
     * 작성자 본인 또는 관리자만 삭제(소프트 삭제) 가능.
     * user_id가 null인 갤러리는 관리자만 삭제 가능.
     */
    @Transactional
    public void deleteByAuthorOrAdmin(Long galleryId, Long currentUserId, boolean isAdmin) {
        Gallery g = galleryRepository.findById(galleryId)
                .orElseThrow(() -> new IllegalArgumentException("갤러리가 존재하지 않습니다."));

        if (!isAdmin) {
            if (g.getUserId() == null || !g.getUserId().equals(currentUserId)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "삭제 권한이 없습니다.");
            }
        }

        galleryRepository.save(g.toBuilder()
                .galleryStatus(GalleryStatus.DELETED)
                .updatedAt(LocalDateTime.now())
                .build());

        if (isAdmin) {
            adminLogService.write("GALLERY_DELETE", AdminTargetType.OTHER, galleryId);
        }
    }
}
