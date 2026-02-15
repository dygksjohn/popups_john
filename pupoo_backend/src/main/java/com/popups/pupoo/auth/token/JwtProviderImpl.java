// src/main/java/com/popups/pupoo/auth/token/JwtProviderImpl.java
package com.popups.pupoo.auth.token;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtProviderImpl implements JwtProvider {

    private final SecretKey secretKey;
    private final String issuer;

    public JwtProviderImpl(
            @Value("${auth.jwt.secret}") String secret,
            @Value("${auth.jwt.issuer:pupoo}") String issuer
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
    }

    /**
     * ACCESS TOKEN
     * - subject: user_id
     * - claim: role
     */
    @Override
    public String createAccessToken(Long userId, String roleName, long ttlSeconds) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .setIssuer(issuer)
                .setSubject(String.valueOf(userId))  // 내부 식별자
                .claim("role", roleName)            // ✅ role은 access에만
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + ttlSeconds * 1000))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * REFRESH TOKEN
     * - subject: user_id
     * - role claim 없음
     */
    @Override
    public String createRefreshToken(Long userId, long ttlSeconds) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .setIssuer(issuer)
                .setSubject(String.valueOf(userId))
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + ttlSeconds * 1000))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    @Override
    public void validateAccessToken(String token) {
        parseClaims(token);
    }

    @Override
    public void validateRefreshToken(String token) {
        parseClaims(token);
    }

    @Override
    public Long getUserId(String token) {
        Claims claims = parseClaims(token);
        return Long.valueOf(claims.getSubject());
    }

    /**
     * role은 access 토큰에서만 호출해야 함
     */
    @Override
    public String getRoleName(String token) {
        Claims claims = parseClaims(token);
        Object role = claims.get("role");
        if (role == null) {
            throw new IllegalArgumentException("Role claim not found (likely refresh token)");
        }
        return String.valueOf(role);
    }

    private Claims parseClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .requireIssuer(issuer)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException e) {
            throw new IllegalArgumentException("JWT invalid", e);
        }
    }
}
