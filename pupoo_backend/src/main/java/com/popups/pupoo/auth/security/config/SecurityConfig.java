// src/main/java/com/popups/pupoo/auth/security/config/SecurityConfig.java
package com.popups.pupoo.auth.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import com.popups.pupoo.auth.security.authentication.filter.JwtAuthenticationFilter;
import com.popups.pupoo.auth.security.handler.JwtAccessDeniedHandler;
import com.popups.pupoo.auth.security.handler.JwtAuthenticationEntryPoint;
import com.popups.pupoo.auth.token.JwtProvider;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtProvider jwtProvider;

    public SecurityConfig(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    /**
     * ✅ CORS 설정
     * - React dev server: http://localhost:5173 허용
     * - 쿠키(RefreshToken) 쓸 가능성 있으므로 allowCredentials=true
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 프론트 origin 허용 (필수: allowCredentials=true면 "*" 불가)
        config.setAllowedOrigins(List.of("http://localhost:5173"));

        // 허용 메서드
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // 허용 헤더
        config.setAllowedHeaders(List.of("*"));

        // 프론트에서 읽어야 하는 헤더가 있으면 노출
        config.setExposedHeaders(List.of("Authorization", "Set-Cookie"));

        // 쿠키/인증정보 포함 요청 허용
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // ✅ CORS 활성화 (중요)
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
                .requestMatchers(HttpMethod.POST, "/api/users").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/refresh").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/secure-ping").authenticated()

                // 비회원 검색 허용
                .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/programs/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/error").permitAll()

                // USER 가능
                .requestMatchers(HttpMethod.POST, "/api/event-registrations")
                    .hasAnyAuthority("ROLE_USER", "ROLE_ROLE_USER")
                .requestMatchers(HttpMethod.DELETE, "/api/event-registrations/**")
                    .hasAnyAuthority("ROLE_USER", "ROLE_ROLE_USER")
                .requestMatchers(HttpMethod.GET, "/api/users/me/event-registrations")
                    .hasAnyAuthority("ROLE_USER", "ROLE_ROLE_USER")

                // 카카오페이 콜백은 인증 없이 허용
                .requestMatchers(HttpMethod.GET,  "/api/payments/*/approve").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/payments/*/cancel").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/payments/*/fail").permitAll()

                .anyRequest().authenticated()
        );

        http.addFilterBefore(
                new JwtAuthenticationFilter(jwtProvider),
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }
}
