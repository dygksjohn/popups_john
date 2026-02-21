import axios from "axios";
import { attachInterceptors } from "./interceptors";

export function createAxiosInstance() {
  const baseURL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080")
    .replace(/\/+$/, ""); // ✅ 끝 슬래시 제거

  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: { "Content-Type": "application/json" },

    // ✅ HttpOnly refresh 쿠키 기반이면 필수
    withCredentials: true,
  });

  attachInterceptors(instance);
  return instance;
}

export const axiosInstance = createAxiosInstance();