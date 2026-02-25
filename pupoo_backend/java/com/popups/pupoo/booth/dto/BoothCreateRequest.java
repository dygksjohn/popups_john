// file: src/main/java/com/popups/pupoo/booth/dto/BoothCreateRequest.java
package com.popups.pupoo.booth.dto;

import com.popups.pupoo.booth.domain.enums.BoothStatus;
import com.popups.pupoo.booth.domain.enums.BoothType;
import com.popups.pupoo.booth.domain.enums.BoothZone;

/**
 * 부스 생성 요청 DTO (관리자용)
 *
 * 주의
 * - 현재 공개 API(BoothController)는 조회 중심이며, 생성/수정은 관리자 API 확장 시 사용한다.
 */
public class BoothCreateRequest {

    public Long eventId;
    public String placeName;
    public BoothType type;
    public String description;
    public String company;
    public BoothZone zone;

    /**
     * 기본값은 OPEN을 권장한다.
     */
    public BoothStatus status;
}
