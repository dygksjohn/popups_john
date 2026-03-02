// file: src/main/java/com/popups/pupoo/common/config/StaticResourceConfig.java
package com.popups.pupoo.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * 개발(local/dev)에서만 사용: /static/** 를 로컬 파일시스템(basePath)으로 매핑한다.
 *
 *  현재(Windows/로컬)
 * - storage.base-path=./uploads (프로젝트 내부)
 * - 브라우저: http://localhost:8080/static/post/10/uuid.png
 *
 *  운영(우분투 + Nginx) 전환 시
 * - 이 클래스는 prod 프로필에서 로딩되지 않도록 유지
 * - Nginx가 /static/** 를 서빙하도록 설정 (alias)
 */
@Configuration
@Profile({"default", "local", "dev"})
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${storage.base-path:./uploads}")
    private String basePath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = "file:" + Paths.get(basePath).toAbsolutePath() + "/";
        registry.addResourceHandler("/static/**")
                .addResourceLocations(location);

        /*
         * [운영 전환 시]
         * - prod 프로필에서는 이 설정이 적용되지 않게 유지한다.
         * - Nginx 예시:
         *   location /static/ { alias /var/app/uploads/; }
         */
    }
}
