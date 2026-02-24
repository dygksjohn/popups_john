// file: src/main/java/com/popups/pupoo/booth/dto/BoothUpdateRequest.java
package com.popups.pupoo.booth.dto;

import com.popups.pupoo.booth.domain.enums.BoothStatus;
import com.popups.pupoo.booth.domain.enums.BoothType;
import com.popups.pupoo.booth.domain.enums.BoothZone;

/**
 * 부스 수정 요청 DTO (관리자용)
 */
public class BoothUpdateRequest {

    public String placeName;
    public BoothType type;
    public String description;
    public String company;
    public BoothZone zone;
    public BoothStatus status;
}
