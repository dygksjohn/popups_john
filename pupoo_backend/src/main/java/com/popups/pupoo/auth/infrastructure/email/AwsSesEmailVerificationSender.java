package com.popups.pupoo.auth.infrastructure.email;

import com.popups.pupoo.auth.config.AwsMessagingProperties;
import com.popups.pupoo.auth.port.EmailVerificationSenderPort;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.Body;
import software.amazon.awssdk.services.sesv2.model.Content;
import software.amazon.awssdk.services.sesv2.model.Destination;
import software.amazon.awssdk.services.sesv2.model.EmailContent;
import software.amazon.awssdk.services.sesv2.model.Message;
import software.amazon.awssdk.services.sesv2.model.SendEmailRequest;
import software.amazon.awssdk.services.sesv2.model.SesV2Exception;

import java.time.LocalDateTime;

/**
 * 기능: AWS SES를 사용해 인증 이메일을 발송한다.
 * 설명: 인증 유형별 제목/본문 조립을 이 어댑터 내부로 모아 auth 서비스의 직접 발송 책임을 제거한다.
 * 흐름: 인증 유형별 템플릿 생성 -> SES sendEmail 호출 -> 실패 시 로그 후 BusinessException 변환 순서다.
 */
public class AwsSesEmailVerificationSender implements EmailVerificationSenderPort {

    private static final Logger log = LoggerFactory.getLogger(AwsSesEmailVerificationSender.class);

    private final String provider;
    private final SesV2Client sesV2Client;
    private final AwsMessagingProperties awsMessagingProperties;
    private final String verificationBaseUrl;

    public AwsSesEmailVerificationSender(
            String provider,
            SesV2Client sesV2Client,
            AwsMessagingProperties awsMessagingProperties,
            String verificationBaseUrl
    ) {
        this.provider = provider;
        this.sesV2Client = sesV2Client;
        this.awsMessagingProperties = awsMessagingProperties;
        this.verificationBaseUrl = verificationBaseUrl;
        validateSesProperties();
    }

    @Override
    public void sendVerificationEmail(String email, String code) {
        // 기능: 회원가입 이메일 인증 코드를 SES로 발송한다.
        // 설명: 회원가입 단계에서 입력하는 코드형 인증 메일을 텍스트 본문으로 구성한다.
        // 흐름: 템플릿 생성 -> SES 호출 -> 성공 로그 또는 예외 변환 순서로 처리한다.
        sendEmail(email, buildSignupVerificationSubject(), buildSignupVerificationBody(code), "signup verification");
    }

    @Override
    public void sendPasswordResetEmail(String email, String token) {
        // 기능: 비밀번호 재설정 코드를 SES로 발송한다.
        // 설명: 재설정 흐름에서 사용하는 코드형 메일을 텍스트 본문으로 구성한다.
        // 흐름: 템플릿 생성 -> SES 호출 -> 성공 로그 또는 예외 변환 순서로 처리한다.
        sendEmail(email, buildPasswordResetSubject(), buildPasswordResetBody(token), "password reset");
    }

    @Override
    public void sendAccountVerificationEmail(String email, String token) {
        // 기능: 계정 이메일 인증 링크 메일을 SES로 발송한다.
        // 설명: 계정 인증 토큰을 확인 링크로 조합해 클릭형 메일을 보낸다.
        // 흐름: 링크 생성 -> 템플릿 생성 -> SES 호출 -> 성공 로그 또는 예외 변환 순서로 처리한다.
        sendEmail(email, buildAccountVerificationSubject(), buildAccountVerificationBody(token), "account verification");
    }

    @Override
    public void sendEmailChangeVerificationEmail(String email, String token, LocalDateTime expiresAt) {
        // 기능: 이메일 변경 인증 토큰 메일을 SES로 발송한다.
        // 설명: 새 이메일로 변경 토큰과 만료 시각을 전달해 변경 확인 흐름을 유지한다.
        // 흐름: 템플릿 생성 -> SES 호출 -> 성공 로그 또는 예외 변환 순서로 처리한다.
        sendEmail(email, buildEmailChangeSubject(), buildEmailChangeBody(token, expiresAt), "email change");
    }

    private void sendEmail(String targetEmail, String subject, String body, String mailType) {
        String maskedTarget = maskEmail(targetEmail);
        String fromAddress = awsMessagingProperties.getSes() != null ? awsMessagingProperties.getSes().getFromAddress() : null;
        try {
            sesV2Client.sendEmail(
                    SendEmailRequest.builder()
                            .fromEmailAddress(resolveFromAddress())
                            .destination(Destination.builder().toAddresses(targetEmail).build())
                            .content(
                                    EmailContent.builder()
                                            .simple(
                                                    Message.builder()
                                                            .subject(buildContent(subject))
                                                            .body(Body.builder().text(buildContent(body)).build())
                                                            .build()
                                            )
                                            .build()
                            )
                            .build()
            );

            log.info("[AUTH_EMAIL_PROVIDER={}] SES email sent. type={}, target={}, fromConfigured={}, verificationBaseUrlConfigured={}",
                    provider,
                    mailType,
                    maskedTarget,
                    hasText(fromAddress),
                    hasText(verificationBaseUrl));
        } catch (SesV2Exception | SdkClientException e) {
            log.error("[AUTH_EMAIL_PROVIDER={}] SES email failed. type={}, target={}, fromConfigured={}, verificationBaseUrlConfigured={}, reason={}",
                    provider,
                    mailType,
                    maskedTarget,
                    hasText(fromAddress),
                    hasText(verificationBaseUrl),
                    e.getMessage(),
                    e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "인증 이메일 발송에 실패했습니다.");
        }
    }

    private Content buildContent(String value) {
        return Content.builder()
                .data(value)
                .charset("UTF-8")
                .build();
    }

    private String resolveFromAddress() {
        String fromAddress = awsMessagingProperties.getSes().getFromAddress();
        String fromName = awsMessagingProperties.getSes().getFromName();
        if (fromName == null || fromName.isBlank()) {
            return fromAddress;
        }
        return fromName + " <" + fromAddress + ">";
    }

    private String buildSignupVerificationSubject() {
        return "[POPUPS] 이메일 인증 코드";
    }

    private String buildSignupVerificationBody(String code) {
        return "POPUPS 회원가입 이메일 인증 코드입니다.\n\n인증 코드: " + code
                + "\n\n서비스 화면에서 코드를 입력해 인증을 완료해 주세요.";
    }

    private String buildPasswordResetSubject() {
        return "[POPUPS] 비밀번호 재설정 코드";
    }

    private String buildPasswordResetBody(String token) {
        return "POPUPS 비밀번호 재설정 코드입니다.\n\n재설정 코드: " + token
                + "\n\n서비스 화면에서 코드를 입력해 비밀번호를 변경해 주세요.";
    }

    private String buildAccountVerificationSubject() {
        return "[POPUPS] 계정 이메일 인증";
    }

    private String buildAccountVerificationBody(String token) {
        String verifyUrl = verificationBaseUrl + "/api/auth/email/verification/confirm?token=" + token;
        return "POPUPS 계정 이메일 인증을 완료하려면 아래 링크를 열어 주세요.\n\n"
                + verifyUrl
                + "\n\n링크는 발송 후 24시간 이내에 사용해 주세요.";
    }

    private String buildEmailChangeSubject() {
        return "[POPUPS] 이메일 변경 인증";
    }

    private String buildEmailChangeBody(String token, LocalDateTime expiresAt) {
        return "POPUPS 이메일 변경 인증 토큰입니다.\n\n변경 토큰: " + token
                + "\n\n만료 시각: " + expiresAt
                + "\n\n서비스 화면에서 토큰을 입력해 이메일 변경을 완료해 주세요.";
    }

    private void validateSesProperties() {
        if (awsMessagingProperties.getSes() == null
                || awsMessagingProperties.getSes().getFromAddress() == null
                || awsMessagingProperties.getSes().getFromAddress().isBlank()) {
            throw new IllegalStateException("aws.ses.from-address 설정이 필요합니다.");
        }
        if (verificationBaseUrl == null || verificationBaseUrl.isBlank()) {
            throw new IllegalStateException("verification.email.base-url 설정이 필요합니다.");
        }
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

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
