// src/pages/site/auth/api/authApi.js
import { axiosInstance } from "../../../../app/http/axiosInstance";

// ApiResponse<T> 래핑 해제
function unwrap(apiResponse) {
  return apiResponse?.data ?? apiResponse;
}

export const authApi = {
  // 회원가입 + 자동 로그인
  signup: async (payload) => {
    const { data } = await axiosInstance.post("/api/auth/signup", payload);
    return unwrap(data);
  },

  // 로그인
  login: async (payload) => {
    const { data } = await axiosInstance.post("/api/auth/login", payload);
    return unwrap(data);
  },

  // refresh (쿠키 기반)
  refresh: async () => {
    const { data } = await axiosInstance.post("/api/auth/refresh");
    return unwrap(data);
  },

  // 로그아웃
  logout: async () => {
    const { data } = await axiosInstance.post("/api/auth/logout");
    return unwrap(data);
  },
};