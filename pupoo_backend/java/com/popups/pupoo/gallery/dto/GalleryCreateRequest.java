// file: src/main/java/com/popups/pupoo/gallery/dto/GalleryCreateRequest.java
package com.popups.pupoo.gallery.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class GalleryCreateRequest {

    @NotNull
    private Long eventId;

    @NotBlank
    private String title;

    private String description;

    private List<String> imageUrls;
}
