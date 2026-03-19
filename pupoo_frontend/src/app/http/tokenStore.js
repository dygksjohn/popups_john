const ACCESS_KEY = "pupoo_access_token";
const REFRESH_KEY = "pupoo_refresh_token";
const SESSION_HINT_KEY = "pupoo_session_hint";
export const AUTH_CHANGE_EVENT = "pupoo-auth-changed";

function emitAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

export const tokenStore = {
  // 기능: 메모리 대신 localStorage에 저장된 access token을 공통 조회한다.
  getAccess() {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  hasSessionHint() {
    return localStorage.getItem(SESSION_HINT_KEY) === "1";
  },

  // 기능: access token 저장과 동시에 세션 존재 힌트를 남긴다.
  // 설명: 실제 refresh token은 쿠키에 있어도 프론트는 session hint로 복구 시도 여부를 판단한다.
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

  // 기능: 로그아웃이나 refresh 실패 시 브라우저 쪽 인증 흔적을 모두 제거한다.
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(SESSION_HINT_KEY);
    emitAuthChange();
  },
};
