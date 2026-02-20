// 파일 위치: src/main/java/com/popups/pupoo/auth/application/EmailVerificationService.java
package com.popups.pupoo.auth.application;

import com.popups.pupoo.auth.domain.model.EmailVerificationToken;
import com.popups.pupoo.auth.dto.EmailVerificationRequestResponse;
import com.popups.pupoo.auth.persistence.EmailVerificationTokenRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.common.util.HashUtil;
import com.popups.pupoo.notification.port.NotificationSender;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.persistence.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class EmailVerificationService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final NotificationSender notificationSender;

    private final String hashSalt;
    private final String baseUrl;
    private final int tokenTtlHours;
    private final int requestCooldownSeconds;
    private final boolean exposeDevToken;

    public EmailVerificationService(
            UserRepository userRepository,
            EmailVerificationTokenRepository tokenRepository,
            NotificationSender notificationSender,
            @Value("${verification.hash.salt:__MISSING__}") String hashSalt,
            @Value("${verification.email.base-url:http://localhost:8080}") String baseUrl,
            @Value("${verification.email.ttl-hours:24}") int tokenTtlHours,
            @Value("${verification.request.cooldown-seconds:60}") int requestCooldownSeconds,
            @Value("${verification.dev.expose:true}") boolean exposeDevToken
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.notificationSender = notificationSender;
        this.hashSalt = hashSalt;
        this.baseUrl = baseUrl;
        this.tokenTtlHours = tokenTtlHours;
        this.requestCooldownSeconds = requestCooldownSeconds;
        this.exposeDevToken = exposeDevToken;
    }

    /**
     * 이메일 인증 메일 발송(재발송 포함)
     *
     * 정책
     * - local(email/password) 가입 사용자 대상.
     * - email_verified=true면 멱등 처리 대신 409로 응답한다.
     * - 토큰은 SHA-256 해시만 저장하고, 원문은 반환하지 않는다(운영).
     */
    @Transactional
    public EmailVerificationRequestResponse requestEmailVerification(Long userId) {
        if (hashSalt == null || hashSalt.isBlank() || "__MISSING__".equals(hashSalt)) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PROFILE_NOT_FOUND));

        if (user.isEmailVerified()) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        tokenRepository.findTopByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(userId).ifPresent(latest -> {
            LocalDateTime cooldownLimit = latest.getCreatedAt().plusSeconds(requestCooldownSeconds);
            if (LocalDateTime.now().isBefore(cooldownLimit)) {
                throw new BusinessException(ErrorCode.VERIFICATION_TOO_MANY_REQUESTS);
            }
        });

        String token = UUID.randomUUID().toString().replace("-", "");
        String tokenHash = HashUtil.sha256Hex(token + hashSalt);

        LocalDateTime expiresAt = LocalDateTime.now().plusHours(tokenTtlHours);
        tokenRepository.save(new EmailVerificationToken(userId, tokenHash, expiresAt));

        String verifyUrl = baseUrl + "/api/auth/email/verification/confirm?token=" + token;
        String subject = "POPUPS 이메일 인증";
        String body = "이메일 인증을 완료하려면 아래 링크를 클릭하세요.\n\n" + verifyUrl + "\n\n" +
                "이 링크는 " + tokenTtlHours + "시간 동안 유효합니다.";

        notificationSender.sendEmail(List.of(user.getEmail()), subject, body);

        return new EmailVerificationRequestResponse(expiresAt, exposeDevToken ? token : null);
    }

    /**
     * 이메일 인증 토큰 검증 및 사용자 상태 갱신
     */
    @Transactional
    public void confirmEmailVerification(String token) {
        if (hashSalt == null || hashSalt.isBlank() || "__MISSING__".equals(hashSalt)) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }

        if (token == null || token.isBlank()) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID);
        }

        String tokenHash = HashUtil.sha256Hex(token + hashSalt);

        EmailVerificationToken evt = tokenRepository.findByTokenHashAndUsedAtIsNull(tokenHash)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID));

        if (evt.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOKEN_EXPIRED);
        }

        User user = userRepository.findById(evt.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PROFILE_NOT_FOUND));

        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        evt.markUsed(LocalDateTime.now());
        tokenRepository.save(evt);
    }
}
