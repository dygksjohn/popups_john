package com.popups.pupoo.interest.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class InterestChannelUpdateRequest {

    @NotNull
    private Long interestId;

    @NotNull
    private Boolean allowInapp;

    @NotNull
    private Boolean allowEmail;

    @NotNull
    private Boolean allowSms;
}
