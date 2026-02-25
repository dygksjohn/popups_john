// file: src/main/java/com/popups/pupoo/auth/api/AuthController.java
package com.popups.pupoo.auth.api;

import com.popups.pupoo.auth.application.AuthService;
import com.popups.pupoo.auth.application.KakaoOAuthService;
import com.popups.pupoo.auth.application.SignupSessionService;
import com.popups.pupoo.auth.dto.EmailVerificationRequestResponse;
import com.popups.pupoo.auth.dto.KakaoExchangeRequest;
import com.popups.pupoo.auth.dto.KakaoExchangeResponse;
import com.popups.pupoo.auth.dto.KakaoOauthLoginRequest;
import com.popups.pupoo.auth.dto.KakaoOauthLoginResponse;
import com.popups.pupoo.auth.dto.LoginRequest;
import com.popups.pupoo.auth.dto.LoginResponse;
import com.popups.pupoo.auth.dto.SignupCompleteRequest;
import com.popups.pupoo.auth.dto.SignupEmailConfirmRequest;
import com.popups.pupoo.auth.dto.SignupEmailRequest;
import com.popups.pupoo.auth.dto.SignupStartRequest;
import com.popups.pupoo.auth.dto.SignupStartResponse;
import com.popups.pupoo.auth.dto.SignupVerifyOtpRequest;
import com.popups.pupoo.auth.dto.TokenResponse;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.MessageResponse;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final AuthService authService;
    private final SignupSessionService signupSessionService;
    private final KakaoOAuthService kakaoOAuthService;

    public AuthController(AuthService authService,
                          SignupSessionService signupSessionService,
                          KakaoOAuthService kakaoOAuthService) {
        this.authService = authService;
        this.signupSessionService = signupSessionService;
        this.kakaoOAuthService = kakaoOAuthService;
    }

    /**
     * 회원가입 시작
     * - 가입 세션 생성
     * - OTP 발송(60초 쿨다운, 일 5회)
     * - users 생성 없음
     */
    @PostMapping("/signup/start")
    public ApiResponse<SignupStartResponse> signupStart(@RequestBody SignupStartRequest req) {
        return ApiResponse.success(signupSessionService.start(req));
    }

    /**
     * 회원가입 OTP 검증
     * - 성공 시 세션 otp_status=VERIFIED
     */
    @PostMapping("/signup/verify-otp")
    public ApiResponse<MessageResponse> signupVerifyOtp(@RequestBody SignupVerifyOtpRequest req) {
        signupSessionService.verifyOtp(req);
        return ApiResponse.success(new MessageResponse("OTP_VERIFIED"));
    }

    /**
     * 회원가입 이메일 인증 메일 발송(EMAIL 가입만)
     * - OTP 검증 완료 후에만 허용
     */
    @PostMapping("/signup/email/request")
    public ApiResponse<EmailVerificationRequestResponse> signupEmailRequest(@RequestBody SignupEmailRequest req) {
        return ApiResponse.success(signupSessionService.requestEmail(req));
    }

    /**
     * 회원가입 이메일 인증 확인(EMAIL 가입만)
     */
    @PostMapping("/signup/email/confirm")
    public ApiResponse<MessageResponse> signupEmailConfirm(@RequestBody SignupEmailConfirmRequest req) {
        signupSessionService.confirmEmail(req);
        return ApiResponse.success(new MessageResponse("EMAIL_VERIFIED"));
    }

    /**
     * 회원가입 완료
     * - OTP 필수
     * - EMAIL 가입은 이메일 인증도 필수
     * - 여기서 users 생성 + access/refresh 발급
     */
    @PostMapping("/signup/complete")
    public ApiResponse<LoginResponse> signupComplete(@RequestBody SignupCompleteRequest req, HttpServletResponse response) {
        return ApiResponse.success(signupSessionService.complete(req, response));
    }

    /**
     * Kakao 로그인
     */
    @PostMapping("/oauth/kakao/exchange")
    public ApiResponse<KakaoExchangeResponse> kakaoExchange(@RequestBody KakaoExchangeRequest req) {
        return ApiResponse.success(kakaoOAuthService.exchange(req.getCode()));
    }

    /**
     * Kakao 로그인 (토큰 발급)
     * - 기존 회원: accessToken(body) + refreshToken(HttpOnly 쿠키)
     * - 신규 회원: 200 OK + newUser=true + 프리필드 반환
     */
    @PostMapping("/oauth/kakao/login")
    public ApiResponse<KakaoOauthLoginResponse> kakaoLogin(
            @RequestBody KakaoOauthLoginRequest req,
            HttpServletResponse response
    ) {
        return ApiResponse.success(kakaoOAuthService.login(req.getCode(), response));
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
        String refreshToken = readCookieStrict(request, REFRESH_COOKIE_NAME);
        return ApiResponse.success(authService.refreshToken(refreshToken, response));
    }

    /**
     * ✅ logout (멱등)
     * - 쿠키가 없어도 항상 200
     * - 쿠키가 있으면 해당 토큰을 DB에서 삭제 시도
     * - 항상 refresh 쿠키 만료(Set-Cookie Max-Age=0) 내려줌
     */
    @PostMapping("/logout")
    public ApiResponse<MessageResponse> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = readCookieOptional(request, REFRESH_COOKIE_NAME);

        try {
            if (refreshToken != null && !refreshToken.isBlank()) {
                // 기존 서비스 시그니처 유지: (token, response) 형태라면 그대로 호출
                authService.logout(refreshToken, response);
            }
        } catch (Exception e) {
            // 서버에서 DB 삭제 실패해도 클라이언트는 쿠키를 끊어야 함
        } finally {
            // ✅ 쿠키가 없더라도 무조건 만료 쿠키 내려주기(프론트/브라우저 상태 정리)
            expireRefreshCookie(response);
        }

        return ApiResponse.success(new MessageResponse("LOGOUT_OK"));
    }

    /**
     * secure-ping
     * - JWT 체인 검증용(인증 필요 endpoint로 운영 권장)
     */
    @GetMapping("/secure-ping")
    public ApiResponse<String> securePing() {
        return ApiResponse.success("pong");
    }

    /**
     * 쿠키 읽기(필수): 없으면 예외 (refresh에는 유지)
     */
    private String readCookieStrict(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_MISSING);
        }
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        throw new BusinessException(ErrorCode.REFRESH_TOKEN_MISSING);
    }

    /**
     * 쿠키 읽기(선택): 없으면 null (logout은 멱등 처리)
     */
    private String readCookieOptional(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    /**
     * ✅ refresh_token 쿠키 만료를 ResponseCookie로 명시적으로 내려줌
     * - Path는 "/"로 통일해야 브라우저에서 확실히 제거됨
     * - 로컬 http 환경: secure=false
     */
    private void expireRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")               // 🔥 매우 중요
                .maxAge(Duration.ZERO)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}