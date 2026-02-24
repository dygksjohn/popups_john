import { tokenStore } from "./tokenStore";

export function attachInterceptors(instance) {
  instance.interceptors.request.use((config) => {
    const url = config?.url || "";

    // ✅ auth 계열은 Authorization 헤더를 붙이지 않는다
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

      // ✅ (일단) refresh 로직 없으니 여기서 그냥 clear하고 로그인 유도
      tokenStore.clear();
      return Promise.reject(err);
    },
  );
}
