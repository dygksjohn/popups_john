package com.popups.pupoo.common.chatbot.api;

import com.popups.pupoo.common.config.AiModerationProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Map;

/**
 * 프론트엔드 챗봇 요청을 pupoo_ai FastAPI 서버로 프록시.
 *
 * 프론트엔드 → POST /internal/chatbot/chat → (이 컨트롤러) → pupoo_ai:8000
 */
@Slf4j
@RestController
@RequestMapping("/internal/chatbot")
public class ChatbotProxyController {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    private final WebClient webClient;

    public ChatbotProxyController(WebClient.Builder builder, AiModerationProperties props) {
        this.webClient = builder
                .baseUrl(props.getBaseUrl())
                .build();
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = webClient.post()
                    .uri("/internal/chatbot/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(TIMEOUT);

            return ResponseEntity.ok(result);
        } catch (WebClientResponseException e) {
            log.warn("[chatbot-proxy] AI server error: status={}", e.getStatusCode());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of(
                            "success", false,
                            "code", "AI_SERVER_ERROR",
                            "data", Map.of("reply", "AI 서버에서 오류가 발생했습니다.")
                    ));
        } catch (Exception e) {
            log.warn("[chatbot-proxy] AI server unreachable: {}", e.getMessage());
            return ResponseEntity.status(503)
                    .body(Map.of(
                            "success", false,
                            "code", "AI_SERVER_UNAVAILABLE",
                            "data", Map.of("reply", "AI 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.")
                    ));
        }
    }
}
