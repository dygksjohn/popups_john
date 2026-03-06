import { tokenStore } from "./tokenStore";

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

export function attachInterceptors(instance, options = {}) {
  instance.interceptors.request.use((config) => {
    if (shouldSkipAutoAuth(config, options)) {
      return config;
    }

    if (hasAuthHeader(config)) {
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

      if (!hasAuthHeader(original)) {
        return Promise.reject(err);
      }

      const isAuth = shouldSkipAutoAuth(original, options);

      if (status !== 401 || isAuth) {
        return Promise.reject(err);
      }

      if (original._retry) {
        tokenStore.clear();
        return Promise.reject(err);
      }

      // ✅ (일단) refresh 로직 없으니 여기서 그냥 clear하고 로그인 유도
      tokenStore.clear();
      return Promise.reject(err);
    },
  );
}
