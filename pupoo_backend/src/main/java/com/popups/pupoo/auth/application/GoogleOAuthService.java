package com.popups.pupoo.auth.application;

import com.popups.pupoo.auth.dto.GoogleOauthLoginResponse;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.persistence.UserRepository;
import com.popups.pupoo.user.social.domain.enums.SocialProvider;
import com.popups.pupoo.user.social.domain.model.SocialAccount;
import com.popups.pupoo.user.social.persistence.SocialAccountRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class GoogleOAuthService {

    private final WebClient webClient;
    private final SocialAccountRepository socialAccountRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    @Value("${google.oauth.client-id}")
    private String clientId;

    @Value("${google.oauth.client-secret}")
    private String clientSecret;

    @Value("${google.oauth.redirect-uri}")
    private String defaultRedirectUri;

    public GoogleOAuthService(
            WebClient.Builder builder,
            SocialAccountRepository socialAccountRepository,
            UserRepository userRepository,
            AuthService authService
    ) {
        this.webClient = builder.build();
        this.socialAccountRepository = socialAccountRepository;
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @Transactional
    public GoogleOauthLoginResponse login(String code, String redirectUri, HttpServletResponse response) {
        String resolvedRedirectUri = (redirectUri == null || redirectUri.isBlank()) ? defaultRedirectUri : redirectUri.trim();

        // 1) 인가 코드 → 액세스 토큰 교환
        String accessToken = exchangeCodeForToken(code, resolvedRedirectUri);

        // 2) 액세스 토큰 → 사용자 프로필 조회
        Map<String, Object> userInfo = fetchUserInfo(accessToken);

        String providerUid = (String) userInfo.get("sub");
        String email = (String) userInfo.get("email");
        String nickname = (String) userInfo.get("name");

        if (providerUid == null || providerUid.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        // 3) 기존 소셜 계정 확인
        Optional<SocialAccount> socialOpt =
                socialAccountRepository.findByProviderAndProviderUid(SocialProvider.GOOGLE, providerUid);

        if (socialOpt.isPresent()) {
            SocialAccount socialAccount = socialOpt.get();
            Optional<User> linkedUser = userRepository.findById(socialAccount.getUserId());

            if (linkedUser.isEmpty()) {
                log.warn("[GOOGLE] orphan social link. providerUid={}, userId={}", providerUid, socialAccount.getUserId());
                socialAccountRepository.delete(socialAccount);
            } else {
                return toExistingUserLogin(linkedUser.get(), response);
            }
        }

        // 4) 이메일로 기존 회원 연결
        if (email != null && !email.isBlank()) {
            Optional<User> userOpt = userRepository.findByEmail(email);

            if (userOpt.isPresent()) {
                User user = userOpt.get();

                if (!socialAccountRepository.existsByUserIdAndProvider(user.getUserId(), SocialProvider.GOOGLE)) {
                    try {
                        socialAccountRepository.save(new SocialAccount(user.getUserId(), SocialProvider.GOOGLE, providerUid));
                    } catch (DataIntegrityViolationException e) {
                        socialAccountRepository.findByProviderAndProviderUid(SocialProvider.GOOGLE, providerUid)
                                .orElseThrow(() -> new BusinessException(ErrorCode.DUPLICATE_RESOURCE));
                    }
                }

                return toExistingUserLogin(user, response);
            }
        }

        // 5) 신규 회원
        return GoogleOauthLoginResponse.builder()
                .newUser(true)
                .email(email)
                .nickname(nickname)
                .socialProvider("GOOGLE")
                .socialProviderUid(providerUid)
                .build();
    }

    private String exchangeCodeForToken(String code, String redirectUri) {
        if (code == null || code.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }

        try {
            Map<String, Object> tokenResponse = webClient.post()
                    .uri("https://oauth2.googleapis.com/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(BodyInserters.fromFormData("grant_type", "authorization_code")
                            .with("client_id", clientId)
                            .with("client_secret", clientSecret)
                            .with("redirect_uri", redirectUri)
                            .with("code", code))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            String accessToken = tokenResponse == null ? null : (String) tokenResponse.get("access_token");
            if (accessToken == null || accessToken.isBlank()) {
                log.warn("[GOOGLE] token exchange returned empty access_token. response={}", tokenResponse);
                throw new BusinessException(ErrorCode.INVALID_REQUEST);
            }
            return accessToken;
        } catch (WebClientResponseException e) {
            log.warn("[GOOGLE] token exchange failed: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[GOOGLE] unexpected error during token exchange", e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }
    }

    private Map<String, Object> fetchUserInfo(String accessToken) {
        try {
            Map<String, Object> userInfo = webClient.get()
                    .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            if (userInfo == null || userInfo.get("sub") == null) {
                log.warn("[GOOGLE] userinfo returned null or missing sub. userInfo={}", userInfo);
                throw new BusinessException(ErrorCode.INVALID_REQUEST);
            }
            return userInfo;
        } catch (WebClientResponseException e) {
            log.warn("[GOOGLE] userinfo failed: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[GOOGLE] unexpected error during userinfo fetch", e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }
    }

    private GoogleOauthLoginResponse toExistingUserLogin(User user, HttpServletResponse response) {
        authService.validateUserStatusForAuthPublic(user);
        var loginResponse = authService.loginByUser(user, response);

        return GoogleOauthLoginResponse.builder()
                .newUser(false)
                .accessToken(loginResponse.getAccessToken())
                .userId(loginResponse.getUserId())
                .roleName(loginResponse.getRoleName())
                .build();
    }
}
