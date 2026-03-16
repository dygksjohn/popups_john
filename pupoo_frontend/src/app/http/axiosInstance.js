import axios from "axios";
import { attachInterceptors } from "./interceptors";
import {
  buildRequestUrl,
  getConfiguredBaseUrl,
} from "../../shared/config/requestUrl";

export function createAxiosInstance() {
  const baseURL = getConfiguredBaseUrl(import.meta.env.VITE_API_BASE_URL);

  const instance = axios.create({
    // Keep axios baseURL unset and build the final URL explicitly in the
    // request interceptor. This prevents duplicate prefixes like /api/api/*.
    baseURL: undefined,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  instance.interceptors.request.use((config) => {
    config.url = buildRequestUrl(baseURL, config.url);
    return config;
  });

  console.log("axiosInstance request base =", baseURL || "(same-origin)");

  attachInterceptors(instance, {
    publicPathPrefixes: ["/api/auth/", "/api/storage/presign"],
    publicGetPathPrefixes: [
      "/api/ping",
      "/api/health",
      "/api/posts",
      "/api/notices",
      "/api/boards",
      "/api/faqs",
      "/api/events",
      "/api/programs",
      "/api/ai",
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
