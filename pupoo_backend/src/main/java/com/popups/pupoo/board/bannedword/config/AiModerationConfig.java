package com.popups.pupoo.board.bannedword.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
@EnableConfigurationProperties({ModerationProperties.class, OrchestrateProperties.class})
public class AiModerationConfig {

    @Bean(name = "aiModerationWebClient")
    public WebClient aiModerationWebClient(ModerationProperties properties) {
        // Reactor Netty 기본 응답 타임아웃이 짧으면 .block(120s) 전에 끊길 수 있어 정책 업로드(임베딩·Milvus)와 맞춘다.
        int sec = Math.max(30, properties.getTimeoutSeconds());
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(sec));
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .baseUrl(properties.getBaseUrl())
                .defaultHeader("X-Internal-Token", properties.getInternalToken())
                .build();
    }

    @Bean(name = "orchestrateWebClient")
    public WebClient orchestrateWebClient(OrchestrateProperties orchestrateProperties) {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(Math.max(5, orchestrateProperties.getTimeoutSeconds())));
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
