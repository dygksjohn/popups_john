// src/main/java/com/popups/pupoo/auth/application/AuthService.java
package com.popups.pupoo.auth.application;

import com.popups.pupoo.auth.domain.model.RefreshToken;
import com.popups.pupoo.auth.dto.LoginRequest;
import com.popups.pupoo.auth.dto.LoginResponse;
import com.popups.pupoo.auth.dto.TokenResponse;
import com.popups.pupoo.auth.persistence.RefreshTokenRepository;
import com.popups.pupoo.auth.token.JwtProvider;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.persistence.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    private final TokenService tokenService;
    private final JwtProvider jwtProvider;

    private final boolean refreshCookieSecure;
    private final int refreshCookieMaxAgeSeconds;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService,
            JwtProvider jwtProvider,
            @Value("${auth.refresh.cookie.secure:true}") boolean refreshCookieSecure,
            @Value("${auth.refresh.cookie.max-age-seconds:1209600}") int refreshCookieMaxAgeSeconds
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.jwtProvider = jwtProvider;
        this.refreshCookieSecure = refreshCookieSecure;
        this.refreshCookieMaxAgeSeconds = refreshCookieMaxAgeSeconds;
    }

    public LoginResponse login(LoginRequest req, HttpServletResponse response) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getStatus() != null && "DELETED".equals(user.getStatus().name())) {
            throw new IllegalArgumentException("Deleted user");
        }
        if (user.getStatus() != null && "SUSPENDED".equals(user.getStatus().name())) {
            throw new IllegalArgumentException("Suspended user");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        Long userId = user.getUserId();
        String roleName = user.getRoleName().name();

        String access = tokenService.createAccessToken(userId, roleName);
        String refresh = tokenService.createRefreshToken(userId);

        RefreshToken rt = new RefreshToken();
        rt.setUserId(userId);
        rt.setToken(refresh);
        rt.setCreatedAt(LocalDateTime.now());
        rt.setExpiredAt(LocalDateTime.now().plusSeconds(refreshCookieMaxAgeSeconds));
        refreshTokenRepository.save(rt);

        setRefreshCookie(response, refresh);

        return new LoginResponse(access, userId, roleName);
    }

    /**
     * refresh (쿠키 기반)
     * ✅ rotation: 성공 시 기존 row 삭제 + 새 refresh 발급/저장 + 쿠키 교체
     */
    @Transactional
    public TokenResponse refreshToken(String refreshToken, HttpServletResponse response) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token missing");
        }

        // 1) DB 존재 확인
        RefreshToken stored = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token invalid"));

        // 2) JWT 검증
        jwtProvider.validateRefreshToken(refreshToken);

        // 3) userId 추출 + role은 DB에서 조회
        Long userId = jwtProvider.getUserId(refreshToken);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getStatus() != null && "DELETED".equals(user.getStatus().name())) {
            throw new IllegalArgumentException("Deleted user");
        }
        if (user.getStatus() != null && "SUSPENDED".equals(user.getStatus().name())) {
            throw new IllegalArgumentException("Suspended user");
        }

        String roleName = user.getRoleName().name();

        // 4) access 재발급
        String newAccess = tokenService.createAccessToken(userId, roleName);

        // 5) rotation: 기존 refresh row 삭제 (✅ deleteByToken 대신 delete(entity)로 안전하게)
        refreshTokenRepository.delete(stored);

        // 6) 새 refresh 저장 + 쿠키 교체
        String newRefresh = tokenService.createRefreshToken(userId);

        RefreshToken newRt = new RefreshToken();
        newRt.setUserId(userId);
        newRt.setToken(newRefresh);
        newRt.setCreatedAt(LocalDateTime.now());
        newRt.setExpiredAt(LocalDateTime.now().plusSeconds(refreshCookieMaxAgeSeconds));
        refreshTokenRepository.save(newRt);

        setRefreshCookie(response, newRefresh);

        return new TokenResponse(newAccess);
    }

    @Transactional
    public void logout(String refreshToken, HttpServletResponse response) {

        if (refreshToken != null && !refreshToken.isBlank()) {

            // ✅ token으로 엔티티 조회 후 delete(entity)로 안전 삭제
            refreshTokenRepository.findByToken(refreshToken)
                    .ifPresent(refreshTokenRepository::delete);
        }

        expireRefreshCookie(response);
    }

    private void setRefreshCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(refreshCookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(refreshCookieMaxAgeSeconds);
        response.addCookie(cookie);
    }

    private void expireRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(refreshCookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
