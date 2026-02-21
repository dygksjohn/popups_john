const ACCESS_KEY = "pupoo_access_token";

export const tokenStore = {
  getAccess() {
    return localStorage.getItem(ACCESS_KEY);
  },
  setAccess(accessToken) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
  },
};