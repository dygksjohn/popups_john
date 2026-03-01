import { apiClient, getApiErrorMessage, normalizeApiError } from "../../shared/api/apiClient";
import { unwrapApiResponse } from "../../shared/api/unwrapApiResponse";

export { getApiErrorMessage, normalizeApiError, unwrapApiResponse };

export const authApi = {
  signupStart(payload, options) {
    return apiClient.post("/api/auth/signup/start", payload, {
      ...options,
      fallbackMessage: "회원가입 시작에 실패했습니다.",
    });
  },

  signupVerifyOtp(payload, options) {
    return apiClient.post("/api/auth/signup/verify-otp", payload, {
      ...options,
      fallbackMessage: "OTP 인증에 실패했습니다.",
    });
  },

  signupEmailRequest(payload, options) {
    return apiClient.post("/api/auth/signup/email/request", payload, {
      ...options,
      fallbackMessage: "이메일 인증 요청에 실패했습니다.",
    });
  },

  signupEmailConfirm(payload, options) {
    return apiClient.post("/api/auth/signup/email/confirm", payload, {
      ...options,
      fallbackMessage: "이메일 인증 확인에 실패했습니다.",
    });
  },

  signupComplete(payload, options) {
    return apiClient.post("/api/auth/signup/complete", payload, {
      ...options,
      fallbackMessage: "회원가입 완료에 실패했습니다.",
    });
  },

  login(payload, options) {
    return apiClient.post("/api/auth/login", payload, {
      ...options,
      fallbackMessage: "로그인에 실패했습니다.",
    });
  },

  refresh(options) {
    return apiClient.post("/api/auth/refresh", null, {
      ...options,
      fallbackMessage: "세션 갱신에 실패했습니다.",
    });
  },

  logout(options) {
    return apiClient.post("/api/auth/logout", null, {
      ...options,
      fallbackMessage: "로그아웃에 실패했습니다.",
    });
  },

  kakaoExchange(payload, options) {
    return apiClient.post("/api/auth/oauth/kakao/exchange", payload, {
      ...options,
      fallbackMessage: "카카오 코드 교환에 실패했습니다.",
    });
  },

  kakaoLogin(payload, options = {}) {
    return apiClient.post("/api/auth/oauth/kakao/login", payload, {
      ...options,
      config: {
        withCredentials: true,
        ...(options?.config || {}),
      },
      fallbackMessage: "카카오 로그인 처리에 실패했습니다.",
    });
  },

  requestEmailChange(payload, options) {
    return apiClient.post("/api/users/me/email-change/request", payload, {
      ...options,
      fallbackMessage: "이메일 변경 인증 요청에 실패했습니다.",
    });
  },

  confirmEmailChange(payload, options) {
    return apiClient.post("/api/users/me/email-change/confirm", payload, {
      ...options,
      fallbackMessage: "이메일 변경 인증 확인에 실패했습니다.",
    });
  },

  requestPhoneChange(payload, options) {
    return apiClient.post("/api/users/me/phone-change/request", payload, {
      ...options,
      fallbackMessage: "전화번호 변경 인증 요청에 실패했습니다.",
    });
  },

  confirmPhoneChange(payload, options) {
    return apiClient.post("/api/users/me/phone-change/confirm", payload, {
      ...options,
      fallbackMessage: "전화번호 변경 인증 확인에 실패했습니다.",
    });
  },
};
