import axios from "axios";
import { attachInterceptors } from "./interceptors";

export function createAxiosInstance() {
  // ✅ 끝 슬래시 제거한 baseURL을 실제로 사용
  const baseURL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
  ).replace(/\/+$/, "");

  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  console.log("🔥 axiosInstance baseURL =", instance.defaults.baseURL);

  // ✅ 공개 엔드포인트(토큰 붙이면 안 됨) 목록을 인터셉터로 전달
  attachInterceptors(instance, {
    publicPathPrefixes: [
      "/api/auth/", // login/refresh/logout/signup/oauth 전부 포함
      "/api/storage/presign", // presign이 공개라면 유지, 아니라면 삭제
    ],
  });

  return instance;
}

export const axiosInstance = createAxiosInstance();
