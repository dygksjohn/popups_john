import axios from "axios";
import { tokenStore } from "./tokenStore";
import {
  buildRequestUrl,
  getConfiguredBaseUrl,
} from "../../shared/config/requestUrl";

const ADMIN_TOKEN_KEY = "pupoo_admin_token";
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

function getAdminAccessToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setAdminAccessToken(accessToken) {
  try {
    if (accessToken) {
      localStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
    }
  } catch {
    // ignore storage failures
  }
}

function clearAllTokens() {
  tokenStore.clear();
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore storage failures
  }
}

function extractAccessToken(payload) {
  return payload?.data?.accessToken ?? payload?.accessToken ?? null;
}

async function requestTokenRefresh() {
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
    // Let the browser add the multipart boundary for FormData requests.
    if (config.data && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    if (shouldSkipAutoAuth(config, options)) {
      return config;
    }

    if (hasAuthHeader(config)) {
      return config;
    }

    const path = normalizeUrlPath(config?.url);
    const access = isAdminRequestPath(path)
      ? getAdminAccessToken()
      : tokenStore.getAccess();

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

      if (!hasAuthHeader(original)) {
        return Promise.reject(err);
      }

      const isPublicAuthRequest = shouldSkipAutoAuth(original, options);
      if (status !== 401 || isPublicAuthRequest) {
        return Promise.reject(err);
      }

      if (original._retry) {
        clearAllTokens();
        return Promise.reject(err);
      }

      original._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        const path = normalizeUrlPath(original?.url);

        if (isAdminRequestPath(path)) {
          setAdminAccessToken(accessToken);
        } else {
          tokenStore.setAccess(accessToken);
        }

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${accessToken}`;

        return instance(original);
      } catch (refreshErr) {
        clearAllTokens();
        return Promise.reject(refreshErr);
      }
    },
  );
}
