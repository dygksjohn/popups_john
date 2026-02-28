const ACCESS_KEY = "pupoo_access_token";
const REFRESH_KEY = "pupoo_refresh_token";

export const tokenStore = {
  getAccess() {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh() {
    return localStorage.getItem(REFRESH_KEY);
  },

  // ✅ 호환용 추가 (기존 코드 유지)
  setAccess(accessToken) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  },
  setRefresh(refreshToken) {
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },

  setTokens({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
