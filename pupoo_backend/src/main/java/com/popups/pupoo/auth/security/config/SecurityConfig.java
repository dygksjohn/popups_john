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

    /**
     *  CORS 설정
     * - React dev server: http://localhost:5173 허용
     * - RefreshToken을 쿠키로 쓸 수 있으므로 allowCredentials=true
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // allowCredentials=true면 "*" 불가 → origin 명시 필요
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
            //  CORS Preflight 허용(프론트 연동 시 403 방지)
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // 인증/회원가입(인증 기능은 예외적으로 공개)
            .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/auth/refresh").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/auth/signup/**").permitAll()

            // 운영/문서
            .requestMatchers(HttpMethod.GET, "/api/ping").permitAll()
            .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
            .requestMatchers("/swagger-ui/**").permitAll()
            .requestMatchers("/v3/api-docs/**").permitAll()
            .requestMatchers("/error").permitAll()

            // PUBLIC(비인증) 허용 범위: 조회(GET)만 (목록/상세로 제한)
            .requestMatchers(HttpMethod.GET, "/api/posts").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/posts/*").permitAll()

            .requestMatchers(HttpMethod.GET, "/api/notices").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/notices/*").permitAll()

            .requestMatchers(HttpMethod.GET, "/api/faqs").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/faqs/*").permitAll()

            .requestMatchers(HttpMethod.GET, "/api/events").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/events/*").permitAll()

            .requestMatchers(HttpMethod.GET, "/api/programs").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/programs/*").permitAll()

            .requestMatchers(HttpMethod.GET, "/api/speakers").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/speakers/*").permitAll()

            .requestMatchers(HttpMethod.GET, "/api/booths").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/booths/*").permitAll()

            // ADMIN 전용
            .requestMatchers("/api/admin/**").hasRole("ADMIN")

            // USER 전용
            .requestMatchers(HttpMethod.POST, "/api/event-registrations")
                .hasRole("USER")
            .requestMatchers(HttpMethod.DELETE, "/api/event-registrations/**")
                .hasRole("USER")
            .requestMatchers(HttpMethod.GET, "/api/users/me/event-registrations")
                .hasRole("USER")

            .anyRequest().authenticated()
        );

        http.addFilterBefore(
            new JwtAuthenticationFilter(jwtProvider, objectMapper),
            UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }
}
