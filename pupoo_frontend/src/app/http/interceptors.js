import axios from "axios";
import { tokenStore } from "./tokenStore";
import {
  buildRequestUrl,
  getConfiguredBaseUrl,
} from "../../shared/config/requestUrl";

const REFRESH_PATH = "/api/auth/refresh";
const apiBaseUrl = getConfiguredBaseUrl(import.meta.env.VITE_API_BASE_URL);

let refreshPromise = null;

function normalizeUrlPath(url) {
  return String(url || "")
    .replace(/^https?:\/\/[^/]+/i, "")
    .split("?")[0];
}

function matchesPrefix(path, prefixes = []) {
  return prefixes.some((prefix) => path.startsWith(prefix));
}

function shouldSkipAutoAuth(config, options = {}) {
  const path = normalizeUrlPath(config?.url);
  const method = String(config?.method || "get").toUpperCase();
  const { publicPathPrefixes = [], publicGetPathPrefixes = [] } = options;

  if (matchesPrefix(path, publicPathPrefixes)) {
    return true;
  }

  return method === "GET" && matchesPrefix(path, publicGetPathPrefixes);
}

function hasAuthHeader(config) {
  return Boolean(
    config?.headers?.Authorization || config?.headers?.authorization,
  );
}

function isAdminRequestPath(path) {
  return path === "/api/admin" || path.startsWith("/api/admin/");
}

function hasRefreshableSession(path) {
  return isAdminRequestPath(path)
    ? tokenStore.hasAdminSessionHint()
    : tokenStore.hasSessionHint();
}

function clearSession(path) {
  if (isAdminRequestPath(path)) {
    tokenStore.clearAdmin();
    return;
  }
  tokenStore.clearUser();
}

function extractAccessToken(payload) {
  return payload?.data?.accessToken ?? payload?.accessToken ?? null;
}

async function requestTokenRefresh() {
  // 기능: 401 이후 refresh cookie 기반으로 새 access token을 발급받는다.
  // 설명: refresh API는 기존 access 없이도 동작해야 하므로 별도 axios 호출로 분리되어 있다.
  const res = await axios.post(
    buildRequestUrl(apiBaseUrl, REFRESH_PATH),
    null,
    { withCredentials: true },
  );

  const accessToken = extractAccessToken(res?.data);
  if (!accessToken) {
    throw new Error("refresh response missing accessToken");
  }

  return accessToken;
}

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = requestTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export function attachInterceptors(instance, options = {}) {
  instance.interceptors.request.use((config) => {
    // 기능: FormData 요청은 브라우저가 boundary를 직접 계산하도록 헤더를 비운다.
    if (config.data && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    // 기능: 공개 API가 아니고 Authorization이 비어 있으면 저장된 토큰을 자동으로 붙인다.
    // 설명: 로그인/회원가입 같은 공개 경로는 제외하고, 일반 사용자와 관리자 요청을 경로 기준으로 분기한다.
    if (shouldSkipAutoAuth(config, options)) {
      return config;
    }

    if (hasAuthHeader(config)) {
      return config;
    }

    const path = normalizeUrlPath(config?.url);
    const access = isAdminRequestPath(path)
      ? tokenStore.getAdminAccessToken()
      : tokenStore.getAccessToken();

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
      const path = normalizeUrlPath(original?.url);
      const isPublicAuthRequest = shouldSkipAutoAuth(original, options);
      const canRefreshSession = hasRefreshableSession(path);

      if (status !== 401 || isPublicAuthRequest) {
        return Promise.reject(err);
      }

      if (!hasAuthHeader(original) && !canRefreshSession) {
        return Promise.reject(err);
      }

      if (original._retry) {
        clearSession(path);
        return Promise.reject(err);
      }

      // 기능: 만료된 access token으로 실패한 요청은 refresh 성공 시 한 번만 재실행한다.
      // 설명: refreshPromise를 공유해 동시에 여러 401이 발생해도 refresh API는 한 번만 호출한다.
      // 흐름: 401 감지 -> refresh 토큰 재발급 -> 새 Authorization 주입 -> 원래 요청 재시도.
      original._retry = true;

      try {
        const accessToken = await refreshAccessToken();

        if (isAdminRequestPath(path)) {
          tokenStore.setAdminAccess(accessToken);
        } else {
          tokenStore.setAccess(accessToken);
        }

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${accessToken}`;

        return instance(original);
      } catch (refreshErr) {
        clearSession(path);
        return Promise.reject(refreshErr);
      }
    },
  );
}
