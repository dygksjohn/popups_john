package com.popups.pupoo.common.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * AI 모더레이션 설정 바인딩 활성화.
 */
@Configuration
@EnableConfigurationProperties(AiModerationProperties.class)
public class AiModerationConfig {
}

