// 파일 위치: src/main/java/com/popups/pupoo/auth/security/util/SecurityUtil.java
package com.popups.pupoo.auth.security.util;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
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
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        Object principal = auth.getPrincipal();
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        //  표준: JwtAuthenticationFilter에서 principal = Long userId
        if (principal instanceof Long userId) {
            return userId;
        }

        // (방어) 혹시 Integer로 들어오는 경우만 최소 허용
        if (principal instanceof Integer i) {
            return i.longValue();
        }

        // (방어) 혹시 String으로 들어오는 경우만 최소 허용
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

        // 그 외는 설계 위반(인증 구현이 바뀐 것)
        throw new BusinessException(ErrorCode.INVALID_REQUEST);
    }

    /**
     *  호환용 메서드
     * 기존 코드에서 getCurrentUserId()를 호출하는 경우를 위한 브릿지.
     */
    public Long getCurrentUserId() {
        return currentUserId();
    }
}
