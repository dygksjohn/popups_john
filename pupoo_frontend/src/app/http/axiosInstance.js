import axios from "axios";
import { attachInterceptors } from "./interceptors";

export function createAxiosInstance() {
  const baseURL = String(import.meta.env.VITE_API_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");

  const instance = axios.create({
    baseURL: baseURL || undefined,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  console.log("axiosInstance baseURL =", instance.defaults.baseURL);

  attachInterceptors(instance, {
    publicPathPrefixes: [
      "/api/auth/",
      "/api/storage/presign",
    ],
    publicGetPathPrefixes: [
      "/api/ping",
      "/api/health",
      "/api/posts",
      "/api/notices",
      "/api/boards",
      "/api/faqs",
      "/api/events",
      "/api/programs",
      "/api/program-applies/programs/",
      "/api/speakers",
      "/api/booths",
      "/api/qnas",
      "/api/galleries",
      "/api/reviews",
      "/api/replies",
      "/api/report-reasons",
      "/api/files",
      "/api/users/check-nickname",
    ],
  });

  return instance;
}

export const axiosInstance = createAxiosInstance();
