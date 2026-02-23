// src/pages/site/auth/api/authApi.js
import { axiosInstance } from "../../../../app/http/axiosInstance";

// ApiResponse<T> 래핑 해제
function unwrap(apiResponse) {
  return apiResponse?.data ?? apiResponse;
}

export const authApi = {
  // 1) 회원가입 시작: signupKey 발급 + OTP 발송
  signupStart: async (payload) => {
    const { data } = await axiosInstance.post(
      "/api/auth/signup/start",
      payload,
    );
    return unwrap(data);
  },

  // 2) OTP 검증
  signupVerifyOtp: async (payload) => {
    const { data } = await axiosInstance.post(
      "/api/auth/signup/verify-otp",
      payload,
    );
    return unwrap(data);
  },

  // 3) (선택) EMAIL 가입이면 이메일 인증 메일 요청
  signupEmailRequest: async (payload) => {
    const { data } = await axiosInstance.post(
      "/api/auth/signup/email/request",
      payload,
    );
    return unwrap(data);
  },

  // 4) (선택) EMAIL 가입이면 이메일 인증 확인
  signupEmailConfirm: async (payload) => {
    const { data } = await axiosInstance.post(
      "/api/auth/signup/email/confirm",
      payload,
    );
    return unwrap(data);
  },

  // 5) 회원가입 완료: users 생성 + 토큰 발급(자동 로그인)
  signupComplete: async (payload) => {
    const { data } = await axiosInstance.post(
      "/api/auth/signup/complete",
      payload,
    );
    return unwrap(data); // LoginResponse(예: accessToken 포함)
  },

  // 로그인/refresh/logout 그대로
  login: async (payload) => {
    const { data } = await axiosInstance.post("/api/auth/login", payload);
    return unwrap(data);
  },

  refresh: async () => {
    const { data } = await axiosInstance.post("/api/auth/refresh");
    return unwrap(data);
  },

  logout: async () => {
    const { data } = await axiosInstance.post("/api/auth/logout");
    return unwrap(data);
  },

  // ✅ 카카오 OAuth: code -> (BE) token 교환 + user/me 조회
  kakaoExchange: async (payload) => {
    const { data } = await axiosInstance.post(
      "/api/auth/oauth/kakao/exchange",
      payload,
    );
    return unwrap(data);
  },
};
