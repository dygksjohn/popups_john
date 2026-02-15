// src/main/java/com/popups/pupoo/auth/dto/TokenResponse.java
package com.popups.pupoo.auth.dto;

public class TokenResponse {

    private String accessToken;

    public TokenResponse() {}

    public TokenResponse(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
}
