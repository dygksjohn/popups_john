const ACCESS_KEY = "pupoo_access_token";
const REFRESH_KEY = "pupoo_refresh_token";

let accessTokenMemory = null;
let refreshTokenMemory = null;
let roleMemory = null;
let userIdMemory = null;

function readSession(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeSession(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

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
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
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
    if (!accessTokenMemory) {
      const stored = readSession(ACCESS_KEY);
      if (stored) {
        accessTokenMemory = stored;
        hydrateMetaFromAccess(stored);
      }
    }
    return accessTokenMemory;
  },
  getRefresh() {
    if (!refreshTokenMemory) {
      refreshTokenMemory = readSession(REFRESH_KEY);
    }
    return refreshTokenMemory;
  },
  getRole() {
    if (!accessTokenMemory) this.getAccess();
    return roleMemory;
  },
  getUserId() {
    if (!accessTokenMemory) this.getAccess();
    return userIdMemory;
  },

  setAccess(accessToken, meta = {}) {
    if (!accessToken) return;
    accessTokenMemory = accessToken;
    writeSession(ACCESS_KEY, accessToken);
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
    writeSession(REFRESH_KEY, refreshToken);
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
    removeSession(ACCESS_KEY);
    removeSession(REFRESH_KEY);

    // Legacy keys cleanup in case older builds stored tokens in localStorage.
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
