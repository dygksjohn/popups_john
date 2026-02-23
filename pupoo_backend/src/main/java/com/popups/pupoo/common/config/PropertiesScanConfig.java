
// file: src/main/java/com/popups/pupoo/common/config/PropertiesScanConfig.java
package com.popups.pupoo.common.config;

import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Configuration;

/**
 * @ConfigurationProperties 클래스들을 스캔 등록한다.
 */
@Configuration
@ConfigurationPropertiesScan(basePackages = "com.popups.pupoo")
public class PropertiesScanConfig {
}
