// 파일 위치: src/main/java/com/popups/pupoo/auth/application/AuthService.java
package com.popups.pupoo.auth.application;

import com.popups.pupoo.auth.domain.model.RefreshToken;
import com.popups.pupoo.auth.dto.LoginRequest;
import com.popups.pupoo.auth.dto.LoginResponse;
import com.popups.pupoo.auth.dto.TokenResponse;
import com.popups.pupoo.auth.persistence.RefreshTokenRepository;
import com.popups.pupoo.auth.token.JwtProvider;
import com.popups.pupoo.user.application.UserService;
import com.popups.pupoo.user.domain.enums.UserStatus;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.dto.UserCreateRequest;
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
    private final UserService userService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    private final TokenService tokenService;
    private final JwtProvider jwtProvider;

    private final EmailVerificationService emailVerificationService;

    private final boolean refreshCookieSecure;
    private final int refreshCookieMaxAgeSeconds;

    public AuthService(
            UserRepository userRepository,
            UserService userService,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService,
            JwtProvider jwtProvider,
            EmailVerificationService emailVerificationService,
            @Value("${auth.refresh.cookie.secure:true}") boolean refreshCookieSecure,
            @Value("${auth.refresh.cookie.max-age-seconds:1209600}") int refreshCookieMaxAgeSeconds
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.jwtProvider = jwtProvider;
        this.emailVerificationService = emailVerificationService;
        this.refreshCookieSecure = refreshCookieSecure;
        this.refreshCookieMaxAgeSeconds = refreshCookieMaxAgeSeconds;
    }

    /**
     * 회원가입 + 자동 로그인
     * - 사용자 생성은 user 도메인(UserService)을 통해 처리한다.
     * - 토큰 발급/refresh 저장/쿠키 세팅은 auth 도메인에서 처리한다.
     */
    @Transactional
    public LoginResponse signup(UserCreateRequest req, HttpServletResponse response) {

        User saved = userService.create(req);

        Long userId = saved.getUserId();
        String roleName = saved.getRoleName().name();

        String access = tokenService.createAccessToken(userId, roleName);
        String refresh = tokenService.createRefreshToken(userId);

        RefreshToken rt = new RefreshToken();
        rt.setUserId(userId);
        rt.setToken(refresh);
        rt.setCreatedAt(LocalDateTime.now());
        rt.setExpiredAt(LocalDateTime.now().plusSeconds(refreshCookieMaxAgeSeconds));
        refreshTokenRepository.save(rt);

        setRefreshCookie(response, refresh);

        // local(email/password) 가입에만 이메일 인증을 요구한다.
        // 소셜 가입은 별도 플로우에서 처리하며, 이메일 인증을 생략한다.
        try {
            emailVerificationService.requestEmailVerification(userId);
        } catch (Exception ignored) {
            // 이메일 발송/검증 설정이 아직 준비되지 않은 환경에서도 회원가입은 진행 가능해야 한다.
            // 운영에서는 반드시 verification.hash.salt 및 이메일 발송 구현을 활성화한다.
        }

        return new LoginResponse(access, userId, roleName);
    }

    /**
     * 로그인
     * - accessToken: body
     * - refreshToken: HttpOnly 쿠키
     */
    @Transactional
    public LoginResponse login(LoginRequest req, HttpServletResponse response) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        validateUserStatusForAuth(user);

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
     * - rotation: 성공 시 기존 row 삭제 + 새 refresh 발급/저장 + 쿠키 교체
     */
    @Transactional
    public TokenResponse refreshToken(String refreshToken, HttpServletResponse response) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token missing");
        }

        RefreshToken stored = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token invalid"));

        jwtProvider.validateRefreshToken(refreshToken);

        Long userId = jwtProvider.getUserId(refreshToken);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        validateUserStatusForAuth(user);

        String roleName = user.getRoleName().name();

        String newAccess = tokenService.createAccessToken(userId, roleName);

        refreshTokenRepository.delete(stored);

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

    /**
     * 로그아웃 (디바이스 단위)
     * - 쿠키의 refresh 토큰 1개만 DB에서 삭제
     * - refresh 쿠키 만료
     */
    @Transactional
    public void logout(String refreshToken, HttpServletResponse response) {

        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenRepository.findByToken(refreshToken)
                    .ifPresent(refreshTokenRepository::delete);
        }

        expireRefreshCookie(response);
    }

    /**
     * 인증/인가 흐름에서 허용하지 않는 사용자 상태를 차단한다.
     */
    private void validateUserStatusForAuth(User user) {
        UserStatus status = user.getStatus();
        if (status == null) {
            throw new IllegalArgumentException("Invalid user status");
        }

        if (status == UserStatus.INACTIVE) {
            throw new IllegalArgumentException("Inactive user");
        }
        if (status == UserStatus.SUSPENDED) {
            throw new IllegalArgumentException("Suspended user");
        }
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
