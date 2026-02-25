// file: src/main/java/com/popups/pupoo/payment/dto/PaymentResponse.java
package com.popups.pupoo.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.popups.pupoo.payment.domain.enums.PaymentProvider;
import com.popups.pupoo.payment.domain.enums.PaymentStatus;
import com.popups.pupoo.payment.domain.model.Payment;

public record PaymentResponse(
        Long paymentId,
        Long userId,
        Long eventId,
        String orderNo,
        BigDecimal amount,
        PaymentProvider paymentMethod,
        PaymentStatus status,
        LocalDateTime requestedAt
) {
    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(
                p.getPaymentId(),
                p.getUserId(),
                p.getEventId(),
                p.getOrderNo(),
                p.getAmount(),
                p.getPaymentMethod(),
                p.getStatus(),
                p.getRequestedAt()
        );
    }
}
