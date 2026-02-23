// file: src/main/java/com/popups/pupoo/PupooBackendApplication.java
package com.popups.pupoo;

import com.popups.pupoo.payment.infrastructure.KakaoPayProperties;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
@EnableConfigurationProperties(KakaoPayProperties.class)
public class PupooBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(PupooBackendApplication.class, args);
	}

	/**
	 * 🔥 디버깅용: 카카오 OAuth 설정이 실제로 어떻게 로딩되는지 확인
	 */
	@Bean
	public ApplicationRunner kakaoPropsCheck(Environment env) {
		return args -> {
			String clientId = env.getProperty("kakao.oauth.client-id");
			String redirectUri = env.getProperty("kakao.oauth.redirect-uri");
			String clientSecret = env.getProperty("kakao.oauth.client-secret");

			System.out.println("======================================");
			System.out.println("### KAKAO PROPS CHECK (Startup)");
			System.out.println("client-id = " + clientId);
			System.out.println("redirect-uri = " + redirectUri);
			System.out.println("client-secret length = "
					+ (clientSecret == null ? 0 : clientSecret.length()));
			System.out.println("======================================");
		};
	}
}