// file: src/main/java/com/popups/pupoo/payment/dto/PaymentResponse.java
package com.popups.pupoo.payment.dto;

import com.popups.pupoo.payment.domain.enums.PaymentProvider;
import com.popups.pupoo.payment.domain.enums.PaymentStatus;
import com.popups.pupoo.payment.domain.model.Payment;
import com.popups.pupoo.payment.persistence.PaymentRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long paymentId,
        String orderNo,
        BigDecimal amount,
        PaymentProvider paymentMethod,
        PaymentStatus status,
        LocalDateTime requestedAt,

        // ✅ 추가
        String eventTitle,
        LocalDateTime eventStartAt,
        LocalDateTime eventEndAt
) {
    public static PaymentResponse fromRow(PaymentRepository.PaymentHistoryRow r) {
        return new PaymentResponse(
                r.getPaymentId(),
                r.getOrderNo(),
                r.getAmount(),
                r.getPaymentMethod(),
                r.getStatus(),
                r.getRequestedAt(),
                r.getEventTitle(),
                r.getEventStartAt(),
                r.getEventEndAt()
        );
    }

    // fallback(조인 조회 실패 등 극단 케이스용)
    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(
                p.getPaymentId(),
                p.getOrderNo(),
                p.getAmount(),
                p.getPaymentMethod(),
                p.getStatus(),
                p.getRequestedAt(),
                null,
                null,
                null
        );
    }
}