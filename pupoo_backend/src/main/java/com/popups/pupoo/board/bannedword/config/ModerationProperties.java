package com.popups.pupoo.board.bannedword.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ai.moderation")
public class ModerationProperties {

    private String baseUrl = "http://localhost:8000";
    private String internalToken = "dev-internal-token";
    private int timeoutSeconds = 300;
    private boolean enabled = true;
}
