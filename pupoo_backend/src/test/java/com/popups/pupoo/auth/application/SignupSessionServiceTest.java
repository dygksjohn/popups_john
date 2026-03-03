package com.popups.pupoo.auth.application;

import com.popups.pupoo.auth.domain.enums.EmailSessionStatus;
import com.popups.pupoo.auth.domain.enums.OtpSessionStatus;
import com.popups.pupoo.auth.domain.enums.SignupType;
import com.popups.pupoo.auth.domain.model.RefreshToken;
import com.popups.pupoo.auth.domain.model.SignupSession;
import com.popups.pupoo.auth.dto.LoginResponse;
import com.popups.pupoo.auth.dto.SignupCompleteRequest;
import com.popups.pupoo.auth.dto.SignupStartRequest;
import com.popups.pupoo.auth.dto.SignupStartResponse;
import com.popups.pupoo.auth.persistence.RefreshTokenRepository;
import com.popups.pupoo.auth.persistence.SignupSessionRepository;
import com.popups.pupoo.notification.port.NotificationSender;
import com.popups.pupoo.user.application.UserService;
import com.popups.pupoo.user.domain.enums.RoleName;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.dto.UserCreateRequest;
import com.popups.pupoo.user.social.application.SocialAccountService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SignupSessionServiceTest {

    @Mock private SignupSessionRepository signupSessionRepository;
    @Mock private UserService userService;
    @Mock private SocialAccountService socialAccountService;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private TokenService tokenService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private NotificationSender notificationSender;

    private SignupSessionService signupSessionService;

    @BeforeEach
    void setUp() {
        signupSessionService = new SignupSessionService(
                signupSessionRepository,
                userService,
                socialAccountService,
                refreshTokenRepository,
                tokenService,
                passwordEncoder,
                notificationSender,
                "test-salt",
                5,
                60,
                5,
                5,
                15,
                10,
                5,
                true,
                false,
                1209600
        );
    }

    @Test
    void start_socialSignupWithoutEmail_allowsOtpOnlySignup() {
        SignupStartRequest request = new SignupStartRequest();
        request.setSignupType(SignupType.SOCIAL);
        request.setNickname("tester");
        request.setPhone("010-1234-5678");
        request.setSocialProvider("KAKAO");
        request.setSocialProviderUid("UID-123");

        when(signupSessionRepository.findTopByPhoneAndOtpLastSentAtIsNotNullOrderByOtpLastSentAtDesc(anyString()))
                .thenReturn(Optional.empty());
        when(signupSessionRepository.countByPhoneAndOtpLastSentAtAfter(anyString(), any(LocalDateTime.class)))
                .thenReturn(0L);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");
        when(signupSessionRepository.save(any(SignupSession.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        SignupStartResponse response = signupSessionService.start(request);

        ArgumentCaptor<SignupSession> sessionCaptor = ArgumentCaptor.forClass(SignupSession.class);
        verify(signupSessionRepository).save(sessionCaptor.capture());
        SignupSession saved = sessionCaptor.getValue();

        assertThat(saved.getEmail()).isNull();
        assertThat(saved.getEmailStatus()).isEqualTo(EmailSessionStatus.NOT_REQUIRED);
        assertThat(saved.getPasswordHash()).isEqualTo("encoded-password");
        assertThat(response.getDevOtp()).isNotBlank();

        ArgumentCaptor<List<String>> phoneCaptor = ArgumentCaptor.forClass(List.class);
        ArgumentCaptor<String> textCaptor = ArgumentCaptor.forClass(String.class);
        verify(notificationSender).sendSms(phoneCaptor.capture(), textCaptor.capture());
        assertThat(phoneCaptor.getValue()).containsExactly("01012345678");
        assertThat(textCaptor.getValue()).contains(response.getDevOtp());
    }

    @Test
    void complete_socialSignupWithoutEmail_usesFallbackEmail() {
        SignupSession session = new SignupSession();
        session.setSignupKey("signup-key");
        session.setSignupType(SignupType.SOCIAL);
        session.setNickname("tester");
        session.setPhone("01012345678");
        session.setPasswordHash("hashed-password");
        session.setOtpStatus(OtpSessionStatus.VERIFIED);
        session.setEmailStatus(EmailSessionStatus.NOT_REQUIRED);
        session.setSocialProvider("KAKAO");
        session.setSocialProviderUid("UID-123");
        session.setExpiresAt(LocalDateTime.now().plusMinutes(10));

        when(signupSessionRepository.findBySignupKey("signup-key")).thenReturn(Optional.of(session));

        when(userService.createWithPasswordHash(any(UserCreateRequest.class), eq("hashed-password")))
                .thenAnswer(invocation -> {
                    User user = new User();
                    user.setUserId(101L);
                    user.setRoleName(RoleName.USER);
                    return user;
                });

        when(tokenService.createAccessToken(101L, "USER")).thenReturn("access-token");
        when(tokenService.createRefreshToken(101L)).thenReturn("refresh-token");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SignupCompleteRequest request = new SignupCompleteRequest();
        request.setSignupKey("signup-key");

        HttpServletResponse response = new MockHttpServletResponse();
        LoginResponse loginResponse = signupSessionService.complete(request, response);

        ArgumentCaptor<UserCreateRequest> requestCaptor = ArgumentCaptor.forClass(UserCreateRequest.class);
        verify(userService).createWithPasswordHash(requestCaptor.capture(), eq("hashed-password"));

        String createdEmail = requestCaptor.getValue().getEmail();
        assertThat(createdEmail).isEqualTo("kakao_uid-123@social.pupoo.local");
        assertThat(loginResponse.getAccessToken()).isEqualTo("access-token");

        verify(socialAccountService).createMySocialAccount(eq(101L), any());
        verify(signupSessionRepository).delete(session);
    }
}
