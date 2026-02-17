package com.popups.pupoo.payment.dto;

import com.popups.pupoo.payment.domain.enums.PaymentProvider;
import java.math.BigDecimal;

public record PaymentCreateRequest(
        BigDecimal amount,
        PaymentProvider paymentMethod
) {}
