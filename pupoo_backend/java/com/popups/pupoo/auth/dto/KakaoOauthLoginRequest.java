package com.popups.pupoo.auth.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class KakaoOauthLoginRequest {
    private String code;
}