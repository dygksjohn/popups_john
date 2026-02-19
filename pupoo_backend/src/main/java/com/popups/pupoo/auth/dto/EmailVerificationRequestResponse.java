// src/main/java/com/popups/pupoo/auth/dto/EmailVerificationRequestResponse.java
package com.popups.pupoo.auth.dto;

import java.time.LocalDateTime;

public class EmailVerificationRequestResponse {

    private LocalDateTime expiresAt;

    /**
     * 개발 환경(Postman 테스트)에서만 사용하는 필드.
     *
     * 운영 환경에서는 절대 노출되면 안 된다.
     * - 실제 이메일 발송이 연결되기 전, 토큰 확인을 위해 사용한다.
     */
    private String devToken;

    public EmailVerificationRequestResponse() {
    }

    public EmailVerificationRequestResponse(LocalDateTime expiresAt, String devToken) {
        this.expiresAt = expiresAt;
        this.devToken = devToken;
    }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public String getDevToken() { return devToken; }
}
