
// file: src/main/java/com/popups/pupoo/payment/kakaopay/config/KakaoPayProperties.java
package com.popups.pupoo.payment.kakaopay.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * application.properties의 kakaopay.* 설정 바인딩.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "kakaopay")
public class KakaoPayProperties {

    private String baseUrl;
    private String secretKey;
    private String authorizationPrefix;
    private String cid;

    private String readyPath;
    private String approvePath;
    private String cancelPath;

    private String approvalUrl;
    private String cancelUrl;
    private String failUrl;
}
