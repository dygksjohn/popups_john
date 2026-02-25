// file: src/main/java/com/popups/pupoo/gallery/dto/GalleryImageResponse.java
package com.popups.pupoo.gallery.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GalleryImageResponse {

    private Long imageId;
    private Long galleryId;

    private String originalUrl;
    private String thumbUrl;

    private Integer imageOrder;
    private String mimeType;

    private Integer fileSize;
    private LocalDateTime createdAt;
}
