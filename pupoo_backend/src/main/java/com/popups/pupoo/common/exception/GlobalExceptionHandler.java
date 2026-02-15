// src/main/java/com/popups/pupoo/common/exception/GlobalExceptionHandler.java
package com.popups.pupoo.common.exception;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
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

        ErrorResponse body = new ErrorResponse(ErrorCode.VALIDATION_FAILED.getCode(), msg,
                ErrorCode.VALIDATION_FAILED.getStatus().value(), request.getRequestURI());
        return ResponseEntity.status(ErrorCode.VALIDATION_FAILED.getStatus()).body(ApiResponse.fail(body));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArg(IllegalArgumentException e, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(ErrorCode.INVALID_REQUEST.getCode(), e.getMessage(),
                ErrorCode.INVALID_REQUEST.getStatus().value(), request.getRequestURI());
        return ResponseEntity.status(ErrorCode.INVALID_REQUEST.getStatus()).body(ApiResponse.fail(body));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnknown(Exception e, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(ErrorCode.INTERNAL_ERROR.getCode(), ErrorCode.INTERNAL_ERROR.getMessage(),
                ErrorCode.INTERNAL_ERROR.getStatus().value(), request.getRequestURI());
        return ResponseEntity.status(ErrorCode.INTERNAL_ERROR.getStatus()).body(ApiResponse.fail(body));
    }
}
