package com.popups.pupoo.board.bannedword.application;

import com.popups.pupoo.board.bannedword.config.ModerationProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Map;

@Slf4j
@Component
public class WebClientModerationClient implements ModerationClient {

    private final WebClient aiModerationWebClient;
    private final ModerationProperties properties;

    public WebClientModerationClient(
            @Qualifier("aiModerationWebClient") WebClient aiModerationWebClient,
            ModerationProperties properties) {
        this.aiModerationWebClient = aiModerationWebClient;
        this.properties = properties;
    }

    @Override
    public ModerationResult moderate(String text, Long boardId, String contentType) {
        if (!properties.isEnabled()) {
            return ModerationResult.builder().action("PASS").stack("disabled").build();
        }
        try {
            Map<String, Object> body = new HashMap<>(Map.of("text", text != null ? text : ""));
            if (boardId != null) body.put("board_id", boardId);
            if (contentType != null) body.put("content_type", contentType);

            Map<?, ?> response = aiModerationWebClient
                    .post()
                    .uri("/internal/moderate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(properties.getTimeoutSeconds()));

            if (response == null) {
                return ModerationResult.builder().action("PASS").reason("AI 서버 응답 없음").stack("error").build();
            }
            String action = (String) response.get("action");
            Object score = response.get("ai_score");
            String reason = (String) response.get("reason");
            String stack = (String) response.get("stack");
            return ModerationResult.builder()
                    .action(action != null ? action : "PASS")
                    .aiScore(score instanceof Number ? ((Number) score).floatValue() : null)
                    .reason(reason)
                    .stack(stack != null ? stack : "unknown")
                    .build();
        } catch (WebClientResponseException e) {
            log.warn("AI moderation API error: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ModerationResult.builder().action("PASS").reason("AI 서버 오류: " + e.getStatusCode()).stack("error").build();
        } catch (Exception e) {
            log.warn("AI moderation call failed", e);
            return ModerationResult.builder().action("PASS").reason("AI 서버 연결 실패").stack("error").build();
        }
    }
}
