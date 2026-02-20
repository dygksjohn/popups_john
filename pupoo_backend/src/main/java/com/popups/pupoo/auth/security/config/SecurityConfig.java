// 파일 위치: src/main/java/com/popups/pupoo/auth/security/config/SecurityConfig.java
package com.popups.pupoo.auth.security.config;

import com.popups.pupoo.auth.security.authentication.filter.JwtAuthenticationFilter;
import com.popups.pupoo.auth.security.handler.JwtAccessDeniedHandler;
import com.popups.pupoo.auth.security.handler.JwtAuthenticationEntryPoint;
import com.popups.pupoo.auth.token.JwtProvider;
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

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtProvider jwtProvider;

    public SecurityConfig(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
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

            //  회원가입/인증
            .requestMatchers(HttpMethod.POST, "/api/users").permitAll()

            // auth 하위는 전부 공개(로그인/리프레시/로그아웃/인증 등)
            .requestMatchers("/api/auth/**").permitAll()

            // health check(원하면 permitAll로 바꿔도 됨)
            .requestMatchers(HttpMethod.GET, "/api/auth/secure-ping").authenticated()

            //  비회원 조회 허용
            .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/programs/**").permitAll()

            .requestMatchers("/error").permitAll()

            //  USER 가능
            // DB에 ROLE_ROLE_USER가 들어가 있다면 아래처럼 둘 다 허용해야 함
            .requestMatchers(HttpMethod.POST, "/api/event-registrations")
                .hasAnyAuthority("ROLE_USER", "ROLE_ROLE_USER")
            .requestMatchers(HttpMethod.DELETE, "/api/event-registrations/**")
                .hasAnyAuthority("ROLE_USER", "ROLE_ROLE_USER")
            .requestMatchers(HttpMethod.GET, "/api/users/me/event-registrations")
                .hasAnyAuthority("ROLE_USER", "ROLE_ROLE_USER")

            //  카카오페이 콜백은 인증 없이 허용
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
