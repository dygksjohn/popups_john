package com.popups.pupoo.payment.infrastructure;

public record KakaoPayCancelResponse(
        String aid,
        String tid,
        String cid,
        String status,
        String canceled_at
) {}
