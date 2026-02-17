package com.popups.pupoo.payment.refund.dto;

import com.popups.pupoo.payment.refund.domain.enums.RefundStatus;
import com.popups.pupoo.payment.refund.domain.model.Refund;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RefundResponse(
        Long refundId,
        Long paymentId,
        BigDecimal refundAmount,
        String reason,
        RefundStatus status,
        LocalDateTime requestedAt,
        LocalDateTime completedAt
) {
    public static RefundResponse from(Refund r) {
        return new RefundResponse(
                r.getRefundId(),
                r.getPaymentId(),
                r.getRefundAmount(),
                r.getReason(),
                r.getStatus(),
                r.getRequestedAt(),
                r.getCompletedAt()
        );
    }
}
