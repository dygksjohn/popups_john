package com.popups.pupoo.auth.application;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.popups.pupoo.auth.dto.KakaoExchangeResponse;
import com.popups.pupoo.auth.dto.KakaoOauthLoginResponse;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.persistence.UserRepository;
import com.popups.pupoo.user.social.domain.enums.SocialProvider;
import com.popups.pupoo.user.social.domain.model.SocialAccount;
import com.popups.pupoo.user.social.persistence.SocialAccountRepository;

import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;


@Slf4j
@Service
public class KakaoOAuthService {

    private final WebClient webClient;
    private final SocialAccountRepository socialAccountRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    @Value("${kakao.oauth.client-id}")
    private String clientId;

    @Value("${kakao.oauth.client-secret:}")
    private String clientSecret;

    @Value("${kakao.oauth.redirect-uri}")
    private String redirectUri;
    
    private String mask(String s, int prefix) {
        if (s == null) return null;
        if (s.length() <= prefix) return s;
        return s.substring(0, prefix) + "****";
    }

    public KakaoOAuthService(
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


    /**
     * ✅ 카카오 로그인 (기존/신규 분기 + 기존이면 토큰 발급)
     *
     * 분기 정책
     * 1) (KAKAO, providerUid)로 social_account 존재 → 해당 user 로그인
     * 2) 없으면, kakao email이 있고 users.email에 존재 → 자동 연동(social_account insert) 후 로그인
     * 3) 그 외 → 신규(newUser=true) 반환
     *
     * 상태 정책
     * - INACTIVE/SUSPENDED는 로그인/자동연동 모두 차단 (AuthService 정책과 동일)
     */
    @Transactional
    public KakaoOauthLoginResponse login(String code, HttpServletResponse response) {

        KakaoExchangeResponse profile = exchange(code);

        String providerUid = profile.getProviderUid();
        String email = profile.getEmail();
        String nickname = profile.getNickname();

        // 1) 이미 소셜 연동된 회원인가?
        Optional<SocialAccount> socialOpt =
                socialAccountRepository.findByProviderAndProviderUid(SocialProvider.KAKAO, providerUid);

        if (socialOpt.isPresent()) {
            User user = userRepository.findById(socialOpt.get().getUserId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

            // ✅ 상태 차단 강화 (연동이 이미 있어도 로그인 금지)
            authService.validateUserStatusForAuthPublic(user);

            var loginResponse = authService.loginByUser(user, response);

            return KakaoOauthLoginResponse.builder()
                    .newUser(false)
                    .accessToken(loginResponse.getAccessToken())
                    .userId(loginResponse.getUserId())
                    .roleName(loginResponse.getRoleName())
                    .build();
        }

        // 2) 소셜 연동은 없지만, email이 있고 기존 이메일 가입자가 있으면 자동 연동
        if (email != null && !email.isBlank()) {
            Optional<User> userOpt = userRepository.findByEmail(email);

            if (userOpt.isPresent()) {
                User user = userOpt.get();

                // ✅ 상태 차단 강화: 정지/비활성은 "연동 생성" 자체도 막는다
                authService.validateUserStatusForAuthPublic(user);

                // (user_id, provider) 이미 있으면 insert 안하고 그냥 로그인
                if (!socialAccountRepository.existsByUserIdAndProvider(user.getUserId(), SocialProvider.KAKAO)) {

                    // (provider, provider_uid) 중복도 방어 (동시성 대비)
                    if (socialAccountRepository.findByProviderAndProviderUid(SocialProvider.KAKAO, providerUid).isPresent()) {
                        // 누군가 이미 이 카카오 계정을 다른 user에 붙였다는 의미
                        throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
                    }

                    try {
                        socialAccountRepository.save(new SocialAccount(
                                user.getUserId(),
                                SocialProvider.KAKAO,
                                providerUid
                        ));
                    } catch (DataIntegrityViolationException e) {
                        // 유니크 충돌(동시성)일 수 있으니 재조회 후 처리
                        socialAccountRepository.findByProviderAndProviderUid(SocialProvider.KAKAO, providerUid)
                                .orElseThrow(() -> new BusinessException(ErrorCode.DUPLICATE_RESOURCE));
                    }
                }

                var loginResponse = authService.loginByUser(user, response);

                return KakaoOauthLoginResponse.builder()
                        .newUser(false)
                        .accessToken(loginResponse.getAccessToken())
                        .userId(loginResponse.getUserId())
                        .roleName(loginResponse.getRoleName())
                        .build();
            }
        }

        // 3) 신규 회원
        return KakaoOauthLoginResponse.builder()
                .newUser(true)
                .email(email)
                .nickname(nickname)
                .socialProvider("KAKAO")
                .socialProviderUid(providerUid)
                .build();
    }

    /**
     * code → token → user/me
     */
    public KakaoExchangeResponse exchange(String code) {


        if (code == null || code.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }



        // ✅ 설정값 누락 방어(실수 방지)
        if (clientId == null || clientId.isBlank() || redirectUri == null || redirectUri.isBlank()) {

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
            var form = BodyInserters
                    .fromFormData("grant_type", "authorization_code")
                    .with("client_id", clientId)
                    .with("redirect_uri", redirectUri)
                    .with("code", code);


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
                log.warn("[KAKAO] token api returned empty access_token. token={}", safeBody(String.valueOf(token)));
                throw new BusinessException(ErrorCode.INVALID_REQUEST);
            }

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

            @SuppressWarnings("unchecked")
            Map<String, Object> kakaoAccount = (Map<String, Object>) me.get("kakao_account");
            if (kakaoAccount != null) {
                email = (String) kakaoAccount.get("email");

                @SuppressWarnings("unchecked")
                Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                if (profile != null) {
                    nickname = (String) profile.get("nickname");
                }
            }

            return new KakaoExchangeResponse(providerUid, email, nickname);

        } catch (WebClientResponseException e) {

            log.warn("[KAKAO] api failed: status={}, body={}", e.getStatusCode(), safeBody(e.getResponseBodyAsString()));

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

        return body.length() > 300 ? body.substring(0, 300) + "..." : body;

    }
}