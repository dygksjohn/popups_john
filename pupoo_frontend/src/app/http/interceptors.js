import { tokenStore } from "./tokenStore";

export function attachInterceptors(instance) {
  instance.interceptors.request.use((config) => {
    const url = config?.url || "";

    // ✅ auth 계열은 Authorization 헤더를 붙이지 않는다
    if (url.includes("/api/auth/")) {
      return config;
    }

    const existingAuth =
      config?.headers?.Authorization ?? config?.headers?.authorization;
    if (existingAuth) {
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

      // auth endpoint 제외
      const url = original?.url || "";
      const isAuth = url.includes("/api/auth/");

      if (status !== 401 || isAuth) {
        return Promise.reject(err);
      }

      if (original._retry) {
        tokenStore.clear();
        return Promise.reject(err);
      }

      original._retry = true;

      try {
        const refreshRes = await instance.post(
          "/api/auth/refresh",
          null,
          { withCredentials: true },
        );

        const newAccess =
          refreshRes?.data?.data?.accessToken ??
          refreshRes?.data?.accessToken;

        if (!newAccess) {
          tokenStore.clear();
          return Promise.reject(err);
        }

        tokenStore.setAccess(newAccess);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return instance(original);
      } catch (refreshErr) {
        tokenStore.clear();
        return Promise.reject(refreshErr);
      }
    },
  );
}
