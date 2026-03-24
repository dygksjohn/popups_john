package com.popups.pupoo.common.chatbot.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.popups.pupoo.ai.config.AiServiceProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chatbot")
public class ChatbotProxyController {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String HEADER_INTERNAL_TOKEN = "X-Internal-Token";

    private final WebClient webClient;
    private final AiServiceProperties properties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatbotProxyController(WebClient.Builder builder, AiServiceProperties props) {
        this.properties = props;
        this.webClient = builder
                .baseUrl(props.getBaseUrl())
                .build();
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        try {
            WebClient.RequestBodySpec request = webClient.post()
                    .uri("/internal/chatbot/chat")
                    .contentType(MediaType.APPLICATION_JSON);

            if (StringUtils.hasText(properties.getInternalToken())) {
                request.header(HEADER_INTERNAL_TOKEN, properties.getInternalToken());
            }

            if (StringUtils.hasText(authorization)) {
                request.header(HttpHeaders.AUTHORIZATION, authorization);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> result = request
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(TIMEOUT);

            return ResponseEntity.ok(result);
        } catch (WebClientResponseException e) {
            log.warn("[chatbot-proxy] AI server error: status={}", e.getStatusCode());
            return ResponseEntity.status(e.getStatusCode())
                    .body(parseErrorBody(e));
        } catch (Exception e) {
            log.warn("[chatbot-proxy] AI server unreachable: {}", e.getMessage());
            return ResponseEntity.status(503)
                    .body(errorBody(
                            "AI_SERVER_UNAVAILABLE",
                            "AI 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."
                    ));
        }
    }

    private Map<String, Object> parseErrorBody(WebClientResponseException e) {
        try {
            Map<String, Object> parsed = objectMapper.readValue(
                    e.getResponseBodyAsByteArray(),
                    new TypeReference<>() {}
            );
            if (parsed != null && !parsed.isEmpty()) {
                String message = extractMessage(parsed);
                if (StringUtils.hasText(message)) {
                    String code = stringValue(parsed.get("code"));
                    String messageType = extractMessageType(parsed);
                    return errorBody(
                            StringUtils.hasText(code) ? code : "AI_SERVER_ERROR",
                            message,
                            messageType,
                            extractActions(parsed)
                    );
                }
            }
        } catch (Exception ignored) {
        }

        return errorBody(
                "AI_SERVER_ERROR",
                "AI 서버에서 오류가 발생했습니다."
        );
    }

    private Map<String, Object> errorBody(String code, String message) {
        return errorBody(code, message, "error", List.of());
    }

    private Map<String, Object> errorBody(String code, String message, String messageType, List<?> actions) {
        return Map.of(
                "success", false,
                "code", code,
                "message", message,
                "data", Map.of(
                        "message", message,
                        "messageType", StringUtils.hasText(messageType) ? messageType : "error",
                        "actions", actions == null ? List.of() : actions
                )
        );
    }

    private List<?> extractActions(Map<String, Object> parsed) {
        Object data = parsed.get("data");
        if (data instanceof Map<?, ?> dataMap) {
            Object actions = dataMap.get("actions");
            if (actions instanceof List<?> actionList) {
                return actionList;
            }
        }
        return List.of();
    }

    private String extractMessage(Map<String, Object> parsed) {
        Object data = parsed.get("data");
        if (data instanceof Map<?, ?> dataMap) {
            String dataMessage = stringValue(dataMap.get("message"));
            if (StringUtils.hasText(dataMessage)) {
                return dataMessage;
            }
        }

        Object error = parsed.get("error");
        if (error instanceof Map<?, ?> errorMap) {
            String errorMessage = stringValue(errorMap.get("message"));
            if (StringUtils.hasText(errorMessage)) {
                return errorMessage;
            }
        }

        String topLevelMessage = stringValue(parsed.get("message"));
        if (StringUtils.hasText(topLevelMessage)) {
            return topLevelMessage;
        }
        return null;
    }

    private String extractMessageType(Map<String, Object> parsed) {
        Object data = parsed.get("data");
        if (data instanceof Map<?, ?> dataMap) {
            String dataMessageType = stringValue(dataMap.get("messageType"));
            if (StringUtils.hasText(dataMessageType)) {
                return dataMessageType;
            }
        }
        return null;
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value);
        return text.isBlank() ? null : text;
    }
}
