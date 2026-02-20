// 파일 위치: src/main/java/com/popups/pupoo/auth/api/AuthController.java
package com.popups.pupoo.auth.api;

import com.popups.pupoo.auth.application.AuthService;
import com.popups.pupoo.auth.dto.LoginRequest;
import com.popups.pupoo.auth.dto.LoginResponse;
import com.popups.pupoo.auth.dto.TokenResponse;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.user.dto.UserCreateRequest;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * 회원가입 + 자동 로그인
     * - accessToken: body
     * - refreshToken: HttpOnly 쿠키
     */
    @PostMapping("/signup")
    public ApiResponse<LoginResponse> signup(@RequestBody UserCreateRequest req, HttpServletResponse response) {
        return ApiResponse.success(authService.signup(req, response));
    }

    /**
     * 로그인
     * - accessToken: body
     * - refreshToken: HttpOnly 쿠키
     */
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest req, HttpServletResponse response) {
        return ApiResponse.success(authService.login(req, response));
    }

    /**
     * refresh (쿠키 기반)
     * - rotation: refresh 성공 시 기존 row 삭제 + 신규 저장 + 쿠키 교체
     * - accessToken: body
     * - refreshToken: HttpOnly 쿠키 교체
     */
    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = readCookie(request, REFRESH_COOKIE_NAME);
        return ApiResponse.success(authService.refreshToken(refreshToken, response));
    }

    /**
     * logout (디바이스 단위)
     * - 현재 디바이스 refresh 쿠키의 토큰 1개만 DB에서 삭제
     * - refresh 쿠키 만료
     */
    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = readCookie(request, REFRESH_COOKIE_NAME);
        authService.logout(refreshToken, response);
        return ApiResponse.success(null);
    }

    /**
     * secure-ping
     * - JWT 체인 검증용(인증 필요 endpoint로 운영 권장)
     */
    @GetMapping("/secure-ping")
    public ApiResponse<String> securePing() {
        return ApiResponse.success("pong");
    }

    private String readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
