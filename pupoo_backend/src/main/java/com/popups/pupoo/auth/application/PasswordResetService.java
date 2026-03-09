package com.popups.pupoo.auth.application;

import com.popups.pupoo.auth.domain.model.PasswordResetToken;
import com.popups.pupoo.auth.dto.PasswordResetConfirmRequest;
import com.popups.pupoo.auth.dto.PasswordResetRequest;
import com.popups.pupoo.auth.dto.PasswordResetRequestResponse;
import com.popups.pupoo.auth.dto.PasswordResetVerifyRequest;
import com.popups.pupoo.auth.persistence.PasswordResetTokenRepository;
import com.popups.pupoo.auth.persistence.RefreshTokenRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.common.util.HashUtil;
import com.popups.pupoo.user.domain.enums.UserStatus;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.persistence.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PasswordResetService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int VERIFICATION_CODE_LENGTH = 6;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    private final String hashSalt;
    private final int tokenTtlMinutes;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            @Value("${verification.hash.salt:__MISSING__}") String hashSalt,
            @Value("${verification.password-reset.ttl-minutes:30}") int tokenTtlMinutes
    ) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.hashSalt = hashSalt;
        this.tokenTtlMinutes = tokenTtlMinutes;
    }

    @Transactional
    public PasswordResetRequestResponse requestPasswordReset(PasswordResetRequest request) {
        validateHashSalt();

        User user = resolveResetUser(
                request == null ? null : request.getEmail(),
                request == null ? null : request.getPhone()
        );

        LocalDateTime now = LocalDateTime.now();
        List<PasswordResetToken> activeTokens =
                passwordResetTokenRepository.findAllByUserIdAndUsedAtIsNull(user.getUserId());
        for (PasswordResetToken token : activeTokens) {
            token.markUsed(now);
        }

        String verificationCode = generateVerificationCode();
        String tokenHash = HashUtil.sha256Hex(verificationCode + hashSalt);
        LocalDateTime expiresAt = now.plusMinutes(tokenTtlMinutes);

        passwordResetTokenRepository.save(new PasswordResetToken(user.getUserId(), tokenHash, expiresAt));

        return new PasswordResetRequestResponse(expiresAt, verificationCode);
    }

    @Transactional(readOnly = true)
    public void verifyPasswordResetCode(PasswordResetVerifyRequest request) {
        resolveVerifiedContext(request == null ? null : request.getEmail(),
                request == null ? null : request.getPhone(),
                request == null ? null : request.getVerificationCode());
    }

    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmRequest request) {
        if (request == null || request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "newPassword: must not be blank");
        }

        PasswordResetContext context = resolveVerifiedContext(
                request.getEmail(),
                request.getPhone(),
                request.getVerificationCode()
        );

        context.user().setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(context.user());

        refreshTokenRepository.deleteAllByUserId(context.user().getUserId());

        context.token().markUsed(LocalDateTime.now());
        passwordResetTokenRepository.save(context.token());
    }

    private PasswordResetContext resolveVerifiedContext(String email, String phone, String verificationCode) {
        validateHashSalt();

        User user = resolveResetUser(email, phone);
        PasswordResetToken passwordResetToken = passwordResetTokenRepository
                .findTopByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(user.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID));

        if (passwordResetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED);
        }

        String normalizedCode = normalizeVerificationCode(verificationCode);
        String tokenHash = HashUtil.sha256Hex(normalizedCode + hashSalt);
        if (!passwordResetToken.getTokenHash().equals(tokenHash)) {
            throw new BusinessException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID);
        }

        return new PasswordResetContext(user, passwordResetToken);
    }

    private void validateHashSalt() {
        if (hashSalt == null || hashSalt.isBlank() || "__MISSING__".equals(hashSalt)) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }
    }

    private User resolveResetUser(String email, String phone) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedPhone = normalizePhone(phone);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST, "일치하는 회원 정보를 찾지 못했습니다."));

        UserStatus status = user.getStatus();
        if (status != UserStatus.ACTIVE || !normalizePhone(user.getPhone()).equals(normalizedPhone)) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "일치하는 회원 정보를 찾지 못했습니다.");
        }

        return user;
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "email: must not be blank");
        }
        return email.trim().toLowerCase();
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "phone: must not be blank");
        }

        String normalized = phone.replaceAll("[^0-9]", "");
        if (normalized.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "phone: must contain digits");
        }
        return normalized;
    }

    private String normalizeVerificationCode(String verificationCode) {
        if (verificationCode == null || verificationCode.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "verificationCode: must not be blank");
        }

        String normalized = verificationCode.trim();
        if (!normalized.matches("\\d{" + VERIFICATION_CODE_LENGTH + "}")) {
            throw new BusinessException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID);
        }
        return normalized;
    }

    private String generateVerificationCode() {
        return String.format("%0" + VERIFICATION_CODE_LENGTH + "d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private record PasswordResetContext(User user, PasswordResetToken token) {
    }
}
