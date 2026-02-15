package com.popups.pupoo.auth.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_token")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "refresh_token_id")
    private Long refreshTokenId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "token", nullable = false, length = 500)
    private String token;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public RefreshToken() {}  // 🔥 반드시 public

    public Long getRefreshTokenId() { return refreshTokenId; }
    public Long getUserId() { return userId; }
    public String getToken() { return token; }
    public LocalDateTime getExpiredAt() { return expiredAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setRefreshTokenId(Long refreshTokenId) { this.refreshTokenId = refreshTokenId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setToken(String token) { this.token = token; }
    public void setExpiredAt(LocalDateTime expiredAt) { this.expiredAt = expiredAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
