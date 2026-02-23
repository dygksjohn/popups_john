// file: src/main/java/com/popups/pupoo/payment/refund/dto/RefundResponse.java
package com.popups.pupoo.payment.refund.dto;

import com.popups.pupoo.payment.refund.domain.model.Refund;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RefundResponse(
        Long refundId,
        Long paymentId,
        BigDecimal refundAmount,
        String reason,
        String status,
        LocalDateTime requestedAt,
        LocalDateTime completedAt
) {
    public static RefundResponse from(Refund r) {
        // 정책: API 응답에서는 COMPLETED를 REFUNDED로 노출한다.
        String exposedStatus = (r.getStatus() != null && "COMPLETED".equals(r.getStatus().name()))
                ? "REFUNDED"
                : (r.getStatus() == null ? null : r.getStatus().name());

        return new RefundResponse(
                r.getRefundId(),
                r.getPaymentId(),
                r.getRefundAmount(),
                r.getReason(),
                exposedStatus,
                r.getRequestedAt(),
                r.getCompletedAt()
        );
    }
}
