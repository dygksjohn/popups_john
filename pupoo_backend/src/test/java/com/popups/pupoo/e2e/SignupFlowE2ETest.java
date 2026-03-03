package com.popups.pupoo.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.popups.pupoo.auth.api.AuthController;
import com.popups.pupoo.auth.application.AuthService;
import com.popups.pupoo.auth.application.KakaoOAuthService;
import com.popups.pupoo.auth.application.SignupSessionService;
import com.popups.pupoo.auth.dto.LoginResponse;
import com.popups.pupoo.auth.dto.SignupStartResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class SignupFlowE2ETest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private AuthService authService;
    @MockitoBean private SignupSessionService signupSessionService;
    @MockitoBean private KakaoOAuthService kakaoOAuthService;

    @Test
    void socialSignupFlow_withoutEmail_completesByOtp() throws Exception {
        SignupStartResponse startResponse = new SignupStartResponse(
                "signup-social-001",
                60,
                4,
                LocalDateTime.now().plusMinutes(30),
                "123456"
        );
        LoginResponse completeResponse = new LoginResponse("access-token", 101L, "USER");

        when(signupSessionService.start(any())).thenReturn(startResponse);
        when(signupSessionService.complete(any(), any())).thenReturn(completeResponse);

        mockMvc.perform(post("/api/auth/signup/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "signupType", "SOCIAL",
                                "socialProvider", "KAKAO",
                                "socialProviderUid", "kakao-uid-001",
                                "nickname", "테스터",
                                "phone", "010-1234-5678"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.signupKey").value("signup-social-001"))
                .andExpect(jsonPath("$.data.devOtp").value("123456"));

        mockMvc.perform(post("/api/auth/signup/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "signupKey", "signup-social-001",
                                "otp", "123456"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message").value("OTP_VERIFIED"));

        mockMvc.perform(post("/api/auth/signup/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "signupKey", "signup-social-001"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                .andExpect(jsonPath("$.data.userId").value(101L))
                .andExpect(jsonPath("$.data.roleName").value("USER"));

        verify(signupSessionService).start(any());
        verify(signupSessionService).verifyOtp(any());
        verify(signupSessionService).complete(any(), any());
    }
}

