package com.popups.pupoo.auth.config;

import com.popups.pupoo.auth.infrastructure.email.AwsSesEmailVerificationSender;
import com.popups.pupoo.auth.infrastructure.email.DevEmailVerificationSender;
import com.popups.pupoo.auth.infrastructure.sms.AwsSnsSmsOtpSender;
import com.popups.pupoo.auth.infrastructure.sms.DevSmsOtpSender;
import com.popups.pupoo.auth.port.EmailVerificationSenderPort;
import com.popups.pupoo.auth.port.SmsOtpSenderPort;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sns.SnsClient;

/**
 * 기능: 인증 외부 발송 포트와 AWS 클라이언트를 구성한다.
 * 설명: auth 모듈이 NotificationSender를 직접 보지 않도록 provider 선택과 SDK 생성 책임을 config로 모은다.
 * 흐름: 프로퍼티 바인딩 -> provider 검증 -> 포트 구현 선택 -> 필요 시 AWS 클라이언트 생성 순서로 동작한다.
 */
@Configuration
@EnableConfigurationProperties({AuthProperties.class, AwsMessagingProperties.class})
public class AuthDeliveryConfig {

    /**
     * 기능: 인증 이메일 발송 포트를 provider 설정에 따라 선택한다.
     * 설명: dev와 aws-ses 구현체를 하나의 auth 전용 포트 아래에서 선택해 서비스 계층을 고정한다.
     * 흐름: provider 확인 -> 구현체 생성 -> 잘못된 값이면 시작 단계에서 실패한다.
     */
    @Bean
    public EmailVerificationSenderPort emailVerificationSenderPort(
            AuthProperties authProperties,
            AwsMessagingProperties awsMessagingProperties,
            ObjectProvider<SesV2Client> sesV2ClientProvider,
            @Value("${verification.email.base-url:http://3.38.233.224:8080}") String verificationBaseUrl
    ) {
        String provider = normalizeProvider(authProperties.getEmail().getProvider(), "auth.email.provider");
        return switch (provider) {
            case "dev" -> new DevEmailVerificationSender(provider);
            case "aws-ses" -> new AwsSesEmailVerificationSender(
                    provider,
                    requireBean(sesV2ClientProvider.getIfAvailable(), "auth.email.provider=aws-ses"),
                    awsMessagingProperties,
                    verificationBaseUrl
            );
            default -> throw new IllegalStateException("지원하지 않는 auth.email.provider 값입니다: " + provider);
        };
    }

    /**
     * 기능: 인증 SMS OTP 발송 포트를 provider 설정에 따라 선택한다.
     * 설명: dev와 aws-sns 구현체를 하나의 auth 전용 포트 아래에서 선택한다.
     * 흐름: provider 확인 -> 구현체 생성 -> 잘못된 값이면 시작 단계에서 실패한다.
     */
    @Bean
    public SmsOtpSenderPort smsOtpSenderPort(
            AuthProperties authProperties,
            AwsMessagingProperties awsMessagingProperties,
            ObjectProvider<SnsClient> snsClientProvider
    ) {
        String provider = normalizeProvider(authProperties.getSms().getProvider(), "auth.sms.provider");
        return switch (provider) {
            case "dev" -> new DevSmsOtpSender(provider);
            case "aws-sns" -> new AwsSnsSmsOtpSender(
                    provider,
                    requireBean(snsClientProvider.getIfAvailable(), "auth.sms.provider=aws-sns"),
                    awsMessagingProperties
            );
            default -> throw new IllegalStateException("지원하지 않는 auth.sms.provider 값입니다: " + provider);
        };
    }

    /**
     * 기능: 이메일 provider가 aws-ses일 때 SES 클라이언트를 생성한다.
     * 설명: 리전 값이 비어 있으면 운영 설정 오류로 보고 시작 단계에서 실패시킨다.
     * 흐름: 리전 검증 -> SES builder 생성 -> 클라이언트 반환 순서로 동작한다.
     */
    @Bean
    @ConditionalOnProperty(name = "auth.email.provider", havingValue = "aws-ses")
    public SesV2Client sesV2Client(AwsMessagingProperties awsMessagingProperties) {
        return SesV2Client.builder()
                .region(resolveDefaultRegion(awsMessagingProperties))
                .build();
    }

    /**
     * 기능: SMS provider가 aws-sns일 때 SNS 클라이언트를 생성한다.
     * 설명: sms 전용 리전이 없으면 공통 aws.region을 재사용한다.
     * 흐름: SMS 리전 확인 -> 없으면 기본 리전 사용 -> SNS builder 생성 순서다.
     */
    @Bean
    @ConditionalOnProperty(name = "auth.sms.provider", havingValue = "aws-sns")
    public SnsClient snsClient(AwsMessagingProperties awsMessagingProperties) {
        return SnsClient.builder()
                .region(resolveSmsRegion(awsMessagingProperties))
                .build();
    }

    private Region resolveDefaultRegion(AwsMessagingProperties awsMessagingProperties) {
        String region = awsMessagingProperties.getRegion();
        if (region == null || region.isBlank()) {
            throw new IllegalStateException("aws.region 설정이 필요합니다.");
        }
        return Region.of(region);
    }

    private Region resolveSmsRegion(AwsMessagingProperties awsMessagingProperties) {
        String smsRegion = awsMessagingProperties.getSms().getRegion();
        if (smsRegion != null && !smsRegion.isBlank()) {
            return Region.of(smsRegion);
        }
        return resolveDefaultRegion(awsMessagingProperties);
    }

    private String normalizeProvider(String provider, String propertyName) {
        if (provider == null || provider.isBlank()) {
            throw new IllegalStateException(propertyName + " 설정이 비어 있습니다.");
        }
        return provider.trim().toLowerCase();
    }

    private <T> T requireBean(T bean, String condition) {
        if (bean == null) {
            throw new IllegalStateException(condition + " 설정에 필요한 AWS 클라이언트가 생성되지 않았습니다.");
        }
        return bean;
    }
}
