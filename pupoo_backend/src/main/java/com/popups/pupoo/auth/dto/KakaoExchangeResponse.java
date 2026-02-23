// KakaoExchangeResponse.java
package com.popups.pupoo.auth.dto;

public record KakaoExchangeResponse(
        String providerUid,
        String email,
        String nickname
) {}