import { tokenStore } from "./tokenStore";

// refresh는 인터셉터 없는 별도 axios로 호출(무한루프 방지)
import axios from "axios";

let isRefreshing = false;
let refreshQueue = [];

function resolveQueue(error, newAccessToken) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newAccessToken);
  });
  refreshQueue = [];
}

function pickAccessTokenFromResponse(res) {
  return (
    res?.data?.data?.accessToken ??
    res?.data?.accessToken ??
    res?.data?.data?.access_token ??
    res?.data?.access_token ??
    null
  );
}

export function attachInterceptors(instance) {
  instance.interceptors.request.use((config) => {
    const url = config?.url || "";

    // auth 계열은 Authorization을 붙이지 않는다(로그인/refresh/logout/signup/oauth)
    if (url.includes("/api/auth/")) {
      return config;
    }

    const access = tokenStore.getAccess();
    if (access) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (err) => {
      const status = err?.response?.status;
      const original = err?.config;
      if (!original) return Promise.reject(err);

      const url = String(original?.url || "");
      const isAuth = url.includes("/api/auth/");

      // 401이 아니거나 auth 요청이면 그대로 실패
      if (status !== 401 || isAuth) {
        return Promise.reject(err);
      }

      // 1회만 재시도
      if (original._retry) {
        tokenStore.clear();
        return Promise.reject(err);
      }
      original._retry = true;

      // refresh 진행 중이면 대기열에 걸고 토큰 받으면 재시도
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (newAccessToken) => {
              original.headers = original.headers || {};
              if (newAccessToken) {
                original.headers.Authorization = `Bearer ${newAccessToken}`;
              }
              resolve(instance(original));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const baseURL = instance.defaults.baseURL || "";
        const refreshClient = axios.create({
          baseURL,
          withCredentials: true,
          timeout: 10000,
          headers: { "Content-Type": "application/json" },
        });

        const refreshRes = await refreshClient.post("/api/auth/refresh", null);
        const newAccessToken = pickAccessTokenFromResponse(refreshRes);

        if (!newAccessToken) {
          throw new Error("Refresh succeeded but accessToken missing");
        }

        tokenStore.setAccess(newAccessToken);
        resolveQueue(null, newAccessToken);

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(original);
      } catch (refreshErr) {
        tokenStore.clear();
        resolveQueue(refreshErr, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    },
  );
}
