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

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
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
                .requestMatchers(HttpMethod.GET, "/api/programs/**").permitAll()   // ✅ 프로그램 상세 공개 (선택)
                .requestMatchers(HttpMethod.GET, "/api/speakers/**").permitAll()   // ✅ 연사 조회 공개
                .requestMatchers(HttpMethod.GET, "/api/programs/*/speakers/**").permitAll() // ✅ 프로그램속 연사 공개
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/error").permitAll()

                // USER 가능
                .requestMatchers(HttpMethod.POST, "/api/event-registrations")
                    .hasAnyAuthority("ROLE_USER", "ROLE_ROLE_USER")
                .requestMatchers(HttpMethod.DELETE, "/api/event-registrations/**")
                    .hasAnyAuthority("ROLE_USER", "ROLE_ROLE_USER")
                .requestMatchers(HttpMethod.GET, "/api/users/me/event-registrations")
                    .hasAnyAuthority("ROLE_USER", "ROLE_ROLE_USER")

                .anyRequest().authenticated()
        );

        http.addFilterBefore(
                new JwtAuthenticationFilter(jwtProvider),
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }
}
