package com.popups.pupoo.auth.infrastructure.sms;

import com.popups.pupoo.auth.port.SmsOtpSenderPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 기능: 개발 환경용 SMS OTP 발송 어댑터를 제공한다.
 * 설명: 실제 SNS 호출 대신 수신 번호와 메시지를 로그로 출력해 OTP 흐름을 유지한다.
 * 흐름: 서비스가 포트를 호출하면 provider 정보와 함께 OTP 메시지를 콘솔 로그에 기록한다.
 */
public class DevSmsOtpSender implements SmsOtpSenderPort {

    private static final Logger log = LoggerFactory.getLogger(DevSmsOtpSender.class);

    private final String provider;

    public DevSmsOtpSender(String provider) {
        this.provider = provider;
    }

    @Override
    public void sendOtp(String phone, String message) {
        // 기능: OTP SMS 메시지를 개발 로그로 노출한다.
        // 설명: 외부 SMS 발송 없이도 인증 코드와 대상 번호를 확인할 수 있게 한다.
        // 흐름: provider를 기록하고 대상 번호와 메시지를 info 로그로 출력한다.
        log.info("[AUTH_SMS_PROVIDER={}] sms otp phone={}, message=<masked>", provider, maskPhone(phone));
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return "<empty>";
        }
        if (phone.length() <= 4) {
            return "***";
        }
        return phone.substring(0, Math.min(3, phone.length())) + "****" + phone.substring(phone.length() - 2);
    }
}
