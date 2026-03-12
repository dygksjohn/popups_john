package com.popups.pupoo.storage.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    private String mode = "local";
    private String basePath = "./uploads";
    private String publicPrefix = "/uploads";
    private String publicBaseUrl = "";
    private String cdnBaseUrl = "";
    private String keyPrefix = "uploads";
    private String bucket = "";
    private String region = "ap-northeast-2";
    private String accessKeyId = "";
    private String secretAccessKey = "";
    private String sessionToken = "";
}
