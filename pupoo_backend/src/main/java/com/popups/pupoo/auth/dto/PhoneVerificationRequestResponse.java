// src/main/java/com/popups/pupoo/auth/dto/PhoneVerificationRequestResponse.java
package com.popups.pupoo.auth.dto;

import java.time.LocalDateTime;

public class PhoneVerificationRequestResponse {

    private LocalDateTime expiresAt;

    /**
     * 개발 환경(Postman 테스트)에서만 사용하는 필드.
     *
     * 운영 환경에서는 절대 노출되면 안 된다.
     * - 실제 SMS 발송이 연결되기 전, OTP 확인을 위해 사용한다.
     */
    private String devCode;

    public PhoneVerificationRequestResponse() {
    }

    public PhoneVerificationRequestResponse(LocalDateTime expiresAt, String devCode) {
        this.expiresAt = expiresAt;
        this.devCode = devCode;
    }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public String getDevCode() { return devCode; }
}
