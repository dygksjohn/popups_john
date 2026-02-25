// file: src/main/java/com/popups/pupoo/auth/api/AuthVerificationController.java
package com.popups.pupoo.auth.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.popups.pupoo.auth.application.EmailVerificationService;
import com.popups.pupoo.auth.application.PhoneVerificationService;
import com.popups.pupoo.auth.dto.EmailVerificationRequestResponse;
import com.popups.pupoo.auth.dto.PhoneVerificationConfirmRequest;
import com.popups.pupoo.auth.dto.PhoneVerificationRequest;
import com.popups.pupoo.auth.dto.PhoneVerificationRequestResponse;
import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.MessageResponse;

import jakarta.validation.Valid;

/**
 * 인증(verification) 관련 API
 *
 * 정책
 * - 이메일 인증은 local(email/password) 가입 사용자 대상.
 * - 소셜 가입은 이메일 인증을 요구하지 않는다.
 * - 휴대폰 인증은 OTP(SMS) 기반으로 처리한다.
 */
@RestController
public class AuthVerificationController {

    private final SecurityUtil securityUtil;
    private final EmailVerificationService emailVerificationService;
    private final PhoneVerificationService phoneVerificationService;

    public AuthVerificationController(
            SecurityUtil securityUtil,
            EmailVerificationService emailVerificationService,
            PhoneVerificationService phoneVerificationService
    ) {
        this.securityUtil = securityUtil;
        this.emailVerificationService = emailVerificationService;
        this.phoneVerificationService = phoneVerificationService;
    }

    /**
     * 이메일 인증 메일 발송/재발송
     *
     * 보안
     * - 로그인 사용자 기준으로만 발송한다.
     * - /api/users/me/** 경로로 묶어 USER 권한 정책을 따른다.
     */
    @PostMapping("/api/users/me/email-verification/request")
    public ApiResponse<EmailVerificationRequestResponse> requestEmailVerification() {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(emailVerificationService.requestEmailVerification(userId));
    }

    /**
     * 이메일 인증 확인(링크 클릭)
     *
     * 보안
     * - 사용자는 인증 링크를 통해 접근하므로, 인증 없이 접근 가능해야 한다.
     * - EndpointPolicy.PUBLIC_ENDPOINTS에 /api/auth/**가 포함되어 있어 public 접근을 허용한다.
     */
    @GetMapping("/api/auth/email/verification/confirm")
    public ApiResponse<MessageResponse> confirmEmailVerification(@RequestParam("token") String token) {
        emailVerificationService.confirmEmailVerification(token);
        return ApiResponse.success(new MessageResponse("EMAIL_VERIFIED"));
    }

    /**
     * 휴대폰 OTP 발송
     */
    @PostMapping("/api/users/me/phone-verification/request")
    public ApiResponse<PhoneVerificationRequestResponse> requestPhoneVerification(@Valid @RequestBody PhoneVerificationRequest request) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(phoneVerificationService.requestPhoneVerification(userId, request));
    }

    /**
     * 휴대폰 OTP 확인
     */
    @PostMapping("/api/users/me/phone-verification/confirm")
    public ApiResponse<MessageResponse> confirmPhoneVerification(@Valid @RequestBody PhoneVerificationConfirmRequest request) {
        Long userId = securityUtil.currentUserId();
        phoneVerificationService.confirmPhoneVerification(userId, request);
        return ApiResponse.success(new MessageResponse("PHONE_VERIFIED"));
    }
}
