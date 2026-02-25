// file: src/main/java/com/popups/pupoo/auth/security/authentication/filter/JwtAuthenticationFilter.java
package com.popups.pupoo.auth.security.authentication.filter;

import com.popups.pupoo.auth.token.JwtProvider;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.ErrorResponse;
import com.popups.pupoo.common.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    /**
     * ObjectMapper는 반드시 Spring Boot가 관리하는 Bean(ObjectMapper)을 주입받아 사용한다.
     * - 이유: LocalDateTime 등 Java Time 직렬화 모듈(JSR-310)이 자동 등록된 ObjectMapper를 사용해야 한다.
     * - new ObjectMapper()를 쓰면 JavaTimeModule 누락으로 401 응답 직렬화 중 500이 발생할 수 있다.
     */
    private final ObjectMapper objectMapper;

    public JwtAuthenticationFilter(JwtProvider jwtProvider, ObjectMapper objectMapper) {
        this.jwtProvider = jwtProvider;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            String accessToken = resolveBearerToken(request);

            // Authorization 헤더가 없으면 "미인증"으로 다음 필터로 넘긴다.
            if (accessToken == null) {
                filterChain.doFilter(request, response);
                return;
            }

            // Authorization 헤더가 있는 경우는 strict 정책으로 검증 실패 시 즉시 401
            jwtProvider.validateAccessToken(accessToken);

            Long userId = jwtProvider.getUserId(accessToken);
            String roleName = jwtProvider.getRoleName(accessToken);

            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + roleName));
            var authentication = new UsernamePasswordAuthenticationToken(userId, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            filterChain.doFilter(request, response);
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            writeUnauthorized(response, request);
        }
    }

    /**
     * Bearer 토큰 추출
     * - Authorization 헤더 없으면 null (anonymous로 처리)
     * - 헤더가 있는데 형식이 틀리면 strict 401
     */
    private String resolveBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");

        // Authorization 헤더가 없으면 토큰이 없는 요청으로 처리
        if (header == null || header.isBlank()) {
            return null;
        }

        // Authorization 헤더가 존재하는데 Bearer 규칙이 아니면 strict 401 대상
        if (!header.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid Authorization header format");
        }

        String token = header.substring(7).trim();
        if (token.isEmpty()) {
            throw new IllegalArgumentException("Empty Bearer token");
        }

        return token;
    }

    private void writeUnauthorized(HttpServletResponse response, HttpServletRequest request) throws IOException {
        ErrorCode code = ErrorCode.JWT_INVALID;

        response.setStatus(code.getStatus().value());
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");

        ErrorResponse error = new ErrorResponse(
                code.getCode(),
                code.getMessage(),
                code.getStatus().value(),
                request.getRequestURI()
        );

        ApiResponse<Object> body = ApiResponse.fail(error);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    /**
     * ✅ JWT 필터를 아예 타지 않아야 하는 경로들
     * - /api/auth/** : 로그인/리프레시/로그아웃/회원가입/OAuth 등은 permitAll이며 쿠키 기반 처리도 포함
     * - OPTIONS : 프리플라이트
     * - swagger/actuator 등 운영 편의(선택)
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        // Preflight
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        // ✅ auth 전체 스킵 (logout 포함)
        if (path.startsWith("/api/auth/")) {
            return true;
        }

        // (선택) 문서/헬스체크 스킵
        if (path.startsWith("/swagger-ui/")
                || path.startsWith("/v3/api-docs/")
                || path.equals("/actuator/health")
                || path.equals("/api/ping")
                || path.equals("/error")) {
            return true;
        }

        return false;
    }
}