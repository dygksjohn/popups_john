// file: src/main/java/com/popups/pupoo/auth/application/SignupSessionService.java
package com.popups.pupoo.auth.application;

import com.popups.pupoo.auth.domain.enums.EmailSessionStatus;
import com.popups.pupoo.auth.domain.enums.OtpSessionStatus;
import com.popups.pupoo.auth.domain.enums.SignupType;
import com.popups.pupoo.auth.domain.model.RefreshToken;
import com.popups.pupoo.auth.domain.model.SignupSession;
import com.popups.pupoo.auth.dto.*;
import com.popups.pupoo.auth.persistence.RefreshTokenRepository;
import com.popups.pupoo.auth.persistence.SignupSessionRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.common.util.HashUtil;
import com.popups.pupoo.notification.port.NotificationSender;
import com.popups.pupoo.user.application.UserService;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.dto.UserCreateRequest;
import com.popups.pupoo.user.social.application.SocialAccountService;
import com.popups.pupoo.user.social.dto.SocialLinkRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

/**
 * 회원가입 세션 기반 가입 처리 서비스
 *
 * 핵심 정책
 * - start: 세션 생성 + OTP 발송
 * - verify-otp: OTP 검증 성공 시 otp_status=VERIFIED
 * - email/request, email/confirm: EMAIL 가입용 이메일 인증 처리
 * - complete: OTP(필수) + EMAIL 가입이면 email_status=VERIFIED 조건을 만족해야 users 생성 + 토큰 발급
 */
@Slf4j
@Service
public class SignupSessionService {

    private static final SecureRandom random = new SecureRandom();
    private static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final SignupSessionRepository signupSessionRepository;
    private final UserService userService;
    private final SocialAccountService socialAccountService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenService tokenService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationSender notificationSender;

    private final String hashSalt;
    private final int otpTtlMinutes;
    private final int otpCooldownSeconds;
    private final int otpDailyLimit;
    private final int otpMaxFailCount;
    private final int otpBlockMinutes;
    private final int emailTtlMinutes;
    private final int emailMaxFailCount;
    private final boolean exposeDevCode;

    private final boolean refreshCookieSecure;
    private final int refreshCookieMaxAgeSeconds;

    public SignupSessionService(
            SignupSessionRepository signupSessionRepository,
            UserService userService,
            SocialAccountService socialAccountService,
            RefreshTokenRepository refreshTokenRepository,
            TokenService tokenService,
            PasswordEncoder passwordEncoder,
            NotificationSender notificationSender,
            @Value("${verification.hash.salt:__MISSING__}") String hashSalt,
            @Value("${signup.otp.ttl-minutes:5}") int otpTtlMinutes,
            @Value("${signup.otp.cooldown-seconds:60}") int otpCooldownSeconds,
            @Value("${signup.otp.daily-limit:5}") int otpDailyLimit,
            @Value("${signup.otp.max-fail-count:5}") int otpMaxFailCount,
            @Value("${signup.otp.block-minutes:15}") int otpBlockMinutes,
            @Value("${signup.email.ttl-minutes:10}") int emailTtlMinutes,
            @Value("${signup.email.max-fail-count:5}") int emailMaxFailCount,
            @Value("${verification.dev.expose:true}") boolean exposeDevCode,
            @Value("${auth.refresh.cookie.secure:true}") boolean refreshCookieSecure,
            @Value("${auth.refresh.cookie.max-age-seconds:1209600}") int refreshCookieMaxAgeSeconds
    ) {
        this.signupSessionRepository = signupSessionRepository;
        this.userService = userService;
        this.socialAccountService = socialAccountService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenService = tokenService;
        this.passwordEncoder = passwordEncoder;
        this.notificationSender = notificationSender;
        this.hashSalt = hashSalt;
        this.otpTtlMinutes = otpTtlMinutes;
        this.otpCooldownSeconds = otpCooldownSeconds;
        this.otpDailyLimit = otpDailyLimit;
        this.otpMaxFailCount = otpMaxFailCount;
        this.otpBlockMinutes = otpBlockMinutes;
        this.emailTtlMinutes = emailTtlMinutes;
        this.emailMaxFailCount = emailMaxFailCount;
        this.exposeDevCode = exposeDevCode;
        this.refreshCookieSecure = refreshCookieSecure;
        this.refreshCookieMaxAgeSeconds = refreshCookieMaxAgeSeconds;
    }

    /**
     * 회원가입 시작
     * - 가입 세션 생성
     * - OTP 발송(60초 쿨다운, 일 5회)
     */
    @Transactional
    public SignupStartResponse start(SignupStartRequest request) {
        validateSalt();

        if (request == null || request.getSignupType() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }

        String phone = normalizePhone(request.getPhone());
        String nickname = safeTrim(request.getNickname());

        if (nickname == null || nickname.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }

        // ✅ 타입별 필수값 검증
        if (request.getSignupType() == SignupType.EMAIL) {
            if (isBlank(request.getEmail()) || isBlank(request.getPassword())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED);
            }
        } else if (request.getSignupType() == SignupType.SOCIAL) {
            if (isBlank(request.getSocialProvider()) || isBlank(request.getSocialProviderUid())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED);
            }
            // ✅ 권장 정책: 소셜도 email은 받는다(카카오에서 못 받으면 프론트에서 추가 입력)
            if (isBlank(request.getEmail())) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED);
            }
            // password는 소셜에서 필수가 아님 (무시)
        }

        // 휴대폰 기준: 60초 쿨다운
        signupSessionRepository.findTopByPhoneAndOtpLastSentAtIsNotNullOrderByOtpLastSentAtDesc(phone)
                .ifPresent(latest -> {
                    LocalDateTime limit = latest.getOtpLastSentAt().plusSeconds(otpCooldownSeconds);
                    if (LocalDateTime.now().isBefore(limit)) {
                        throw new BusinessException(ErrorCode.SIGNUP_OTP_COOLDOWN);
                    }
                });

        // 휴대폰 기준: 일 5회 제한(발송 기준)
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long sentToday = signupSessionRepository.countByPhoneAndOtpLastSentAtAfter(phone, startOfDay);
        if (sentToday >= otpDailyLimit) {
            throw new BusinessException(ErrorCode.SIGNUP_OTP_DAILY_LIMIT);
        }

        SignupSession session = new SignupSession();
        session.setSignupKey(UUID.randomUUID().toString());
        session.setSignupType(request.getSignupType());
        session.setEmail(safeTrim(request.getEmail()));
        session.setNickname(nickname);
        session.setPhone(phone);

        // ✅ passwordHash 세팅 분기
        if (request.getSignupType() == SignupType.SOCIAL) {
            // 소셜은 비밀번호 입력 없이 가입 → 랜덤 값으로 해시만 채움
            session.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        } else {
            session.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getSignupType() == SignupType.SOCIAL) {
            session.setSocialProvider(safeTrim(request.getSocialProvider()));
            session.setSocialProviderUid(safeTrim(request.getSocialProviderUid()));
            session.setEmailStatus(EmailSessionStatus.NOT_REQUIRED); // ✅ 소셜은 이메일 인증 면제 정책 유지
        } else {
            session.setEmailStatus(EmailSessionStatus.PENDING);
        }

        session.setOtpStatus(OtpSessionStatus.PENDING);
        session.setExpiresAt(LocalDateTime.now().plusMinutes(30));

        // OTP 생성/저장(해시)
        String otp = generateSixDigitCode();
        session.setOtpLastSentAt(LocalDateTime.now());
        session.setOtpCodeHash(HashUtil.sha256Hex(otp + hashSalt));
        session.setOtpExpiresAt(LocalDateTime.now().plusMinutes(otpTtlMinutes));
        session.setOtpFailCount(0);
        session.setOtpBlockedUntil(null);

        SignupSession saved = signupSessionRepository.save(session);

        // OTP 발송(구현체 없으면 default NO-OP)
        String text = "[POPUPS] 인증번호는 " + otp + " 입니다. (" + otpTtlMinutes + "분 이내 입력)";
        notificationSender.sendSms(List.of(phone), text);

        int remaining = Math.max(0, otpDailyLimit - (int) (sentToday + 1));
        return new SignupStartResponse(
                saved.getSignupKey(),
                otpCooldownSeconds,
                remaining,
                saved.getExpiresAt(),
                exposeDevCode ? otp : null
        );
    }

    /**
     * 회원가입 OTP 검증
     * - 성공 시 otp_status=VERIFIED
     */
    @Transactional
    public void verifyOtp(SignupVerifyOtpRequest request) {
        validateSalt();

        SignupSession session = getActiveSession(request == null ? null : request.getSignupKey());

        if (session.getOtpStatus() == OtpSessionStatus.VERIFIED) {
            return;
        }

        if (session.getOtpBlockedUntil() != null && LocalDateTime.now().isBefore(session.getOtpBlockedUntil())) {
            throw new BusinessException(ErrorCode.SIGNUP_OTP_BLOCKED);
        }

        if (session.getOtpExpiresAt() == null || session.getOtpExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.PHONE_OTP_EXPIRED);
        }

        if (session.getOtpFailCount() >= otpMaxFailCount) {
            session.setOtpBlockedUntil(LocalDateTime.now().plusMinutes(otpBlockMinutes));
            signupSessionRepository.save(session);
            throw new BusinessException(ErrorCode.SIGNUP_OTP_BLOCKED);
        }

        String phone = normalizePhone(request.getPhone());
        if (!phone.equals(session.getPhone())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }

        session.setOtpFailCount(session.getOtpFailCount() + 1);

        String hash = HashUtil.sha256Hex(safeTrim(request.getOtpCode()) + hashSalt);
        if (session.getOtpCodeHash() == null || !hash.equals(session.getOtpCodeHash())) {
            signupSessionRepository.save(session);
            throw new BusinessException(ErrorCode.PHONE_OTP_INVALID);
        }

        session.setOtpStatus(OtpSessionStatus.VERIFIED);
        session.setOtpVerifiedAt(LocalDateTime.now());
        session.setOtpFailCount(0);
        session.setOtpBlockedUntil(null);
        signupSessionRepository.save(session);
    }

    /**
     * EMAIL 가입: 이메일 인증 메일 발송
     * - OTP 검증 완료 후에만 허용
     */
    @Transactional
    public EmailVerificationRequestResponse requestEmail(SignupEmailRequest request) {
        validateSalt();

        SignupSession session = getActiveSession(request == null ? null : request.getSignupKey());

        if (session.getSignupType() != SignupType.EMAIL) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        if (session.getOtpStatus() != OtpSessionStatus.VERIFIED) {
            throw new BusinessException(ErrorCode.SIGNUP_NOT_OTP_VERIFIED);
        }

        if (session.getEmailStatus() == EmailSessionStatus.VERIFIED) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        String code = generateSixDigitCode();
        // email 로그인 테스트 배포시 삭제 해야함
        log.info("[DEV] signupKey={} email={} emailCode={}", session.getSignupKey(), session.getEmail(), code);
        // ---------------------------------
        session.setEmailCodeHash(HashUtil.sha256Hex(code + hashSalt));
        session.setEmailExpiresAt(LocalDateTime.now().plusMinutes(emailTtlMinutes));
        session.setEmailLastSentAt(LocalDateTime.now());
        session.setEmailFailCount(0);

        signupSessionRepository.save(session);

        String subject = "[POPUPS] 이메일 인증 코드";
        String body = "인증코드는 " + code + " 입니다. (" + emailTtlMinutes + "분 이내 입력)";
        notificationSender.sendEmail(List.of(session.getEmail()), subject, body);

        return new EmailVerificationRequestResponse(session.getEmailExpiresAt(), exposeDevCode ? code : null);
    }

    /**
     * EMAIL 가입: 이메일 인증 확인
     */
    @Transactional
    public void confirmEmail(SignupEmailConfirmRequest request) {
        validateSalt();

        SignupSession session = getActiveSession(request == null ? null : request.getSignupKey());

        if (session.getSignupType() != SignupType.EMAIL) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        if (session.getOtpStatus() != OtpSessionStatus.VERIFIED) {
            throw new BusinessException(ErrorCode.SIGNUP_NOT_OTP_VERIFIED);
        }

        if (session.getEmailStatus() == EmailSessionStatus.VERIFIED) {
            return;
        }

        if (session.getEmailExpiresAt() == null || session.getEmailExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOKEN_EXPIRED);
        }

        if (session.getEmailFailCount() >= emailMaxFailCount) {
            throw new BusinessException(ErrorCode.SIGNUP_EMAIL_TOO_MANY_ATTEMPTS);
        }

        session.setEmailFailCount(session.getEmailFailCount() + 1);

        String hash = HashUtil.sha256Hex(safeTrim(request.getCode()) + hashSalt);
        if (session.getEmailCodeHash() == null || !hash.equals(session.getEmailCodeHash())) {
            signupSessionRepository.save(session);
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID);
        }

        session.setEmailStatus(EmailSessionStatus.VERIFIED);
        session.setEmailVerifiedAt(LocalDateTime.now());
        signupSessionRepository.save(session);
    }

    /**
     * 회원가입 완료
     * - OTP 필수
     * - EMAIL 가입이면 이메일 인증도 필수
     * - 여기서 users 생성 + access/refresh 발급
     */
    @Transactional
    public LoginResponse complete(SignupCompleteRequest request, HttpServletResponse response) {
        validateSalt();

        SignupSession session = getActiveSession(request == null ? null : request.getSignupKey());

        if (session.getOtpStatus() != OtpSessionStatus.VERIFIED) {
            throw new BusinessException(ErrorCode.SIGNUP_NOT_OTP_VERIFIED);
        }

        if (session.getSignupType() == SignupType.EMAIL && session.getEmailStatus() != EmailSessionStatus.VERIFIED) {
            throw new BusinessException(ErrorCode.SIGNUP_EMAIL_NOT_VERIFIED);
        }

        // users 생성(최초 생성 지점)
        UserCreateRequest ucr = new UserCreateRequest();
        ucr.setEmail(session.getEmail());
        ucr.setNickname(session.getNickname());
        ucr.setPhone(session.getPhone());

        // 프로젝트 기본값
        ucr.setShowAge(false);
        ucr.setShowGender(false);
        ucr.setShowPet(false);

        User saved;
        try {
            saved = userService.createWithPasswordHash(ucr, session.getPasswordHash());
        } catch (IllegalArgumentException e) {
            // UserService의 IllegalArgumentException을 표준 ErrorCode로 변환한다.
            String msg = e.getMessage();
            if (msg != null && msg.contains("Email")) {
                throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
            }
            if (msg != null && msg.contains("Phone")) {
                throw new BusinessException(ErrorCode.DUPLICATE_PHONE);
            }
            if (msg != null && msg.contains("Nickname")) {
                throw new BusinessException(ErrorCode.DUPLICATE_NICKNAME);
            }
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        }

        // SOCIAL 가입이면 소셜 계정 연동
        if (session.getSignupType() == SignupType.SOCIAL) {
            SocialLinkRequest link = new SocialLinkRequest();
            link.setProvider(session.getSocialProvider());
            link.setProviderUid(session.getSocialProviderUid());
            socialAccountService.link(saved.getUserId(), link);
        }

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

        // 가입 완료 후 세션 제거(재사용 방지)
        signupSessionRepository.delete(session);

        return new LoginResponse(access, userId, roleName);
    }

    /* =========================
     * 내부 유틸
     * ========================= */

    private SignupSession getActiveSession(String signupKey) {
        if (signupKey == null || signupKey.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }

        SignupSession session = signupSessionRepository.findBySignupKey(signupKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.SIGNUP_SESSION_NOT_FOUND));

        if (session.getExpiresAt() != null && session.getExpiresAt().isBefore(LocalDateTime.now())) {
            session.setOtpStatus(OtpSessionStatus.EXPIRED);
            signupSessionRepository.save(session);
            throw new BusinessException(ErrorCode.SIGNUP_SESSION_EXPIRED);
        }

        return session;
    }

    private void validateSalt() {
        if (hashSalt == null || hashSalt.isBlank() || "__MISSING__".equals(hashSalt)) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }
    }

    private String generateSixDigitCode() {
        int value = random.nextInt(900000) + 100000;
        return String.valueOf(value);
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }
        return phone.replaceAll("[^0-9]", "");
    }

    private String safeTrim(String s) {
        return s == null ? null : s.trim();
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    /**
     * Refresh 쿠키 세팅
     * - Path=/api/auth
     * - SameSite=Lax
     */
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
}
