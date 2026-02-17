package com.popups.pupoo.common.exception;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException e, HttpServletRequest request) {
        ErrorCode ec = e.getErrorCode();
        ErrorResponse body = new ErrorResponse(ec.getCode(), e.getMessage(), ec.getStatus().value(), request.getRequestURI());
        return ResponseEntity.status(ec.getStatus()).body(ApiResponse.fail(body));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e, HttpServletRequest request) {
        String msg = "Validation failed";
        FieldError fe = e.getBindingResult().getFieldError();
        if (fe != null) msg = fe.getField() + ": " + fe.getDefaultMessage();

        ErrorResponse body = new ErrorResponse(
                ErrorCode.VALIDATION_FAILED.getCode(),
                msg,
                ErrorCode.VALIDATION_FAILED.getStatus().value(),
                request.getRequestURI()
        );
        return ResponseEntity.status(ErrorCode.VALIDATION_FAILED.getStatus()).body(ApiResponse.fail(body));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException e, HttpServletRequest request) {
        String key = (e.getMessage() == null) ? "" : e.getMessage();

        if ("UNAUTHENTICATED".equals(key) || "INVALID_PRINCIPAL".equals(key)) {
            return build(request, ErrorCode.INVALID_REQUEST, HttpStatus.UNAUTHORIZED, key);
        }
        if ("QR_EXPIRED".equals(key)) {
            return build(request, ErrorCode.INVALID_REQUEST, HttpStatus.GONE, key);
        }
        if ("ALREADY_CHECKED_IN".equals(key) ||
            "ALREADY_CHECKED_OUT".equals(key) ||
            "CHECKOUT_REQUIRES_CHECKIN".equals(key) ||
            "ALREADY_IN_SAME_STATE".equals(key)) {
            return build(request, ErrorCode.INVALID_REQUEST, HttpStatus.CONFLICT, key);
        }

        return build(request, ErrorCode.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR.getStatus(), ErrorCode.INTERNAL_ERROR.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArg(IllegalArgumentException e, HttpServletRequest request) {
        String key = (e.getMessage() == null) ? "" : e.getMessage();

        if ("QR_NOT_FOUND".equals(key) || "BOOTH_NOT_FOUND".equals(key) || "EVENT_NOT_FOUND".equals(key)) {
            return build(request, ErrorCode.INVALID_REQUEST, HttpStatus.NOT_FOUND, key);
        }

        return build(request, ErrorCode.INVALID_REQUEST, ErrorCode.INVALID_REQUEST.getStatus(), key);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnknown(Exception e, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                ErrorCode.INTERNAL_ERROR.getCode(),
                ErrorCode.INTERNAL_ERROR.getMessage(),
                ErrorCode.INTERNAL_ERROR.getStatus().value(),
                request.getRequestURI()
        );
        return ResponseEntity.status(ErrorCode.INTERNAL_ERROR.getStatus()).body(ApiResponse.fail(body));
    }

    private ResponseEntity<ApiResponse<Void>> build(HttpServletRequest request, ErrorCode ec, HttpStatus status, String msg) {
        ErrorResponse body = new ErrorResponse(ec.getCode(), msg, status.value(), request.getRequestURI());
        return ResponseEntity.status(status).body(ApiResponse.fail(body));
    }
}
