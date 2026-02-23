import { tokenStore } from "./tokenStore";

export function attachInterceptors(instance) {
  instance.interceptors.request.use((config) => {
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

      //url.includes("/api/auth/login") ||
      //url.includes("/api/auth/signup") ||
      //url.includes("/api/auth/refresh") ||
      //url.includes("/api/auth/logout");

      if (status !== 401 || isAuth) {
        return Promise.reject(err);
      }

      if (original._retry) {
        tokenStore.clear();
      }
    },
  );
}
