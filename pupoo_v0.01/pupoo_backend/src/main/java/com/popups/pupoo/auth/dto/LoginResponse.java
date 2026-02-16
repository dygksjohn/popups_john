package com.popups.pupoo.auth.dto;

public class LoginResponse {

    private String accessToken;
    private Long userId;
    private String roleName;

    public LoginResponse() {}

    public LoginResponse(String accessToken, Long userId, String roleName) {
        this.accessToken = accessToken;
        this.userId = userId;
        this.roleName = roleName;
    }

    public String getAccessToken() { return accessToken; }
    public Long getUserId() { return userId; }
    public String getRoleName() { return roleName; }

    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
}
