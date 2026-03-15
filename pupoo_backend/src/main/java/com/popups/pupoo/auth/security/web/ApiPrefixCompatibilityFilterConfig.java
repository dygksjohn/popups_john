package com.popups.pupoo.auth.security.web;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class ApiPrefixCompatibilityFilterConfig {

    @Bean
    public FilterRegistrationBean<ApiPrefixCompatibilityFilter> apiPrefixCompatibilityFilterRegistration() {
        FilterRegistrationBean<ApiPrefixCompatibilityFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new ApiPrefixCompatibilityFilter());
        registration.addUrlPatterns("/*");
        registration.setName("apiPrefixCompatibilityFilter");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
