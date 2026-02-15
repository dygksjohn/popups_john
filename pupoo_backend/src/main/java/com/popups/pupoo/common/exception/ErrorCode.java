// src/main/java/com/popups/pupoo/common/exception/ErrorCode.java
package com.popups.pupoo.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    // 400
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "C400", "Invalid request"),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "C401", "Validation failed"),

    // 401/403
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "C4010", "Unauthorized"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "C4030", "Forbidden"),

    // Auth
    USER_NOT_FOUND(HttpStatus.UNAUTHORIZED, "A4011", "User not found"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "A4012", "Invalid credentials"),
    REFRESH_TOKEN_MISSING(HttpStatus.UNAUTHORIZED, "A4013", "Refresh token missing"),
    REFRESH_TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "A4014", "Refresh token invalid"),
    JWT_INVALID(HttpStatus.UNAUTHORIZED, "A4015", "JWT invalid"),

    // 409
    DUPLICATE_RESOURCE(HttpStatus.CONFLICT, "C4090", "Duplicate resource"),

    // 500
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C5000", "Internal server error");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }
    public String getMessage() { return message; }
}
