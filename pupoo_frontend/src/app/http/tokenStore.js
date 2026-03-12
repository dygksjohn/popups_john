const ACCESS_KEY = "pupoo_access_token";
const REFRESH_KEY = "pupoo_refresh_token";
const SESSION_HINT_KEY = "pupoo_session_hint";
export const AUTH_CHANGE_EVENT = "pupoo-auth-changed";

function emitAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

export const tokenStore = {
  getAccess() {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  hasSessionHint() {
    return localStorage.getItem(SESSION_HINT_KEY) === "1";
  },

  setAccess(accessToken) {
    if (accessToken) {
      localStorage.setItem(ACCESS_KEY, accessToken);
      localStorage.setItem(SESSION_HINT_KEY, "1");
      emitAuthChange();
    }
  },
  setRefresh(refreshToken) {
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
      localStorage.setItem(SESSION_HINT_KEY, "1");
      emitAuthChange();
    }
  },

  setTokens({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    if (accessToken || refreshToken) {
      localStorage.setItem(SESSION_HINT_KEY, "1");
    }
    emitAuthChange();
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(SESSION_HINT_KEY);
    emitAuthChange();
  },
};
