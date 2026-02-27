import axios from "axios";
import { attachInterceptors } from "./interceptors";

export function createAxiosInstance() {
  // baseURL 정책
  // - VITE_API_BASE_URL이 있으면 사용 (예: http://localhost:8080)
  // - 없으면 상대 경로로 호출(= Vite proxy 또는 same-origin 배포)
  const envBase = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  const baseURL = envBase ? envBase.replace(/\/+$/, "") : "";

  const instance = axios.create({
    baseURL,
    timeout: 10000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  attachInterceptors(instance);

  return instance;
}

export const axiosInstance = createAxiosInstance();
