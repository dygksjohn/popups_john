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

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        emailVerificationService.requestEmailVerification(userId);
                    } catch (Throwable t) {
                        // ✅ 절대 throw 금지: 회원가입 응답이 500으로 바뀜
                        // 운영에서는 logger로 남기는 걸 권장
                        t.printStackTrace();
                    }
                }
            });
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
                // 기능: 로그인 대상 사용자 조회
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        validateUserStatusForAuth(user);

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            // 기능: 로그인 실패(자격 증명 불일치)
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
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
            // 기능: refresh cookie 미존재
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_MISSING);
        }

        RefreshToken stored = refreshTokenRepository.findByToken(refreshToken)
                // 기능: refresh token 저장소 미존재
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID));

        jwtProvider.validateRefreshToken(refreshToken);

        Long userId = jwtProvider.getUserId(refreshToken);

        User user = userRepository.findById(userId)
                // 기능: refresh 대상 사용자 조회
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

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
            // 기능: 사용자 상태값 비정상
            throw new BusinessException(ErrorCode.USER_STATUS_INVALID);
        }

        if (status == UserStatus.INACTIVE) {
            // 기능: 비활성 사용자 접근 차단
            throw new BusinessException(ErrorCode.USER_INACTIVE);
        }
        if (status == UserStatus.SUSPENDED) {
            // 기능: 정지 사용자 접근 차단
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
