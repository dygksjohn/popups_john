// file: src/main/java/com/popups/pupoo/gallery/dto/GalleryLikeResponse.java
package com.popups.pupoo.gallery.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GalleryLikeResponse {
    private Long galleryId;
    private Long userId;
    private LocalDateTime createdAt;
}
