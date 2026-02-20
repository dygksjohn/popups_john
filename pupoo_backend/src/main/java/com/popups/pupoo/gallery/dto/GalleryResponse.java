/* file: src/main/java/com/popups/pupoo/gallery/dto/GalleryResponse.java
 * 목적: 갤러리 응답 DTO
 */
package com.popups.pupoo.gallery.dto;

import com.popups.pupoo.gallery.domain.enums.GalleryStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class GalleryResponse {

    private Long galleryId;
    private Long eventId;

    private String title;
    private String description;

    private Integer viewCount;
    private Long thumbnailImageId;

    private GalleryStatus status;

    private List<String> imageUrls;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
