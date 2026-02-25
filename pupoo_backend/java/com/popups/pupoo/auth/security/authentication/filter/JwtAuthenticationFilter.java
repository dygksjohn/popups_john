// file: src/main/java/com/popups/pupoo/auth/security/authentication/filter/JwtAuthenticationFilter.java
package com.popups.pupoo.auth.security.authentication.filter;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.popups.pupoo.auth.token.JwtProvider;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.ErrorResponse;
import com.popups.pupoo.common.exception.ErrorCode;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

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

            // strict 401: Authorization 헤더가 존재하거나, 토큰 검증 중 예외 발생 시 즉시 401 반환
            writeUnauthorized(response, request);
        }
    }

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
}
