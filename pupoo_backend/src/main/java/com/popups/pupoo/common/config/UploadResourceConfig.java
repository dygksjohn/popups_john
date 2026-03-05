// file: src/main/java/com/popups/pupoo/common/config/UploadResourceConfig.java
package com.popups.pupoo.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
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
        Path resolvedBasePath = resolveBasePath(basePath);
        String location = "file:" + resolvedBasePath + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }

    private static Path resolveBasePath(String configuredPath) {
        Path raw = Paths.get(configuredPath);
        if (raw.isAbsolute()) {
            return raw.normalize();
        }

        Path userDir = Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();
        Path fromUserDir = userDir.resolve(raw).normalize();
        if (Files.exists(fromUserDir)) {
            return fromUserDir;
        }

        Path fromBackendModule = userDir.resolve("pupoo_backend").resolve(raw).normalize();
        if (Files.exists(fromBackendModule)) {
            return fromBackendModule;
        }

        return fromUserDir;
    }
}
