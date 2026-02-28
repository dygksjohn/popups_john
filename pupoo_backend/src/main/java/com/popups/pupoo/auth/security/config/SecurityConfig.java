// file: src/main/java/com/popups/pupoo/auth/security/config/SecurityConfig.java
package com.popups.pupoo.auth.security.config;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.popups.pupoo.auth.security.authentication.filter.JwtAuthenticationFilter;
import com.popups.pupoo.auth.security.handler.JwtAccessDeniedHandler;
import com.popups.pupoo.auth.security.handler.JwtAuthenticationEntryPoint;
import com.popups.pupoo.auth.token.JwtProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtProvider jwtProvider;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtProvider jwtProvider, ObjectMapper objectMapper) {
        this.jwtProvider = jwtProvider;
        this.objectMapper = objectMapper;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Set-Cookie"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable());

        http.exceptionHandling(ex -> ex
            .authenticationEntryPoint(new JwtAuthenticationEntryPoint())
            .accessDeniedHandler(new JwtAccessDeniedHandler())
        );

        http.authorizeHttpRequests(auth -> auth
            // CORS Preflight
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // Auth endpoints
            .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/auth/refresh").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/auth/signup/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/auth/oauth/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/auth/oauth/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/auth/email/verification/confirm").permitAll()

            // Ops/docs
            .requestMatchers(HttpMethod.GET, "/api/ping").permitAll()
            .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
            .requestMatchers("/swagger-ui/**").permitAll()
            .requestMatchers("/v3/api-docs/**").permitAll()
            .requestMatchers("/error").permitAll()

            // Public GET
            .requestMatchers(HttpMethod.GET, "/api/posts").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/posts/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/notices").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/notices/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/faqs").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/faqs/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/events").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/events/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/events/*/galleries").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/events/*/programs").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/events/*/booths").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/programs").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/programs/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/programs/*/speakers").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/programs/*/speakers/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/programs/*/votes/result").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/speakers").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/speakers/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/booths").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/booths/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/qnas").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/qnas/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/galleries").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/galleries/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/reviews").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/reviews/*").permitAll()
            // 갤러리 이미지 업로드 — 로그인(USER) 필요
            .requestMatchers(HttpMethod.POST, "/api/galleries/image/upload").hasRole("USER")
            // 갤러리 생성/수정/삭제 — 로그인(USER) 필요, 내부에서 작성자/관리자 검증
            .requestMatchers(HttpMethod.POST, "/api/galleries").hasRole("USER")
            .requestMatchers(HttpMethod.PATCH, "/api/galleries/*").hasRole("USER")
            .requestMatchers(HttpMethod.DELETE, "/api/galleries/*").hasRole("USER")

            .requestMatchers(HttpMethod.GET, "/api/replies").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/report-reasons").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/files/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/files/*/download").permitAll()
            .requestMatchers("/uploads/**").permitAll()
            .requestMatchers("/static/**").permitAll()

            // ADMIN
            .requestMatchers("/api/admin/**").hasRole("ADMIN")

            // USER
            .requestMatchers("/api/users/me/**").hasRole("USER")
            .requestMatchers("/api/payments/**").hasRole("USER")
            .requestMatchers("/api/refunds/**").hasRole("USER")
            .requestMatchers("/api/notifications/**").hasRole("USER")
            .requestMatchers(HttpMethod.POST, "/api/event-registrations").hasRole("USER")
            .requestMatchers(HttpMethod.DELETE, "/api/event-registrations/**").hasRole("USER")
            .requestMatchers(HttpMethod.GET, "/api/users/me/event-registrations").hasRole("USER")

            .anyRequest().hasAnyRole("USER", "ADMIN")
        );

        http.addFilterBefore(
            new JwtAuthenticationFilter(jwtProvider, objectMapper),
            UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }
}
