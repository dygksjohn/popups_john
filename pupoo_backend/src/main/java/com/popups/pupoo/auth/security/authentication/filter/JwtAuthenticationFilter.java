// 파일 위치: src/main/java/com/popups/pupoo/auth/security/authentication/JwtAuthenticationFilter.java
package com.popups.pupoo.auth.security.authentication.filter;

import com.popups.pupoo.auth.token.JwtProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    public JwtAuthenticationFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String accessToken = resolveBearerToken(request);

        if (accessToken != null) {
            try {
                jwtProvider.validateAccessToken(accessToken);

                Long userId = jwtProvider.getUserId(accessToken);
                String roleName = jwtProvider.getRoleName(accessToken);
                
                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + roleName));
                var authentication = new UsernamePasswordAuthenticationToken(userId, null, authorities);              
                         
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                e.printStackTrace();
                SecurityContextHolder.clearContext();
                // [추가]JWT 파싱 실패, 토큰만료, 인증객체 생성 중오류 => 인증되지 않은 상태로 요청이 흘러감
               
            }

        }

        filterChain.doFilter(request, response);
    }

    private String resolveBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null) return null;
        if (!header.startsWith("Bearer ")) return null;
        return header.substring(7).trim();
    }
}
