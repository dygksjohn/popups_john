// src/main/java/com/popups/pupoo/common/exception/ErrorCode.java
package com.popups.pupoo.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    // =========================
    // Common - 400
    // =========================
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "C4000", "Invalid request"),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "C4001", "Validation failed"),

    // =========================
    // Common - 401/403
    // =========================
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "C4010", "Unauthorized"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "C4030", "Forbidden"),

    // =========================
    // Common - 404
    // =========================
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "C4040", "Resource not found"),

    // =========================
    // Booth - 404
    // =========================
    BOOTH_NOT_FOUND(HttpStatus.NOT_FOUND, "B4041", "Booth not found"),

    // =========================
    // QR - 404/409/410
    // =========================
    QR_NOT_FOUND(HttpStatus.NOT_FOUND, "Q4041", "QR not found"),
    QR_CHECK_CONFLICT(HttpStatus.CONFLICT, "Q4091", "QR check state conflict"),
    QR_EXPIRED(HttpStatus.GONE, "Q4100", "QR expired"),

    // =========================
    // Auth - 401
    // =========================
    USER_NOT_FOUND(HttpStatus.UNAUTHORIZED, "A4011", "User not found"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "A4012", "Invalid credentials"),
    REFRESH_TOKEN_MISSING(HttpStatus.UNAUTHORIZED, "A4013", "Refresh token missing"),
    REFRESH_TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "A4014", "Refresh token invalid"),
    JWT_INVALID(HttpStatus.UNAUTHORIZED, "A4015", "JWT invalid"),

    // =========================
    // Auth - verification (email/phone)
    // =========================
    EMAIL_VERIFICATION_TOKEN_INVALID(HttpStatus.BAD_REQUEST, "A4001", "Email verification token invalid"),
    EMAIL_ALREADY_VERIFIED(HttpStatus.CONFLICT, "A4091", "Email already verified"),
    EMAIL_VERIFICATION_TOKEN_EXPIRED(HttpStatus.GONE, "A4101", "Email verification token expired"),

    PHONE_OTP_INVALID(HttpStatus.BAD_REQUEST, "A4002", "Phone OTP invalid"),
    PHONE_ALREADY_VERIFIED(HttpStatus.CONFLICT, "A4092", "Phone already verified"),
    PHONE_OTP_EXPIRED(HttpStatus.GONE, "A4102", "Phone OTP expired"),
    PHONE_OTP_TOO_MANY_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS, "A4291", "Phone OTP too many attempts"),
    VERIFICATION_TOO_MANY_REQUESTS(HttpStatus.TOO_MANY_REQUESTS, "A4290", "Verification too many requests"),

    // =========================
    // User - 409/404 (내 정보, 중복)
    // =========================
    USER_PROFILE_NOT_FOUND(HttpStatus.NOT_FOUND, "U4041", "User profile not found"),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "U4091", "Email already exists"),
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "U4092", "Nickname already exists"),
    DUPLICATE_PHONE(HttpStatus.CONFLICT, "U4093", "Phone already exists"),

    // =========================
    // Pet - 404/403
    // =========================
    PET_NOT_FOUND(HttpStatus.NOT_FOUND, "T4041", "Pet not found"),
    PET_ACCESS_DENIED(HttpStatus.FORBIDDEN, "T4031", "No permission for this pet"),

    // =========================
    // Interest - 404/409
    // =========================
    INTEREST_NOT_FOUND(HttpStatus.NOT_FOUND, "I4041", "Interest not found"),
    SUBSCRIPTION_NOT_FOUND(HttpStatus.NOT_FOUND, "I4042", "Subscription not found"),
    SUBSCRIPTION_DUPLICATE(HttpStatus.CONFLICT, "I4091", "Subscription already exists"),

    // =========================
    // Payment - 409
    // =========================
    PAYMENT_DUPLICATE_ACTIVE(HttpStatus.CONFLICT, "P4091", "Payment already in progress"),

    // =========================
    // Common - 409
    // =========================
    DUPLICATE_RESOURCE(HttpStatus.CONFLICT, "C4090", "Duplicate resource"),

    // =========================
    // Common - 500
    // =========================
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
