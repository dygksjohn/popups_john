/* file: src/main/java/com/popups/pupoo/gallery/dto/GalleryImageResponse.java
 * 목적: 갤러리 이미지 응답 DTO
 * 주의: 기존 코드에서 Date/Enum 타입 불일치가 발생하여 LocalDateTime/String 기반으로 정리한다.
 */
package com.popups.pupoo.gallery.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

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
