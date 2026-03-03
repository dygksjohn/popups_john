// src/api/noticeApi.js
import { axiosInstance } from "../app/http/axiosInstance";

/* ── 토큰 관리 ── */
const TOKEN_KEY = "pupoo_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Authorization 헤더 생성 */
function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ── 로그인 API ── */
export const authApi = {
  login: (email, password) =>
    axiosInstance.post("/api/auth/login", { email, password }),
};

/* ── 공지사항 API (사용자 - 인증 불필요) ── */
export const noticeApi = {
  /**
   * GET /api/notices — 공지 목록 (페이징, 검색)
   * @param {number} uiPage - 1-based 페이지
   * @param {number} size - 페이지 크기
   * @param {string} [searchType] - TITLE | CONTENT | TITLE_CONTENT | WRITER
   * @param {string} [keyword] - 검색어
   */
  list: (uiPage = 1, size = 10, searchType, keyword) => {
    const params = { page: uiPage - 1, size };
    if (searchType != null && searchType !== "") params.searchType = searchType;
    if (keyword != null && keyword !== "") params.keyword = keyword;
    return axiosInstance.get("/api/notices", { params });
  },
  get: (noticeId) => axiosInstance.get(`/api/notices/${noticeId}`),
};

/* ── 공지사항 API (관리자 - JWT 필요) ── */
export const adminNoticeApi = {
  list: (uiPage = 1, size = 10) =>
    axiosInstance.get("/api/admin/notices", {
      params: { page: uiPage - 1, size },
      headers: authHeaders(),
    }),
  get: (id) =>
    axiosInstance.get(`/api/admin/notices/${id}`, { headers: authHeaders() }),

  create: (data) =>
    axiosInstance.post(
      "/api/admin/notices",
      {
        title: data.title,
        content: data.content || "",
        pinned: data.pinned ?? false,
        scope: data.scope || "ALL",
        eventId: data.eventId || null,
        status: data.status || "PUBLISHED",
      },
      { headers: authHeaders() },
    ),

  update: (id, data) =>
    axiosInstance.patch(
      `/api/admin/notices/${id}`,
      {
        title: data.title,
        content: data.content || "",
        pinned: data.pinned ?? false,
        scope: data.scope || "ALL",
        eventId: data.eventId || null,
        status: data.status || "PUBLISHED",
      },
      { headers: authHeaders() },
    ),

  delete: (id) =>
    axiosInstance.delete(`/api/admin/notices/${id}`, {
      headers: authHeaders(),
    }),
};

export function unwrap(res) {
  return res?.data?.data ?? res?.data ?? null;
}
