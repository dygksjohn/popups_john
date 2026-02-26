// file: src/main/java/com/popups/pupoo/auth/security/util/SecurityUtil.java
package com.popups.pupoo.auth.security.util;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * SecurityContextHolder 기반 현재 사용자 식별 유틸.
 *
 * 프로젝트 표준
 * - JwtAuthenticationFilter에서 principal = userId(Long)로 세팅한다.
 */
@Component
public class SecurityUtil {

    public Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        Object principal = auth.getPrincipal();
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        if (principal instanceof Long userId) {
            return userId;
        }

        if (principal instanceof Integer i) {
            return i.longValue();
        }

        if (principal instanceof String s) {
            if ("anonymousUser".equalsIgnoreCase(s)) {
                throw new BusinessException(ErrorCode.UNAUTHORIZED);
            }
            try {
                return Long.parseLong(s.trim());
            } catch (NumberFormatException e) {
                throw new BusinessException(ErrorCode.INVALID_REQUEST);
            }
        }

        throw new BusinessException(ErrorCode.INVALID_REQUEST);
    }
    /**
     * 현재 인증된 사용자가 ADMIN 역할인지 여부.
     */
    public boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }    
}
