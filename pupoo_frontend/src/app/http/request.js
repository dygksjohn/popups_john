import { axiosInstance } from "./axiosInstance";
import { buildFormData } from "../../shared/utils/buildFormData";

// ✅ /api prefix 자동 보정
function withApiPrefix(url = "") {
  // 절대 URL이면 그대로
  if (/^https?:\/\//i.test(url)) return url;

  // 앞에 슬래시 보정
  const u = url.startsWith("/") ? url : `/${url}`;

  // 이미 /api 로 시작하면 그대로
  if (u === "/api" || u.startsWith("/api/")) return u;

  // 아니면 /api 붙이기
  return `/api${u}`;
}

export const apiJson = {
  get: (url, config) => axiosInstance.get(withApiPrefix(url), config),
  post: (url, data, config) => axiosInstance.post(withApiPrefix(url), data, config),
  put: (url, data, config) => axiosInstance.put(withApiPrefix(url), data, config),
  delete: (url, config) => axiosInstance.delete(withApiPrefix(url), config),
};

export const apiForm = {
  post: (url, obj, config) =>
    axiosInstance.post(withApiPrefix(url), buildFormData(obj), config),
  put: (url, obj, config) =>
    axiosInstance.put(withApiPrefix(url), buildFormData(obj), config),
};

export const apiUrlEncoded = {
  post: (url, params, config) =>
    axiosInstance.post(withApiPrefix(url), new URLSearchParams(params), {
      ...config,
      headers: { ...(config?.headers || {}), "Content-Type": "application/x-www-form-urlencoded" },
    }),
};