package com.popups.pupoo.auth.security.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtil {

    /**
     * 현재 인증된 사용자의 userId를 반환한다.
     * JwtAuthenticationFilter에서 principal=userId(Long)로 세팅하는 것을 표준으로 한다.
     */
    public Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("UNAUTHENTICATED");
        }

        Object principal = auth.getPrincipal();
        if (principal == null) {
            throw new IllegalStateException("UNAUTHENTICATED");
        }

        // ✅ 표준: JwtAuthenticationFilter에서 principal = Long userId
        if (principal instanceof Long userId) {
            return userId;
        }

        // (방어) 혹시 String/Integer로 들어오는 경우만 최소 허용
        if (principal instanceof Integer i) {
            return i.longValue();
        }
        if (principal instanceof String s) {
            if ("anonymousUser".equalsIgnoreCase(s)) {
                throw new IllegalStateException("UNAUTHENTICATED");
            }
            try {
                return Long.parseLong(s.trim());
            } catch (NumberFormatException e) {
                throw new IllegalStateException("INVALID_PRINCIPAL");
            }
        }

        // 그 외는 설계 위반(인증 구현이 바뀐 것)
        throw new IllegalStateException("INVALID_PRINCIPAL");
    }
}
