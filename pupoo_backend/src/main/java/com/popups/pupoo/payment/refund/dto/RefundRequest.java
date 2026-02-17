package com.popups.pupoo.payment.refund.dto;

import java.math.BigDecimal;

public record RefundRequest(
        Long paymentId,
        BigDecimal refundAmount,
        String reason
) {}
