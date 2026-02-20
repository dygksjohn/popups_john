// 파일 위치: src/main/java/com/popups/pupoo/common/config/PaymentPropertiesConfig.java
package com.popups.pupoo.common.config;

import com.popups.pupoo.payment.infrastructure.KakaoPayProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * KakaoPayProperties를 Spring Bean으로 등록한다.
 * - @ConfigurationProperties(prefix = "kakaopay") 활성화용
 */
@Configuration
@EnableConfigurationProperties(KakaoPayProperties.class)
public class PaymentPropertiesConfig {
}
