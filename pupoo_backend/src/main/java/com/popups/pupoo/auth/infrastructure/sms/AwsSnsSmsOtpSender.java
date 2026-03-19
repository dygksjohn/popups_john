package com.popups.pupoo.auth.infrastructure.sms;

import com.popups.pupoo.auth.config.AwsMessagingProperties;
import com.popups.pupoo.auth.port.SmsOtpSenderPort;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.MessageAttributeValue;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.SnsException;

import java.util.HashMap;
import java.util.Map;

/**
 * 기능: AWS SNS를 사용해 인증 SMS OTP를 발송한다.
 * 설명: 인증 서비스가 만든 OTP 메시지를 SNS Publish 호출로 전송한다.
 * 흐름: 메시지 속성 구성 -> Publish 호출 -> 성공 로그 또는 예외 변환 순서로 처리한다.
 */
public class AwsSnsSmsOtpSender implements SmsOtpSenderPort {

    private static final Logger log = LoggerFactory.getLogger(AwsSnsSmsOtpSender.class);

    private final String provider;
    private final SnsClient snsClient;
    private final AwsMessagingProperties awsMessagingProperties;

    public AwsSnsSmsOtpSender(
            String provider,
            SnsClient snsClient,
            AwsMessagingProperties awsMessagingProperties
    ) {
        this.provider = provider;
        this.snsClient = snsClient;
        this.awsMessagingProperties = awsMessagingProperties;
    }

    @Override
    public void sendOtp(String phone, String message) {
        // 기능: OTP SMS 메시지를 SNS로 발송한다.
        // 설명: 도메인 서비스가 준비한 메시지를 수신 번호 기준으로 단건 publish 한다.
        // 흐름: 메시지 속성 생성 -> SNS publish 호출 -> 성공 로그 또는 예외 변환 순서로 진행한다.
        try {
            snsClient.publish(
                    PublishRequest.builder()
                            .phoneNumber(phone)
                            .message(message)
                            .messageAttributes(buildMessageAttributes())
                            .build()
            );

            log.info("[AUTH_SMS_PROVIDER={}] SNS sms sent. phone={}", provider, phone);
        } catch (SnsException | SdkClientException e) {
            log.error("[AUTH_SMS_PROVIDER={}] SNS sms failed. phone={}, reason={}", provider, phone, e.getMessage(), e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "인증 SMS 발송에 실패했습니다.");
        }
    }

    private Map<String, MessageAttributeValue> buildMessageAttributes() {
        Map<String, MessageAttributeValue> attributes = new HashMap<>();

        String originationNumber = awsMessagingProperties.getSms().getOriginationNumber();
        if (originationNumber != null && !originationNumber.isBlank()) {
            attributes.put(
                    "AWS.SNS.SMS.OriginationNumber",
                    MessageAttributeValue.builder()
                            .dataType("String")
                            .stringValue(originationNumber)
                            .build()
            );
        }

        String senderId = awsMessagingProperties.getSms().getSenderId();
        if (senderId != null && !senderId.isBlank()) {
            attributes.put(
                    "AWS.SNS.SMS.SenderID",
                    MessageAttributeValue.builder()
                            .dataType("String")
                            .stringValue(senderId)
                            .build()
            );
        }

        return attributes;
    }
}
