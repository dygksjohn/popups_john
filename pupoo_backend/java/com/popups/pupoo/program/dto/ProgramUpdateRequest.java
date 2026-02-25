// file: src/main/java/com/popups/pupoo/program/dto/ProgramUpdateRequest.java
package com.popups.pupoo.program.dto;

import java.time.LocalDateTime;

import com.popups.pupoo.program.domain.enums.ProgramCategory;

/**
 * 프로그램 수정 요청 DTO (관리자용)
 */
public class ProgramUpdateRequest {

    public ProgramCategory category;
    public String programTitle;
    public String description;
    public LocalDateTime startAt;
    public LocalDateTime endAt;
    public Long boothId;
}
