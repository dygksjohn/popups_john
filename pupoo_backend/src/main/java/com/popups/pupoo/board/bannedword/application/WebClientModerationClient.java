package com.popups.pupoo.board.bannedword.application;

import com.popups.pupoo.board.bannedword.config.ModerationProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class WebClientModerationClient implements ModerationClient {

    private final WebClient aiModerationWebClient;
    private final ModerationProperties properties;

    public WebClientModerationClient(
            @Qualifier("aiModerationWebClient") WebClient aiModerationWebClient,
            ModerationProperties properties
    ) {
        this.aiModerationWebClient = aiModerationWebClient;
        this.properties = properties;
    }

    @Override
    public ModerationResult moderate(String text, Long boardId, String contentType) {
        String preview = text == null ? "null" : text.length() <= 30 ? text : text.substring(0, 30) + "...";
        int textLen = text == null ? 0 : text.length();

        if (!properties.isEnabled()) {
            log.warn("AI moderation is disabled by config (baseUrl={})", properties.getBaseUrl());
            return blocked("AI 모더레이션이 비활성화되어 요청을 차단했어요.", "disabled");
        }

        try {
            Map<String, Object> metadata = new HashMap<>();
            if (boardId != null) {
                metadata.put("boardId", boardId);
            }
            if (contentType != null) {
                metadata.put("boardType", contentType);
            }

            Map<String, Object> body = new HashMap<>();
            body.put("content", text != null ? text : "");
            body.put("text", text != null ? text : "");
            body.put("board_type", contentType);
            body.put("content_type", contentType);
            body.put("board_id", boardId);
            body.put("metadata", metadata);

            log.info("AI moderation request: boardId={}, contentType={}, baseUrl={}, textLen={}, preview='{}'",
                    boardId, contentType, properties.getBaseUrl(), textLen, preview);

            Map<?, ?> response = aiModerationWebClient
                    .post()
                    .uri("/internal/moderate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofMillis(Math.max(1000, properties.getReadTimeoutMs()) + 500L));

            if (response == null) {
                return blocked("AI 서버 응답이 없어 요청을 차단했어요.", "error");
            }

            String result = asString(response.get("result"));
            String action = asString(response.get("action"));
            String normalized = "PASS".equalsIgnoreCase(result) ? "PASS"
                    : "PASS".equalsIgnoreCase(action) ? "PASS" : "BLOCK";
            String reason = asString(response.get("reason"));
            String stack = asString(response.get("stack"));
            Float score = asFloat(response.get("score"));
            if (score == null) {
                score = asFloat(response.get("ai_score"));
            }

            return ModerationResult.builder()
                    .action(normalized)
                    .aiScore(score)
                    .reason(reason)
                    .stack(stack != null ? stack : "unknown")
                    .build();
        } catch (WebClientResponseException e) {
            log.warn("AI moderation API error: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            log.warn("AI moderation API error context: boardId={}, contentType={}, baseUrl={}, textLen={}, preview='{}'",
                    boardId, contentType, properties.getBaseUrl(), textLen, preview);
            return blocked("AI 서버 오류로 요청을 차단했어요.", "error");
        } catch (Exception e) {
            String errMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            log.warn("AI moderation call failed: {} (baseUrl={})", errMsg, properties.getBaseUrl(), e);
            log.warn("AI moderation call failed context: boardId={}, contentType={}, baseUrl={}, textLen={}, preview='{}'",
                    boardId, contentType, properties.getBaseUrl(), textLen, preview);
            return blocked("AI 서버 연결 실패로 요청을 차단했어요.", "error");
        }
    }

    private ModerationResult blocked(String reason, String stack) {
        return ModerationResult.builder()
                .action("BLOCK")
                .reason(reason)
                .stack(stack)
                .build();
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Float asFloat(Object value) {
        if (value instanceof Number number) {
            return number.floatValue();
        }
        try {
            return value == null ? null : Float.parseFloat(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
