// 파일 위치: src/main/java/com/popups/pupoo/payment/dto/PaymentReadyRequest.java
package com.popups.pupoo.payment.dto;

/**
 * 결제 준비(ready) 요청 DTO
 * - PG 요청에 필요한 최소값만 보관
 */
public record PaymentReadyRequest(
        String itemName,
        int quantity,
        int taxFreeAmount
) {
}
