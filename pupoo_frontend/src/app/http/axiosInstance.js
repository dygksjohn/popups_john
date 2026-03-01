import axios from "axios";
import { attachInterceptors } from "./interceptors";

export function createAxiosInstance() {
  const baseURL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
  ).replace(/\/+$/, "");

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
