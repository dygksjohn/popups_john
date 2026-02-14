package com.popups.pupoo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootTest
class PupooBackendApplicationTests {

	@Test
	void contextLoads() {
	}

	@Test
	void generatePasswordHash() {
		BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
		String rawPassword = "Pupoo!234";
		String hash = encoder.encode(rawPassword);

		System.out.println("=================================");
		System.out.println("Raw Password : " + rawPassword);
		System.out.println("BCrypt Hash  : " + hash);
		System.out.println("=================================");
	}
}
