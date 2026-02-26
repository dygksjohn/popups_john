// src/pages/site/auth/api/authApi.js
import { axiosInstance } from "../../../../app/http/axiosInstance";

// ApiResponse<T> 래핑 해제
function unwrap(apiResponse) {
  // axios 응답 -> ApiResponse<T>
  const body = apiResponse?.data;
  // ApiResponse<T>.data -> T
  return body?.data ?? body;
}
/**
 * 공통 POST 헬퍼
 * - signal(AbortController) 지원
 * - 호출별 config merge 정리
 */
async function post(url, payload, config = {}) {
  const res = await axiosInstance.post(url, payload, config);
  return unwrap(res);
}

export const authApi = {
  // 1) 회원가입 시작: signupKey 발급 + OTP 발송
  signupStart(payload) {
    return axiosInstance.post("/api/auth/signup/start", payload).then(unwrap);
  },

  // 2) OTP 검증
  signupVerifyOtp: async (payload, config) => {
    return post("/api/auth/signup/verify-otp", payload, config);
  },

  // 3) (선택) EMAIL 가입이면 이메일 인증 메일 요청
  signupEmailRequest: async (payload, config) => {
    return post("/api/auth/signup/email/request", payload, config);
  },

  // 4) (선택) EMAIL 가입이면 이메일 인증 확인
  signupEmailConfirm: async (payload, config) => {
    return post("/api/auth/signup/email/confirm", payload, config);
  },

  // 5) 회원가입 완료: users 생성 + 토큰 발급(자동 로그인)
  signupComplete: async (payload, config) => {
    return post("/api/auth/signup/complete", payload, config);
  },

  // 로그인/refresh/logout
  login: async (payload, config) => {
    return post("/api/auth/login", payload, config);
  },

  refresh: async (config) => {
    // refresh는 보통 payload 없음
    const res = await axiosInstance.post("/api/auth/refresh", null, config);
    return unwrap(res);
  },

  logout: async (config) => {
    const res = await axiosInstance.post("/api/auth/logout", null, config);
    return unwrap(res);
  },

  // 카카오 OAuth: code를 전달해 백엔드에서 토큰 교환을 처리한다.
  kakaoExchange: async (payload, config) => {
    return post("/api/auth/oauth/kakao/exchange", payload, config);
  },

  // 카카오 로그인(토큰 발급): 기존회원이면 access와 refresh 쿠키를 발급한다.
  // config로 signal 전달이 가능하다.
  kakaoLogin: async (payload, config = {}) => {
    return post("/api/auth/oauth/kakao/login", payload, {
      withCredentials: true,
      ...config,
    });
  },
};
