// file: src/main/java/com/popups/pupoo/payment/dto/PaymentCreateRequest.java
package com.popups.pupoo.payment.dto;

import java.math.BigDecimal;

import com.popups.pupoo.payment.domain.enums.PaymentProvider;

public record PaymentCreateRequest(
        BigDecimal amount,
        PaymentProvider paymentMethod
) {}
