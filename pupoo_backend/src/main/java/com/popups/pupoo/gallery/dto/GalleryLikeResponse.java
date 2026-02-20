/* file: src/main/java/com/popups/pupoo/gallery/dto/GalleryLikeResponse.java
 * 목적: 갤러리 좋아요 응답 DTO
 */
package com.popups.pupoo.gallery.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GalleryLikeResponse {
    private Long galleryId;
    private Long userId;
    private LocalDateTime createdAt;
}
