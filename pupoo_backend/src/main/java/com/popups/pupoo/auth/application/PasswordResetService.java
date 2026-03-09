package com.popups.pupoo.auth.application;

import com.popups.pupoo.auth.domain.model.PasswordResetToken;
import com.popups.pupoo.auth.dto.PasswordResetConfirmRequest;
import com.popups.pupoo.auth.dto.PasswordResetRequest;
import com.popups.pupoo.auth.dto.PasswordResetRequestResponse;
import com.popups.pupoo.auth.persistence.PasswordResetTokenRepository;
import com.popups.pupoo.auth.persistence.RefreshTokenRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.common.util.HashUtil;
import com.popups.pupoo.notification.port.NotificationSender;
import com.popups.pupoo.user.domain.enums.UserStatus;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.persistence.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final NotificationSender notificationSender;
    private final PasswordEncoder passwordEncoder;

    private final String hashSalt;
    private final String baseUrl;
    private final int tokenTtlMinutes;
    private final int requestCooldownSeconds;
    private final boolean exposeDevToken;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            RefreshTokenRepository refreshTokenRepository,
            NotificationSender notificationSender,
            PasswordEncoder passwordEncoder,
            @Value("${verification.hash.salt:__MISSING__}") String hashSalt,
            @Value("${verification.password-reset.base-url:http://localhost:8080}") String baseUrl,
            @Value("${verification.password-reset.ttl-minutes:30}") int tokenTtlMinutes,
            @Value("${verification.request.cooldown-seconds:60}") int requestCooldownSeconds,
            @Value("${verification.dev.expose:true}") boolean exposeDevToken
    ) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.notificationSender = notificationSender;
        this.passwordEncoder = passwordEncoder;
        this.hashSalt = hashSalt;
        this.baseUrl = baseUrl;
        this.tokenTtlMinutes = tokenTtlMinutes;
        this.requestCooldownSeconds = requestCooldownSeconds;
        this.exposeDevToken = exposeDevToken;
    }

    @Transactional
    public PasswordResetRequestResponse requestPasswordReset(PasswordResetRequest request) {
        validateHashSalt();

        String email = normalizeEmail(request == null ? null : request.getEmail());
        String phone = normalizePhone(request == null ? null : request.getPhone());

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return new PasswordResetRequestResponse(null, null);
        }

        if (!normalizePhone(user.getPhone()).equals(phone) || !isResetAllowedUser(user)) {
            return new PasswordResetRequestResponse(null, null);
        }

        LocalDateTime now = LocalDateTime.now();
        PasswordResetToken latestToken = passwordResetTokenRepository
                .findTopByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(user.getUserId())
                .orElse(null);

        if (latestToken != null && now.isBefore(latestToken.getCreatedAt().plusSeconds(requestCooldownSeconds))) {
            return new PasswordResetRequestResponse(latestToken.getExpiresAt(), null);
        }

        List<PasswordResetToken> activeTokens =
                passwordResetTokenRepository.findAllByUserIdAndUsedAtIsNull(user.getUserId());
        for (PasswordResetToken token : activeTokens) {
            token.markUsed(now);
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        String tokenHash = HashUtil.sha256Hex(token + hashSalt);
        LocalDateTime expiresAt = now.plusMinutes(tokenTtlMinutes);

        passwordResetTokenRepository.save(new PasswordResetToken(user.getUserId(), tokenHash, expiresAt));

        String resetUrl = baseUrl + "/auth/reset-password?token=" + token;
        String subject = "POPUPS 비밀번호 재설정";
        String body = "아래 링크에서 새 비밀번호를 설정해 주세요.\n\n"
                + resetUrl
                + "\n\n이 링크는 "
                + tokenTtlMinutes
                + "분 동안 유효합니다.";

        notificationSender.sendEmail(List.of(user.getEmail()), subject, body);

        return new PasswordResetRequestResponse(expiresAt, exposeDevToken ? token : null);
    }

    @Transactional(readOnly = true)
    public void validatePasswordResetToken(String token) {
        resolveValidToken(token);
    }

    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmRequest request) {
        if (request == null || request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "newPassword: must not be blank");
        }

        PasswordResetToken passwordResetToken = resolveValidToken(request.getToken());

        User user = userRepository.findById(passwordResetToken.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PROFILE_NOT_FOUND));
        validateUserStatus(user);

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        refreshTokenRepository.deleteAllByUserId(user.getUserId());

        passwordResetToken.markUsed(LocalDateTime.now());
        passwordResetTokenRepository.save(passwordResetToken);
    }

    private PasswordResetToken resolveValidToken(String rawToken) {
        validateHashSalt();

        if (rawToken == null || rawToken.isBlank()) {
            throw new BusinessException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID);
        }

        String tokenHash = HashUtil.sha256Hex(rawToken + hashSalt);
        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull(tokenHash)
                .orElseThrow(() -> new BusinessException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID));

        if (passwordResetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED);
        }

        return passwordResetToken;
    }

    private void validateHashSalt() {
        if (hashSalt == null || hashSalt.isBlank() || "__MISSING__".equals(hashSalt)) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }
    }

    private boolean isResetAllowedUser(User user) {
        UserStatus status = user.getStatus();
        return status == UserStatus.ACTIVE;
    }

    private void validateUserStatus(User user) {
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
}
