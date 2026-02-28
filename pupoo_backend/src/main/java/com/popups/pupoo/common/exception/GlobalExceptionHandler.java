// file: src/main/java/com/popups/pupoo/common/exception/GlobalExceptionHandler.java
package com.popups.pupoo.common.exception;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.ErrorResponse;
import com.popups.pupoo.common.api.FieldErrorItem;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String UK_PAYMENTS_EVENT_USER_ACTIVE = "uk_payments_event_user_active";
    private static final String UK_REFUNDS_PAYMENT_ID = "uk_refunds_payment_id";
    private static final String UK_CONTEST_VOTES_ACTIVE = "uk_contest_votes_active";
    private static final String UK_PAYMENT_TX_PAYMENT_ID = "uk_payment_transactions_payment_id";
    private static final String UK_PAYMENT_TX_PROVIDER_TID = "uk_payment_transactions_provider_tid";
    private static final String UK_PAYMENTS_ORDER_NO = "uk_payments_order_no";

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException e, HttpServletRequest request) {
        ErrorCode ec = e.getErrorCode();
        String msg = e.getMessage();
        if (msg == null || msg.isBlank()) {
            msg = ec.getMessage();
        }
        ErrorResponse body = new ErrorResponse(ec.getCode(), msg, ec.getStatus().value(), request.getRequestURI());
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

        // fieldErrors 채우기(정책: 필드 에러 포함)
        body.setFieldErrors(
                e.getBindingResult().getFieldErrors().stream()
                        .map(err -> new FieldErrorItem(err.getField(), err.getDefaultMessage()))
                        .toList()
        );
        return ResponseEntity.status(ErrorCode.VALIDATION_FAILED.getStatus()).body(ApiResponse.fail(body));
    }

    //  결제 UNIQUE 멱등성 포함: DB 무결성 예외 처리
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException e, HttpServletRequest request) {
        String root = rootMessage(e);
        String lower = (root == null) ? "" : root.toLowerCase();

        // payments(event_id, user_id, active_flag) UNIQUE 충돌 → 활성 결제 중복
        if (lower.contains(UK_PAYMENTS_EVENT_USER_ACTIVE)) {
            ErrorCode ec = ErrorCode.PAYMENT_DUPLICATE_ACTIVE;
            return build(request, ec, ec.getStatus(), ec.getMessage());
        }

        // refunds(payment_id) UNIQUE 충돌 → 결제 1건당 환불 1건 정책 위반
        if (lower.contains(UK_REFUNDS_PAYMENT_ID)) {
            ErrorCode ec = ErrorCode.REFUND_ALREADY_EXISTS;
            return build(request, ec, ec.getStatus(), ec.getMessage());
        }

        // contest_votes(program_id, user_id, active_flag) UNIQUE 충돌 → 중복 투표
        if (lower.contains(UK_CONTEST_VOTES_ACTIVE)) {
            ErrorCode ec = ErrorCode.CONTEST_VOTE_ALREADY;
            return build(request, ec, ec.getStatus(), ec.getMessage());
        }

        // payment_transactions UNIQUE 충돌 → 결제 트랜잭션 중복(멱등성)
        if (lower.contains(UK_PAYMENT_TX_PAYMENT_ID) || lower.contains(UK_PAYMENT_TX_PROVIDER_TID)) {
            ErrorCode ec = ErrorCode.PAYMENT_TX_ALREADY_EXISTS;
            return build(request, ec, ec.getStatus(), ec.getMessage());
        }

        // payments(order_no) UNIQUE 충돌 → 주문번호 중복
        if (lower.contains(UK_PAYMENTS_ORDER_NO)) {
            ErrorCode ec = ErrorCode.DUPLICATE_RESOURCE;
            return build(request, ec, ec.getStatus(), "Duplicate order_no");
        }

        // 그 외 "Duplicate entry"는 공통 409로 정규화
        if (lower.contains("duplicate entry")) {
            ErrorCode ec = ErrorCode.DUPLICATE_RESOURCE;
            return build(request, ec, ec.getStatus(), "Duplicate entry");
        }

        // 그 외 DB 무결성(기본 400 처리)
        return build(request, ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "DATA_INTEGRITY_VIOLATION");
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException e, HttpServletRequest request) {
        String key = (e.getMessage() == null) ? "" : e.getMessage();

        if ("UNAUTHENTICATED".equals(key) || "INVALID_PRINCIPAL".equals(key)) {
            return build(request, ErrorCode.UNAUTHORIZED, ErrorCode.UNAUTHORIZED.getStatus(), key);
        }
        if ("QR_EXPIRED".equals(key)) {
            return build(request, ErrorCode.QR_EXPIRED, ErrorCode.QR_EXPIRED.getStatus(), key);
        }
        if ("ALREADY_CHECKED_IN".equals(key) ||
            "ALREADY_CHECKED_OUT".equals(key) ||
            "CHECKOUT_REQUIRES_CHECKIN".equals(key) ||
            "ALREADY_IN_SAME_STATE".equals(key)) {
            return build(request, ErrorCode.QR_CHECK_CONFLICT, ErrorCode.QR_CHECK_CONFLICT.getStatus(), key);
        }

        return build(request, ErrorCode.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR.getStatus(), ErrorCode.INTERNAL_ERROR.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArg(IllegalArgumentException e, HttpServletRequest request) {
        String key = (e.getMessage() == null) ? "" : e.getMessage();

        if ("QR_NOT_FOUND".equals(key)) {
            return build(request, ErrorCode.QR_NOT_FOUND, ErrorCode.QR_NOT_FOUND.getStatus(), key);
        }
        if ("BOOTH_NOT_FOUND".equals(key)) {
            return build(request, ErrorCode.BOOTH_NOT_FOUND, ErrorCode.BOOTH_NOT_FOUND.getStatus(), key);
        }
        if ("EVENT_NOT_FOUND".equals(key)) {
            return build(request, ErrorCode.RESOURCE_NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND.getStatus(), key);
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

    private String rootMessage(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null) cur = cur.getCause();
        return cur.getMessage();
    }
}
