// file: src/main/java/com/popups/pupoo/common/config/UploadResourceConfig.java
package com.popups.pupoo.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * /uploads/** 경로로 정적 파일 서빙.
 *
 * SecurityConfig에서 /uploads/** → permitAll 이므로 인증 없이 접근 가능.
 * StaticResourceConfig(/static/**)와 별개로 동작하며 프로필 제한 없음.
 */
@Configuration
public class UploadResourceConfig implements WebMvcConfigurer {

    @Value("${storage.base-path:./uploads}")
    private String basePath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = "file:" + Paths.get(basePath).toAbsolutePath() + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
