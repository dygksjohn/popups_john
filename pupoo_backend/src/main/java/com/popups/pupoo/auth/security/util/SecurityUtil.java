package com.popups.pupoo.auth.security.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

@Component
public class SecurityUtil {

    /**
     * 현재 인증된 사용자의 userId를 최대한 안전하게 추출한다.
     * 지원 케이스:
     * 1) principal 이 Long/Integer/String(userId) 인 경우
     * 2) principal 에 getUserId() 또는 getId() 메소드가 있는 경우 (리플렉션)
     * 3) authentication.getName() 이 userId 문자열인 경우
     */
    public Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            throw new IllegalStateException("UNAUTHENTICATED");
        }

        Object principal = auth.getPrincipal();

        // 1) principal이 숫자 자체인 경우
        if (principal instanceof Long l) return l;
        if (principal instanceof Integer i) return i.longValue();

        // 2) principal이 문자열(userId)인 경우
        if (principal instanceof String s) {
            // Spring Security에서 익명 사용자는 "anonymousUser"로 들어오는 경우가 많음
            if ("anonymousUser".equalsIgnoreCase(s)) throw new IllegalStateException("UNAUTHENTICATED");
            return parseLongOrThrow(s);
        }

        // 3) principal 객체에 getUserId() / getId()가 있는 경우 (리플렉션)
        Long fromMethod = tryExtractIdByMethod(principal, "getUserId");
        if (fromMethod != null) return fromMethod;

        fromMethod = tryExtractIdByMethod(principal, "getId");
        if (fromMethod != null) return fromMethod;

        // 4) 최후: auth.getName()이 userId인 경우
        String name = auth.getName();
        if (name != null && !name.isBlank() && !"anonymousUser".equalsIgnoreCase(name)) {
            return parseLongOrThrow(name);
        }

        throw new IllegalStateException("CANNOT_RESOLVE_USER_ID");
    }

    private Long tryExtractIdByMethod(Object principal, String methodName) {
        try {
            Method m = principal.getClass().getMethod(methodName);
            Object val = m.invoke(principal);
            if (val == null) return null;
            if (val instanceof Long l) return l;
            if (val instanceof Integer i) return i.longValue();
            if (val instanceof String s) return parseLongOrThrow(s);
            return null;
        } catch (NoSuchMethodException e) {
            return null;
        } catch (Exception e) {
            throw new IllegalStateException("CANNOT_RESOLVE_USER_ID");
        }
    }

    private Long parseLongOrThrow(String s) {
        try {
            return Long.parseLong(s.trim());
        } catch (NumberFormatException e) {
            throw new IllegalStateException("CANNOT_RESOLVE_USER_ID");
        }
    }
}
