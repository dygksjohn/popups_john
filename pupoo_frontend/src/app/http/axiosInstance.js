import axios from "axios";
import { attachInterceptors } from "./interceptors";

export function createAxiosInstance() {
  // 끝 슬래시를 제거한 API baseURL을 사용한다.
  const baseURL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
  ).replace(/\/+$/, "");

  const instance = axios.create({
    baseURL,
    timeout: 10000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  // 공개 인증 엔드포인트에는 Authorization 헤더를 생략한다.
  attachInterceptors(instance, {
    publicPathPrefixes: [
      "/api/auth/",
      "/api/storage/presign",
    ],
  });

  return instance;
}

export const axiosInstance = createAxiosInstance();
