package com.popups.pupoo.board.bannedword.application;

import com.popups.pupoo.board.bannedword.config.ModerationProperties;
import com.popups.pupoo.board.bannedword.dto.ActivePolicyResponse;
import com.popups.pupoo.board.bannedword.dto.PolicyUploadActivateResponse;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModerationPolicyAdminService {

    private final @Qualifier("aiModerationWebClient") WebClient aiModerationWebClient;
    private final ModerationProperties properties;

    @Transactional(readOnly = true)
    public ActivePolicyResponse getActivePolicy() {
        try {
            Map<?, ?> response = aiModerationWebClient
                    .get()
                    .uri("/internal/policies/active")
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(properties.getTimeoutSeconds()));

            if (response == null) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI 서버 응답 없음");
            }
            return new ActivePolicyResponse(
                    (String) response.get("active_collection"),
                    (String) response.get("active_filename"),
                    (String) response.get("activated_at")
            );
        } catch (WebClientResponseException e) {
            log.warn("AI policies active API error: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI 서버 오류로 정책 정보를 조회할 수 없습니다.");
        } catch (Exception e) {
            log.warn("AI policies active call failed", e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI 서버 연결 실패로 정책 정보를 조회할 수 없습니다.");
        }
    }

    @Transactional
    public PolicyUploadActivateResponse uploadAndActivate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "업로드할 정책 파일이 비어있습니다.");
        }

        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(file.getBytes()) {
                        @Override
                        public String getFilename() {
                            return file.getOriginalFilename();
                        }
                    })
                    .header("Content-Type", MediaType.APPLICATION_OCTET_STREAM_VALUE);

            Map<?, ?> response = aiModerationWebClient
                    .post()
                    .uri("/internal/policies/upload-and-activate")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.MULTIPART_FORM_DATA_VALUE)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(properties.getTimeoutSeconds()));

            if (response == null) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI 서버 응답 없음");
            }

            return new PolicyUploadActivateResponse(
                    (String) response.get("status"),
                    (String) response.get("active_collection"),
                    (String) response.get("active_filename"),
                    response.get("chunk_count") instanceof Number ? ((Number) response.get("chunk_count")).intValue() : null,
                    response.get("embedding_dim") instanceof Number ? ((Number) response.get("embedding_dim")).intValue() : null
            );
        } catch (WebClientResponseException e) {
            log.warn("AI policy upload/activate API error: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI 서버 오류로 정책 반영에 실패했습니다.");
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("AI policy upload/activate call failed", e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI 서버 연결 실패로 정책 반영에 실패했습니다.");
        }
    }
}

