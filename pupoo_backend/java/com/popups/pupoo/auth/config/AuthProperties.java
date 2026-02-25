
// file: src/main/java/com/popups/pupoo/auth/config/AuthProperties.java
package com.popups.pupoo.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

/**
 * application.properties의 auth.* 설정 바인딩.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "auth")
public class AuthProperties {

    private Jwt jwt = new Jwt();
    private Access access = new Access();
    private Refresh refresh = new Refresh();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private String issuer;
    }

    @Getter
    @Setter
    public static class Access {
        private long ttlSeconds;
    }

    @Getter
    @Setter
    public static class Refresh {
        private long ttlSeconds;
        private Cookie cookie = new Cookie();

        @Getter
        @Setter
        public static class Cookie {
            private long maxAgeSeconds;
            private boolean secure;
        }
    }
}
