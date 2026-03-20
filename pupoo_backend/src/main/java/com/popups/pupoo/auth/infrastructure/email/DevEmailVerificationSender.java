package com.popups.pupoo.auth.infrastructure.email;

import com.popups.pupoo.auth.port.EmailVerificationSenderPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;

/**
 * 기능: 개발 환경용 인증 이메일 발송 어댑터를 제공한다.
 * 설명: 실제 SES 호출 대신 인증별 payload를 로그에 출력해 auth 도메인 발송 흐름을 유지한다.
 * 흐름: 서비스가 포트를 호출하면 인증 유형과 대상 값을 dev 로그에 기록한다.
 */
public class DevEmailVerificationSender implements EmailVerificationSenderPort {

    private static final Logger log = LoggerFactory.getLogger(DevEmailVerificationSender.class);

    private final String provider;

    public DevEmailVerificationSender(String provider) {
        this.provider = provider;
    }

    @Override
    public void sendVerificationEmail(String email, String code) {
        // 기능: 회원가입 이메일 인증 코드를 개발 로그로 노출한다.
        // 설명: 실제 메일 발송 없이 수신자와 인증 코드를 확인할 수 있게 한다.
        // 흐름: provider를 기록하고 signup verification payload를 출력한다.
        log.info("[AUTH_EMAIL_PROVIDER={}] signup verification email={}, code=<masked>", provider, maskEmail(email));
    }

    @Override
    public void sendPasswordResetEmail(String email, String token) {
        // 기능: 비밀번호 재설정 코드를 개발 로그로 노출한다.
        // 설명: 실제 메일 발송 없이 재설정 코드를 확인할 수 있게 한다.
        // 흐름: provider를 기록하고 password reset payload를 출력한다.
        log.info("[AUTH_EMAIL_PROVIDER={}] password reset email={}, token=<masked>", provider, maskEmail(email));
    }

    @Override
    public void sendAccountVerificationEmail(String email, String token) {
        // 기능: 계정 이메일 인증 링크용 토큰을 개발 로그로 노출한다.
        // 설명: 운영 메일 대신 토큰을 바로 확인해 인증 링크 흐름을 검증할 수 있게 한다.
        // 흐름: provider를 기록하고 account verification payload를 출력한다.
        log.info("[AUTH_EMAIL_PROVIDER={}] account verification email={}, token=<masked>", provider, maskEmail(email));
    }

    @Override
    public void sendEmailChangeVerificationEmail(String email, String token, LocalDateTime expiresAt) {
        // 기능: 이메일 변경 인증 토큰을 개발 로그로 노출한다.
        // 설명: 실제 메일 없이 새 이메일과 만료 시각을 함께 확인할 수 있게 한다.
        // 흐름: provider를 기록하고 email change payload를 출력한다.
        log.info("[AUTH_EMAIL_PROVIDER={}] email change email={}, token=<masked>, expiresAt={}",
                provider, maskEmail(email), expiresAt);
    }

    private String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "<empty>";
        }

        int atIndex = email.indexOf('@');
        if (atIndex <= 1 || atIndex == email.length() - 1) {
            return "***";
        }

        String localPart = email.substring(0, atIndex);
        String domainPart = email.substring(atIndex + 1);
        return localPart.charAt(0) + "***@" + domainPart;
    }
}
