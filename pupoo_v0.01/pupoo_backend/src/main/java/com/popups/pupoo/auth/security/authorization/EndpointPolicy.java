package com.popups.pupoo.auth.security.authorization;

public class EndpointPolicy {

    private EndpointPolicy() {}

    /**
     * 인증 없이 접근 가능한 공개 엔드포인트
     */
    public static final String[] PUBLIC_ENDPOINTS = {
            "/api/auth/**",
            "/api/ping",
            "/actuator/health",
            "/swagger-ui/**",
            "/v3/api-docs/**",

            // 행사 목록/상세는 공개
            "/api/events",
            "/api/events/**"
    };

    /**
     * USER 권한 필요 엔드포인트
     */
    public static final String[] USER_ENDPOINTS = {
            "/api/event-registrations",
            "/api/event-registrations/**",
            "/api/users/me/**"
    };

    /**
     * ADMIN 전용
     */
    public static final String[] ADMIN_ENDPOINTS = {
            "/api/admin/**"
    };
}
