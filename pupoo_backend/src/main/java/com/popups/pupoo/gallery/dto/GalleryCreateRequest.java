/* file: src/main/java/com/popups/pupoo/gallery/dto/GalleryCreateRequest.java
 * 목적: 갤러리 생성 요청 DTO
 */
package com.popups.pupoo.gallery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.List;

@Getter
public class GalleryCreateRequest {

    @NotNull
    private Long eventId;

    @NotBlank
    private String title;

    private String description;

    private List<String> imageUrls;
}
