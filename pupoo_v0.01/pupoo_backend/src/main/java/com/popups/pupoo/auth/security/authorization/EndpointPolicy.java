package com.popups.pupoo.auth.security.authorization;

import org.springframework.web.bind.annotation.GetMapping;

public class EndpointPolicy {

    private EndpointPolicy() {}

    public static final String[] PUBLIC_ENDPOINTS = {
    	    "/api/auth/**",
    	    "/api/ping",
    	    "/actuator/health",
    	    "/swagger-ui/**",
    	    "/v3/api-docs/**"
    	};

    public static final String[] ADMIN_ENDPOINTS = {
            "/api/admin/**"
    };

	@GetMapping("/api/secure-ping")
	public String securePing() {
	    return "secure-pong";
	}
}