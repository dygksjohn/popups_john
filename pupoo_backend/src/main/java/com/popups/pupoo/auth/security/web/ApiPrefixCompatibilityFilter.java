package com.popups.pupoo.auth.security.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Locale;

public class ApiPrefixCompatibilityFilter extends OncePerRequestFilter {

    private static final String API_PREFIX = "/api";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!shouldRewrite(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String rewrittenUri = API_PREFIX + request.getRequestURI();
        HttpServletRequest wrapped = new ApiPrefixedRequestWrapper(request, rewrittenUri);
        filterChain.doFilter(wrapped, response);
    }

    private boolean shouldRewrite(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null || uri.isBlank() || "/".equals(uri)) {
            return false;
        }

        if (uri.startsWith(API_PREFIX)
                || uri.startsWith("/assets/")
                || uri.startsWith("/uploads/")
                || uri.startsWith("/static/")
                || uri.startsWith("/swagger-ui/")
                || uri.startsWith("/v3/api-docs/")
                || uri.startsWith("/actuator/")
                || uri.startsWith("/error")) {
            return false;
        }

        if (uri.contains(".")) {
            return false;
        }

        String method = request.getMethod();
        if (!HttpMethod.GET.matches(method) && !HttpMethod.HEAD.matches(method)) {
            return true;
        }

        String accept = String.valueOf(request.getHeader("Accept")).toLowerCase(Locale.ROOT);
        return accept.contains("application/json")
                || accept.contains("text/plain")
                || "xmlhttprequest".equalsIgnoreCase(request.getHeader("X-Requested-With"));
    }

    private static final class ApiPrefixedRequestWrapper extends HttpServletRequestWrapper {

        private final String requestUri;

        private ApiPrefixedRequestWrapper(HttpServletRequest request, String requestUri) {
            super(request);
            this.requestUri = requestUri;
        }

        @Override
        public String getRequestURI() {
            return requestUri;
        }

        @Override
        public StringBuffer getRequestURL() {
            HttpServletRequest request = (HttpServletRequest) getRequest();
            StringBuffer original = request.getRequestURL();
            int start = original.indexOf(request.getRequestURI());
            if (start < 0) {
                return new StringBuffer(original.toString());
            }
            return new StringBuffer(original.substring(0, start) + requestUri);
        }

        @Override
        public String getServletPath() {
            return requestUri;
        }
    }
}
