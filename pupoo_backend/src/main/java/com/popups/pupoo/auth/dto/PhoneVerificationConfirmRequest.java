// src/main/java/com/popups/pupoo/auth/dto/PhoneVerificationConfirmRequest.java
package com.popups.pupoo.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class PhoneVerificationConfirmRequest {

    @NotBlank
    private String phone;

    @NotBlank
    private String code;

    public String getPhone() { return phone; }
    public String getCode() { return code; }
}
