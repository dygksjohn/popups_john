package com.popups.pupoo.auth.application;

import com.popups.pupoo.auth.dto.KakaoExchangeResponse;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;



@Slf4j
@Service
public class KakaoOAuthService {
	
	

    private final WebClient webClient;

    @Value("${kakao.oauth.client-id}")
    private String clientId;

    @Value("${kakao.oauth.client-secret:}")
    private String clientSecret;

    @Value("${kakao.oauth.redirect-uri}")
    private String redirectUri;

    public KakaoOAuthService(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    public KakaoExchangeResponse exchange(String code) {
        if (code == null || code.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }

        // ✅ 설정값 검증 (초기 미스 방지)
        if (clientId == null || clientId.isBlank()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }
        if (redirectUri == null || redirectUri.isBlank()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }

        try {
            // 1) code -> token
            BodyInserters.FormInserter<String> form = BodyInserters
                    .fromFormData("grant_type", "authorization_code")
                    .with("client_id", clientId)
                    .with("redirect_uri", redirectUri)
                    .with("code", code);

            // ✅ client_secret은 "있을 때만" 전송 (빈값 전송 금지)
            if (clientSecret != null && !clientSecret.isBlank()) {
                form = form.with("client_secret", clientSecret);
            }

            Map<String, Object> token = webClient.post()
                    .uri("https://kauth.kakao.com/oauth/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            String accessToken = token == null ? null : (String) token.get("access_token");
            if (accessToken == null || accessToken.isBlank()) {
                throw new BusinessException(ErrorCode.INVALID_REQUEST);
            }

            // 2) token -> user/me
            Map<String, Object> me = webClient.get()
                    .uri("https://kapi.kakao.com/v2/user/me")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            if (me == null || me.get("id") == null) {
                throw new BusinessException(ErrorCode.INVALID_REQUEST);
            }

            String providerUid = String.valueOf(me.get("id"));

            String email = null;
            String nickname = null;

            Map<String, Object> kakaoAccount = (Map<String, Object>) me.get("kakao_account");
            if (kakaoAccount != null) {
                email = (String) kakaoAccount.get("email");
                Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                if (profile != null) {
                    nickname = (String) profile.get("nickname");
                }
            }

            return new KakaoExchangeResponse(providerUid, email, nickname);

        } catch (WebClientResponseException e) {
            // ✅ 카카오 응답 오류를 우리 도메인 오류로 변환
            log.warn("[KAKAO] token/user api failed: status={}, body={}",
                    e.getStatusCode(), safeBody(e.getResponseBodyAsString()));

            // 401/400 대부분은 client_id(REST키), redirect_uri 불일치, code 만료/재사용 등이 원인
            throw new BusinessException(ErrorCode.INVALID_REQUEST);

        } catch (BusinessException e) {
            throw e;

        } catch (Exception e) {
            log.error("[KAKAO] unexpected error", e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }
    }

    private String safeBody(String body) {
        if (body == null) return null;
        // 너무 길면 로그 폭주 방지
        return body.length() > 300 ? body.substring(0, 300) + "..." : body;
    }
}