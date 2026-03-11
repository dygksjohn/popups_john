package com.popups.pupoo.board.bannedword.application;

import com.popups.pupoo.common.config.AiModerationProperties;
import lombok.Builder;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

/**
 * FastAPI 기반 AI 모더레이션 서버(pupoo_ai) 호출 클라이언트.
 *
 * - POST {baseUrl}/internal/moderate
 * - Header: X-Internal-Token
 * - Body: { "text": "..." }
 *
 * 실패 시 예외를 던지지 않고 로그만 남기고 빈 Optional을 반환한다.
 */
@Slf4j
@Component
public class AiModerationClient {

    private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(2);

    private final WebClient webClient;
    private final AiModerationProperties props;

    @Value
    @Builder
    public static class Result {
        Float aiScore;
        String action;
        String model;
        String stack;
        String reason;
    }

    public AiModerationClient(WebClient.Builder builder, AiModerationProperties props) {
        this.props = props;
        this.webClient = builder
                .baseUrl(props.getBaseUrl())
                .build();
    }

    /**
     * 단일 텍스트에 대해 AI 모더레이션 실행.
     *
     * @param text 대상 텍스트
     * @return 호출 성공 시 Result, 실패/비활성화 시 Optional.empty()
     */
    public Optional<Result> moderate(String text) {
        if (!props.isEnabled()) {
            return Optional.empty();
        }
        if (text == null || text.isBlank()) {
            return Optional.empty();
        }

        try {
            Map<String, Object> res = webClient.post()
                    .uri("/internal/moderate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Internal-Token", props.getInternalToken())
                    .bodyValue(Map.of("text", text))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block(DEFAULT_TIMEOUT);

            if (res == null) {
                log.warn("[AI][moderate] empty response");
                return Optional.empty();
            }

            Float aiScore = null;
            Object aiScoreObj = res.get("ai_score");
            if (aiScoreObj instanceof Number num) {
                aiScore = num.floatValue();
            }

            String action = (String) res.get("action");
            String model = (String) res.get("model");
            String stack = (String) res.get("stack");
            String reason = (String) res.get("reason");

            return Optional.of(Result.builder()
                    .aiScore(aiScore)
                    .action(action)
                    .model(model)
                    .stack(stack)
                    .reason(reason)
                    .build());

        } catch (WebClientResponseException e) {
            log.warn("[AI][moderate] http error: status={}, body={}", e.getStatusCode(), safeBody(e.getResponseBodyAsString()));
            return Optional.empty();
        } catch (Exception e) {
            log.warn("[AI][moderate] unexpected error", e);
            return Optional.empty();
        }
    }

    private String safeBody(String body) {
        if (body == null) return null;
        return body.length() > 300 ? body.substring(0, 300) + "..." : body;
    }
}

