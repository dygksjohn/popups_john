// file: src/main/java/com/popups/pupoo/notice/dto/NoticeUpdateRequest.java
package com.popups.pupoo.notice.dto;

import com.popups.pupoo.notice.domain.enums.NoticeStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class NoticeUpdateRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    @NotNull
    private Boolean pinned;

    @NotNull
    private NoticeStatus status;
}
