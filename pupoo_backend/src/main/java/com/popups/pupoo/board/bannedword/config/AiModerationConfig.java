package com.popups.pupoo.board.bannedword.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@EnableConfigurationProperties(ModerationProperties.class)
public class AiModerationConfig {

    @Bean(name = "aiModerationWebClient")
    public WebClient aiModerationWebClient(ModerationProperties properties) {
        return WebClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader("X-Internal-Token", properties.getInternalToken())
                .build();
    }
}
