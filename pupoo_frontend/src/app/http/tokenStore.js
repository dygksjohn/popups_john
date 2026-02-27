// Access Token은 메모리에만 보관한다.
// - refresh_token은 HttpOnly 쿠키로 유지(자바스크립트에서 접근 불가)
// - 새로고침 시에는 /api/auth/refresh로 accessToken을 복구한다.

let accessTokenMemory = null;

export const tokenStore = {
  getAccess() {
    return accessTokenMemory;
  },

  // refresh token은 HttpOnly 쿠키이므로 여기서는 다루지 않는다.
  getRefresh() {
    return null;
  },

  setAccess(accessToken) {
    accessTokenMemory = accessToken || null;
  },

  // 호환용(호출부 유지)
  setRefresh() {
    // no-op
  },

  setTokens({ accessToken }) {
    accessTokenMemory = accessToken || null;
  },

  clear() {
    accessTokenMemory = null;
  },
};
