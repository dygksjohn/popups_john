package com.popups.pupoo.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility class for retrieving details about the currently authenticated user.
 *
 * In addition to the existing {@code currentUserId()} method, this class now exposes a
 * {@code currentUserIdOrNull()} method. The original implementation in the feature
 * branch threw an exception whenever no user was authenticated, which prevented
 * endpoints such as vote result queries from being accessed anonymously. The
 * new method returns {@code null} when no user is authenticated or when the
 * authentication is not valid. This mirrors the behaviour on the develop branch
 * and allows controllers to gracefully handle unauthenticated requests.
 */
public final class SecurityUtil {

    private SecurityUtil() {
        throw new IllegalStateException("Utility class");
    }

    /**
     * Returns the identifier of the currently authenticated user. If no user
     * is authenticated, this method throws an {@link IllegalStateException}.
     *
     * @return the user identifier
     */
    public static Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("No authenticated principal");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            // In a real implementation this should be adapted to your UserDetails
            // structure; here we assume the username stores the numeric id.
            String username = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
            return Long.parseLong(username);
        }
        // Fallback: try to parse principal directly
        return Long.parseLong(principal.toString());
    }

    /**
     * Returns the identifier of the currently authenticated user or {@code null}
     * if no user is authenticated. This method mirrors the behaviour from the
     * develop branch where unauthenticated accesses should simply return null
     * rather than throwing. Controllers can call this to obtain an optional
     * user identifier when actions may or may not be authenticated.
     *
     * @return the user identifier, or {@code null} when no authentication exists
     */
    public static Long currentUserIdOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null || !authentication.isAuthenticated()) {
            return null;
        }
        try {
            return currentUserId();
        } catch (Exception e) {
            return null;
        }
    }
}