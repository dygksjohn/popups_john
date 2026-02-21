import { tokenStore } from "./tokenStore";

export function attachInterceptors(instance) {
  // request interceptor
  instance.interceptors.request.use((config) => {
    const access = tokenStore.getAccess();
    if (access) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  });

  // response interceptor
  let isRefreshing = false;
  let queue = [];

  const runQueue = (error, token = null) => {
    queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
    queue = [];
  };

  instance.interceptors.response.use(
    (res) => res,
    async (err) => {
      const status = err?.response?.status;
      const original = err?.config;

      if (!original) return Promise.reject(err);

      // auth endpoint 제외
      const url = original?.url || "";
      const isAuth =
        url.includes("/api/auth/login") ||
        url.includes("/api/auth/signup") ||
        url.includes("/api/auth/refresh") ||
        url.includes("/api/auth/logout");

      if (status !== 401 || isAuth) {
        return Promise.reject(err);
      }

      if (original._retry) {
        tokenStore.clear();
        return Promise.reject(err);
      }

      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          return instance(original);
        });
      }

      isRefreshing = true;

      try {
        // 🔥 여기서 authApi 쓰지 않고 직접 호출
        const { data } = await instance.post("/api/auth/refresh");
        const newAccessToken = data?.data?.accessToken ?? data?.accessToken;

        if (!newAccessToken) {
          tokenStore.clear();
          return Promise.reject(err);
        }

        tokenStore.setAccess(newAccessToken);
        runQueue(null, newAccessToken);

        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(original);
      } catch (refreshErr) {
        runQueue(refreshErr, null);
        tokenStore.clear();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
  );
}