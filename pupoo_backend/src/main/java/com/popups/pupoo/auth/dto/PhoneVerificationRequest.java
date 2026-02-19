// src/main/java/com/popups/pupoo/auth/dto/PhoneVerificationRequest.java
package com.popups.pupoo.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class PhoneVerificationRequest {

    @NotBlank
    private String phone;

    public String getPhone() { return phone; }
}
