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
    	
    	// ✅ 배포/반영 확인용 (한 번만 확인 후 제거)
        log.warn("[KAKAO][DEPLOY] KakaoOAuthService.exchange invoked");

        // ✅ 설정값 디버깅 (민감정보 최소 노출)    	
    	log.warn("[KAKAO][DEBUG] props check: clientIdPrefix={}, redirectUri={}, secretLen={}, secretHead={}",
                mask(clientId, 6),
                redirectUri,
                clientSecret == null ? 0 : clientSecret.length(),
                clientSecret == null ? "null" : mask(clientSecret, 4)
        );
    	
        if (code == null || code.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }

        if (clientId == null || clientId.isBlank()) {
            log.warn("[KAKAO] clientId is blank");
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }
        if (redirectUri == null || redirectUri.isBlank()) {
            log.warn("[KAKAO] redirectUri is blank");
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }     
        
        final String secret = (clientSecret == null) ? "" : clientSecret.trim();
        log.warn("[KAKAO][DEBUG] token req: clientIdPrefix={}, redirectUri={}, hasSecret={}, secretLenTrim={}",
                mask(clientId, 6),
                redirectUri,
                !secret.isBlank(),
                secret.length()
        );
        

        try {
            // 1) code -> token
            BodyInserters.FormInserter<String> form = BodyInserters
                    .fromFormData("grant_type", "authorization_code")
                    .with("client_id", clientId)
                    .with("redirect_uri", redirectUri)
                    .with("code", code);

            // ✅ client_secret은 "있을 때만" 전송
            if (!secret.isBlank()) {
                form = form.with("client_secret", secret);
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
                log.warn("[KAKAO] token api returned empty access_token. token={}", safeBody(String.valueOf(token)));
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
                log.warn("[KAKAO] me api returned null or missing id. me={}", safeBody(String.valueOf(me)));
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
            // ✅ token/me 호출 실패를 "상태코드 + 바디"로 기록
            log.warn("[KAKAO] api failed: status={}, body={}",
                    e.getStatusCode(), safeBody(e.getResponseBodyAsString()));
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
        return body.length() > 500 ? body.substring(0, 500) + "..." : body;
    }

    private String mask(String s, int head) {
        if (s == null) return null;
        int n = Math.min(head, s.length());
        return s.substring(0, n) + "***";
    }
}