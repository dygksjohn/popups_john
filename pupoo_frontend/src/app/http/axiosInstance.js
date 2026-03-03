import axios from "axios";
import { attachInterceptors } from "./interceptors";

export function createAxiosInstance() {
  const envBaseURL = import.meta.env.VITE_API_BASE_URL;
  const baseURL = typeof envBaseURL === "string" && envBaseURL.trim().length > 0
    ? envBaseURL.trim().replace(/\/+$/, "")
    : "";

  const instance = axios.create({
    baseURL,
    timeout: 10000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  attachInterceptors(instance);

  return instance;
}

export const axiosInstance = createAxiosInstance();
