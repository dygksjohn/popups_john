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
        String preview = text == null ? "null" : text.length() <= 30 ? text : text.substring(0, 30) + "...";
        int textLen = text == null ? 0 : text.length();

        if (text == null || text.trim().isEmpty()) {
            log.warn("AI moderation request: text is blank (boardId={}, contentType={}, baseUrl={})", boardId, contentType, properties.getBaseUrl());
        } else {
            log.info("AI moderation request: boardId={}, contentType={}, baseUrl={}, textLen={}, preview='{}'",
                    boardId, contentType, properties.getBaseUrl(), textLen, preview);
        }

        if (!properties.isEnabled()) {
            // 필터링 기능이 비활성화된 경우에도, 정책상 검사가 완료되지 않은 것으로 보고 BLOCK 처리한다.
            log.warn("AI moderation is disabled by config (baseUrl={})", properties.getBaseUrl());
            return ModerationResult.builder()
                    .action("BLOCK")
                    .reason("AI 모더레이션이 비활성화되어 요청을 차단했습니다.")
                    .stack("disabled")
                    .build();
        }
        try {
            Map<String, Object> body = new HashMap<>(Map.of("text", text != null ? text : ""));
            if (boardId != null) body.put("board_id", boardId);
            if (contentType != null) body.put("content_type", contentType);

            log.info("AI moderation POST /internal/moderate payload: board_id={}, content_type={}, textLen={}",
                    boardId, contentType, textLen);
            Map<?, ?> response = aiModerationWebClient
                    .post()
                    .uri("/internal/moderate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(properties.getTimeoutSeconds()));

            if (response == null) {
                // 응답을 받지 못한 경우에도 검사가 완료되지 않은 것으로 간주하고 BLOCK 처리
                return ModerationResult.builder()
                        .action("BLOCK")
                        .reason("AI 서버 응답 없음으로 인해 요청을 차단했습니다.")
                        .stack("error")
                        .build();
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
            log.warn("AI moderation API error context: boardId={}, contentType={}, baseUrl={}, textLen={}, preview='{}'",
                    boardId, contentType, properties.getBaseUrl(), textLen, preview);
            // HTTP 오류 역시 필터링 미완료로 간주하여 BLOCK 처리
            return ModerationResult.builder()
                    .action("BLOCK")
                    .reason("AI 서버 오류(" + e.getStatusCode() + ")로 인해 요청을 차단했습니다.")
                    .stack("error")
                    .build();
        } catch (Exception e) {
            String errMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            log.warn("AI moderation call failed: {} (baseUrl={})", errMsg, properties.getBaseUrl(), e);
            log.warn("AI moderation call failed context: boardId={}, contentType={}, baseUrl={}, textLen={}, preview='{}'",
                    boardId, contentType, properties.getBaseUrl(), textLen, preview);
            // 네트워크 등 기타 예외 발생 시에도 BLOCK 처리
            return ModerationResult.builder()
                    .action("BLOCK")
                    .reason("AI 서버 연결 실패로 인해 요청을 차단했습니다.")
                    .stack("error")
                    .build();
        }
    }
}
