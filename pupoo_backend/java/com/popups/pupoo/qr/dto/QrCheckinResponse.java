// file: src/main/java/com/popups/pupoo/qr/dto/QrCheckinResponse.java
package com.popups.pupoo.qr.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QrCheckinResponse {
    private Long qrId;
    private Long boothId;
    private String checkType;
    private LocalDateTime checkedAt;
}
