import axios from "axios";
import { attachInterceptors } from "./interceptors";

export function createAxiosInstance() {
  const baseURL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
  ).replace(/\/+$/, ""); // ✅ 끝 슬래시 제거

  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
  });

  console.log("🔥 axiosInstance baseURL =", instance.defaults.baseURL);

  attachInterceptors(instance);
  return instance;
}

export const axiosInstance = createAxiosInstance();
