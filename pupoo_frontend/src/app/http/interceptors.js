import { tokenStore } from "./tokenStore";
import { emitAuthLogout } from "./authEvents";

let refreshPromise = null;

function readAccessTokenFromResponse(response) {
  const body = response?.data;
  if (!body) return null;

  // ApiResponse<TokenResponse>
  if (body.success && body.data?.accessToken) {
    return body.data.accessToken;
  }

  // Fallback: already unwrapped or custom shape
  return body?.accessToken ?? body?.data?.accessToken ?? null;
}

export function attachInterceptors(instance) {
  instance.interceptors.request.use((config) => {
    const url = config?.url || "";

    // Do not attach Authorization header to auth endpoints.
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

      const url = original?.url || "";
      const isAuth = url.includes("/api/auth/");

      if (status !== 401 || isAuth) {
        return Promise.reject(err);
      }

      if (original._retry) {
        tokenStore.clear();
        emitAuthLogout("unauthorized");
        return Promise.reject(err);
      }

      original._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = instance
            .post("/api/auth/refresh", null, {
              withCredentials: true,
            })
            .then((refreshRes) => {
              const nextAccess = readAccessTokenFromResponse(refreshRes);
              if (!nextAccess) throw new Error("REFRESH_ACCESS_TOKEN_MISSING");
              tokenStore.setAccess(nextAccess);
              return nextAccess;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const nextAccess = await refreshPromise;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${nextAccess}`;

        return instance(original);
      } catch (refreshError) {
        tokenStore.clear();
        emitAuthLogout("refresh_failed");
        return Promise.reject(refreshError);
      }
    },
  );
}
