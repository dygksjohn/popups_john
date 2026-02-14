// src/main/java/com/popups/pupoo/auth/security/handler/JwtAuthenticationEntryPoint.java
package com.popups.pupoo.auth.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.ErrorResponse;
import com.popups.pupoo.common.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import java.io.IOException;

public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        ErrorResponse err = new ErrorResponse(
                ErrorCode.UNAUTHORIZED.getCode(),
                ErrorCode.UNAUTHORIZED.getMessage(),
                ErrorCode.UNAUTHORIZED.getStatus().value(),
                request.getRequestURI()
        );

        response.setStatus(ErrorCode.UNAUTHORIZED.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getWriter(), ApiResponse.fail(err));
    }
}
