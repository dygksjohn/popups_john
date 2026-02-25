// file: src/main/java/com/popups/pupoo/auth/application/AuthService.java
package com.popups.pupoo.auth.application;

import com.popups.pupoo.auth.domain.model.RefreshToken;
import com.popups.pupoo.auth.dto.LoginRequest;
import com.popups.pupoo.auth.dto.LoginResponse;
import com.popups.pupoo.auth.dto.TokenResponse;
import com.popups.pupoo.auth.persistence.RefreshTokenRepository;
import com.popups.pupoo.auth.token.JwtProvider;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.user.application.UserService;
import com.popups.pupoo.user.domain.enums.UserStatus;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.dto.UserCreateRequest;
import com.popups.pupoo.user.persistence.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

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
     * 외부(Service)에서 사용자 상태 검증을 재사용할 수 있도록 공개 래퍼 제공
     * - KakaoOAuthService에서 "자동 연동 insert 전에" 차단할 때 사용
     */
    public void validateUserStatusForAuthPublic(User user) {
        validateUserStatusForAuth(user);
    }

    /**
     * 회원가입 + 자동 로그인
     */
    @Transactional
    public LoginResponse signup(UserCreateRequest req, HttpServletResponse response) {

        User saved = userService.create(req);

        // 가입 직후 상태 검증도 일관성 유지(정책상 보통 ACTIVE로 생성되겠지만 방어)
        validateUserStatusForAuth(saved);

        // 토큰 발급 + 쿠키 세팅 공통 처리
        LoginResponse lr = issueTokensAndSetCookie(saved, response);

        Long userId = saved.getUserId();

        // 가입 직후 인증메일 발송은 트랜잭션 커밋 이후 수행(실패해도 가입 자체는 성공)
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        emailVerificationService.requestEmailVerification(userId);
                    } catch (Throwable t) {
                        t.printStackTrace();
                    }
                }
            });
        }

        return lr;
    }

    /**
     * 로그인
     * - accessToken: body
     * - refreshToken: HttpOnly 쿠키
     */
    @Transactional
    public LoginResponse login(LoginRequest req, HttpServletResponse response) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        validateUserStatusForAuth(user);

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return issueTokensAndSetCookie(user, response);
    }

    /**
     * 소셜 로그인 등 "이미 인증된 User"를 기반으로 로그인 처리
     */
    @Transactional
    public LoginResponse loginByUser(User user, HttpServletResponse response) {

        validateUserStatusForAuth(user);

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return issueTokensAndSetCookie(user, response);
    }

    /**
     * refresh (쿠키 기반)
     */
    @Transactional
    public TokenResponse refreshToken(String refreshToken, HttpServletResponse response) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_MISSING);
        }

        RefreshToken stored = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID));

        jwtProvider.validateRefreshToken(refreshToken);

        Long userId = jwtProvider.getUserId(refreshToken);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        validateUserStatusForAuth(user);

        String roleName = user.getRoleName().name();

        String newAccess = tokenService.createAccessToken(userId, roleName);

        // rotation: 기존 refresh 제거 후 신규 발급
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
     * 공통: access/refresh 발급 + refresh 저장 + 쿠키 세팅
     */
    private LoginResponse issueTokensAndSetCookie(User user, HttpServletResponse response) {
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
     * 인증/인가 흐름에서 허용하지 않는 사용자 상태를 차단한다.
     *
     * 현재 UserStatus 정의
     * - ACTIVE / SUSPENDED / DELETED
     *
     * 정책
     * - DELETED(탈퇴)는 "비활성"으로 간주하여 로그인/토큰발급을 차단한다.
     */
    private void validateUserStatusForAuth(User user) {
        UserStatus status = user.getStatus();
        if (status == null) {
            throw new BusinessException(ErrorCode.USER_STATUS_INVALID);
        }

        if (status == UserStatus.DELETED) {
            throw new BusinessException(ErrorCode.USER_INACTIVE);
        }
        if (status == UserStatus.SUSPENDED) {
            throw new BusinessException(ErrorCode.USER_SUSPENDED);
        }
    }

    private void setRefreshCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path("/api/auth")
                .sameSite("Lax")
                .maxAge(refreshCookieMaxAgeSeconds)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void expireRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path("/api/auth")
                .sameSite("Lax")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
