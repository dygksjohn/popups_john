package com.popups.pupoo.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * AI 모더레이션 서버(pupoo_ai) 연동 설정.
 *
 * - baseUrl: FastAPI 서버 베이스 URL (예: http://localhost:8000)
 * - internalToken: X-Internal-Token 값
 * - enabled: false이면 백엔드에서 AI 서버를 호출하지 않음
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "ai.moderation")
public class AiModerationProperties {

    /**
     * AI 서버 베이스 URL (예: http://localhost:8000)
     */
    private String baseUrl;

    /**
     * 내부 연동용 토큰 (X-Internal-Token)
     */
    private String internalToken;

    /**
     * 플래그: false이면 호출 비활성화
     */
    private boolean enabled = true;
}

