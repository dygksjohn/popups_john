import { tokenStore } from "./tokenStore";
import axios from "axios";

// JWT payload에서 userId 추출
function getUserIdFromToken(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.userId ?? decoded.sub ?? decoded.user_id ?? decoded.id ?? null;
  } catch {
    return null;
  }
}

// 401 이벤트 (블러 + 로그인 팝업용)
const AUTH_EXPIRED_EVENT = "pupoo:auth-expired";

export function onAuthExpired(callback) {
  window.addEventListener(AUTH_EXPIRED_EVENT, callback);
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, callback);
}

function fireAuthExpired() {
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
}

// Single-flight refresh lock + queue
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

// HTTP 상태별 한국어 에러 메시지
const ERROR_MESSAGES = {
  400: "요청 형식이 올바르지 않습니다.",
  401: "로그인이 만료되었습니다. 다시 로그인해주세요.",
  403: "접근 권한이 없습니다.",
  404: "요청한 데이터를 찾을 수 없습니다.",
  409: "이미 존재하는 데이터입니다.",
  422: "입력값이 올바르지 않습니다.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  500: "서버에 문제가 발생했습니다.",
  502: "서버와 연결할 수 없습니다.",
  503: "서버가 점검 중입니다.",
};

function getErrorMessage(status, serverMsg) {
  if (serverMsg && typeof serverMsg === "string" && serverMsg.length < 100) return serverMsg;
  return ERROR_MESSAGES[status] || `오류가 발생했습니다. (${status})`;
}

function showError(msg) {
  console.warn("[PUPOO]", msg);
}

export function attachInterceptors(instance) {
  // 요청 인터셉터
  instance.interceptors.request.use((config) => {
    const url = config?.url || "";
    if (url.includes("/api/auth/")) return config;

    const access = tokenStore.getAccess();
    if (access) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${access}`;
      const userId = getUserIdFromToken(access);
      if (userId) config.headers["X-USER-ID"] = userId;
    }
    return config;
  });

  // 응답 인터셉터
  instance.interceptors.response.use(
    (res) => res,
    async (err) => {
      const status = err?.response?.status;
      const original = err?.config;

      if (!err.response) {
        showError("서버와 연결할 수 없습니다.");
        return Promise.reject(err);
      }
      if (!original) return Promise.reject(err);

      const url = String(original?.url || "");
      const isAuth = url.includes("/api/auth/");

      if (status !== 401 || isAuth) {
        if (status && status >= 400) {
          const serverMsg = err?.response?.data?.message || null;
          showError(getErrorMessage(status, serverMsg));
        }
        return Promise.reject(err);
      }

      // 401: refresh 1회 재시도 (단일 락 + 대기열)
      if (original._retry) {
        tokenStore.clear();
        fireAuthExpired();
        return Promise.reject(err);
      }
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (newAccessToken) => {
              original.headers = original.headers || {};
              if (newAccessToken) {
                original.headers.Authorization = `Bearer ${newAccessToken}`;
                const uid = getUserIdFromToken(newAccessToken);
                if (uid) original.headers["X-USER-ID"] = uid;
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
        if (!newAccessToken) throw new Error("Refresh succeeded but accessToken missing");

        tokenStore.setAccess(newAccessToken);
        resolveQueue(null, newAccessToken);

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        const uid = getUserIdFromToken(newAccessToken);
        if (uid) original.headers["X-USER-ID"] = uid;
        return instance(original);
      } catch (refreshErr) {
        tokenStore.clear();
        resolveQueue(refreshErr, null);
        fireAuthExpired();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    },
  );
}
