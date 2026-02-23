// file: src/main/java/com/popups/pupoo/auth/application/PhoneVerificationService.java
package com.popups.pupoo.auth.application;

import com.popups.pupoo.auth.domain.model.PhoneVerificationToken;
import com.popups.pupoo.auth.dto.PhoneVerificationConfirmRequest;
import com.popups.pupoo.auth.dto.PhoneVerificationRequest;
import com.popups.pupoo.auth.dto.PhoneVerificationRequestResponse;
import com.popups.pupoo.auth.persistence.PhoneVerificationTokenRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.common.util.HashUtil;
import com.popups.pupoo.notification.port.NotificationSender;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.persistence.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PhoneVerificationService {

    private static final SecureRandom random = new SecureRandom();

    private final UserRepository userRepository;
    private final PhoneVerificationTokenRepository tokenRepository;
    private final NotificationSender notificationSender;

    private final String hashSalt;
    private final int otpTtlMinutes;
    private final int requestCooldownSeconds;
    private final int maxAttempts;
    private final boolean exposeDevCode;

    public PhoneVerificationService(
            UserRepository userRepository,
            PhoneVerificationTokenRepository tokenRepository,
            NotificationSender notificationSender,
            @Value("${verification.hash.salt:__MISSING__}") String hashSalt,
            @Value("${verification.phone.ttl-minutes:5}") int otpTtlMinutes,
            @Value("${verification.request.cooldown-seconds:60}") int requestCooldownSeconds,
            @Value("${verification.phone.max-attempts:5}") int maxAttempts,
            @Value("${verification.dev.expose:true}") boolean exposeDevCode
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.notificationSender = notificationSender;
        this.hashSalt = hashSalt;
        this.otpTtlMinutes = otpTtlMinutes;
        this.requestCooldownSeconds = requestCooldownSeconds;
        this.maxAttempts = maxAttempts;
        this.exposeDevCode = exposeDevCode;
    }

    /**
     * 휴대폰 OTP 발송
     *
     * 정책
     * - phone_verified=true면 409로 응답한다.
     * - OTP 원문은 저장하지 않고 code_hash(SHA-256 hex)만 저장한다.
     */
    @Transactional
    public PhoneVerificationRequestResponse requestPhoneVerification(Long userId, PhoneVerificationRequest request) {
        if (hashSalt == null || hashSalt.isBlank() || "__MISSING__".equals(hashSalt)) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PROFILE_NOT_FOUND));

        if (user.isPhoneVerified()) {
            throw new BusinessException(ErrorCode.PHONE_ALREADY_VERIFIED);
        }

        String phone = normalizePhone(request.getPhone());

        tokenRepository.findTopByUserIdAndPhoneAndUsedAtIsNullOrderByCreatedAtDesc(userId, phone).ifPresent(latest -> {
            LocalDateTime cooldownLimit = latest.getCreatedAt().plusSeconds(requestCooldownSeconds);
            if (LocalDateTime.now().isBefore(cooldownLimit)) {
                throw new BusinessException(ErrorCode.VERIFICATION_TOO_MANY_REQUESTS);
            }
        });

        String code = generateSixDigitCode();
        String codeHash = HashUtil.sha256Hex(code + hashSalt);

        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(otpTtlMinutes);
        tokenRepository.save(new PhoneVerificationToken(userId, phone, codeHash, expiresAt));

        String text = "[POPUPS] 인증번호는 " + code + " 입니다. (" + otpTtlMinutes + "분 이내 입력)";
        notificationSender.sendSms(List.of(phone), text);

        return new PhoneVerificationRequestResponse(expiresAt, exposeDevCode ? code : null);
    }

    /**
     * 휴대폰 OTP 확인
     */
    @Transactional
    public void confirmPhoneVerification(Long userId, PhoneVerificationConfirmRequest request) {
        if (hashSalt == null || hashSalt.isBlank() || "__MISSING__".equals(hashSalt)) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PROFILE_NOT_FOUND));

        if (user.isPhoneVerified()) {
            throw new BusinessException(ErrorCode.PHONE_ALREADY_VERIFIED);
        }

        String phone = normalizePhone(request.getPhone());
        PhoneVerificationToken pvt = tokenRepository.findTopByUserIdAndPhoneAndUsedAtIsNullOrderByCreatedAtDesc(userId, phone)
                .orElseThrow(() -> new BusinessException(ErrorCode.PHONE_OTP_INVALID));

        if (pvt.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.PHONE_OTP_EXPIRED);
        }

        if (pvt.getAttemptCount() >= maxAttempts) {
            throw new BusinessException(ErrorCode.PHONE_OTP_TOO_MANY_ATTEMPTS);
        }

        pvt.increaseAttemptCount();

        String codeHash = HashUtil.sha256Hex(request.getCode() + hashSalt);
        if (!codeHash.equals(pvt.getCodeHash())) {
            tokenRepository.save(pvt);
            throw new BusinessException(ErrorCode.PHONE_OTP_INVALID);
        }

        user.setPhoneVerified(true);
        userRepository.save(user);

        pvt.markUsed(LocalDateTime.now());
        tokenRepository.save(pvt);
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
}
