const ACCESS_KEY = "pupoo_access_token";
const REFRESH_KEY = "pupoo_refresh_token";

let accessTokenMemory = null;
let refreshTokenMemory = null;
let roleMemory = null;
let userIdMemory = null;

function normalizeRole(role) {
  if (!role) return null;
  const asString = String(role).toUpperCase();
  return asString.startsWith("ROLE_") ? asString.slice(5) : asString;
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function hydrateMetaFromAccess(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    roleMemory = null;
    userIdMemory = null;
    return;
  }

  roleMemory = normalizeRole(payload.role ?? payload.roleName);
  const subject = payload.sub;
  const numeric = Number(subject);
  userIdMemory = Number.isFinite(numeric) ? numeric : null;
}

export const tokenStore = {
  getAccess() {
    return accessTokenMemory;
  },
  getRefresh() {
    return refreshTokenMemory;
  },
  getRole() {
    return roleMemory;
  },
  getUserId() {
    return userIdMemory;
  },

  setAccess(accessToken, meta = {}) {
    if (!accessToken) return;
    accessTokenMemory = accessToken;
    hydrateMetaFromAccess(accessToken);

    if (meta.roleName || meta.role) {
      roleMemory = normalizeRole(meta.roleName ?? meta.role);
    }
    if (meta.userId !== undefined && meta.userId !== null) {
      userIdMemory = Number(meta.userId);
    }
  },

  setRefresh(refreshToken) {
    if (!refreshToken) return;
    refreshTokenMemory = refreshToken;
  },

  setTokens({ accessToken, refreshToken, roleName, role, userId }) {
    if (accessToken) {
      this.setAccess(accessToken, { roleName, role, userId });
    }
    if (refreshToken) {
      this.setRefresh(refreshToken);
    }
  },

  clear() {
    accessTokenMemory = null;
    refreshTokenMemory = null;
    roleMemory = null;
    userIdMemory = null;

    // Legacy keys cleanup in case older builds stored tokens in localStorage.
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
