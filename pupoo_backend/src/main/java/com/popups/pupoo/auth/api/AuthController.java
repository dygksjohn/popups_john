// file: src/main/java/com/popups/pupoo/auth/api/AuthController.java
package com.popups.pupoo.auth.api;

import com.popups.pupoo.auth.application.AuthService;
import com.popups.pupoo.auth.application.SignupSessionService;
import com.popups.pupoo.auth.dto.EmailVerificationRequestResponse;
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
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final AuthService authService;
    private final SignupSessionService signupSessionService;

    public AuthController(AuthService authService, SignupSessionService signupSessionService) {
        this.authService = authService;
        this.signupSessionService = signupSessionService;
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
    public ApiResponse<MessageResponse> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = readCookie(request, REFRESH_COOKIE_NAME);
        authService.logout(refreshToken, response);
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

    private String readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_MISSING);
        }
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        throw new BusinessException(ErrorCode.REFRESH_TOKEN_MISSING);
    }
}
