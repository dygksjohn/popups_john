// src/api/noticeApi.js
import { axiosInstance } from "../app/http/axiosInstance";

/* ── 공지사항 API (사용자) ── */
export const noticeApi = {
  list: (uiPage = 1, size = 10) =>
    axiosInstance.get("/api/notices", { params: { page: uiPage - 1, size } }),
  get: (noticeId) => axiosInstance.get(`/api/notices/${noticeId}`),
};

/* ── 공지사항 API (관리자) ── */
export const adminNoticeApi = {
  list: (uiPage = 1, size = 10) =>
    axiosInstance.get("/api/admin/notices", {
      params: { page: uiPage - 1, size },
    }),
  get: (id) => axiosInstance.get(`/api/admin/notices/${id}`),

  /** POST /api/admin/notices — NoticeCreateRequest */
  create: (data) =>
    axiosInstance.post("/api/admin/notices", {
      title: data.title,
      content: data.content || "",
      pinned: data.pinned ?? false,
      scope: data.scope || "ALL",
      eventId: data.eventId || null,
      status: data.status || "PUBLISHED",
    }),

  /** PATCH /api/admin/notices/{id} — NoticeUpdateRequest */
  update: (id, data) =>
    axiosInstance.patch(`/api/admin/notices/${id}`, {
      title: data.title,
      content: data.content || "",
      pinned: data.pinned ?? false,
      scope: data.scope || "ALL",
      eventId: data.eventId || null,
      status: data.status || "PUBLISHED",
    }),

  delete: (id) => axiosInstance.delete(`/api/admin/notices/${id}`),
};

export function unwrap(res) {
  return res?.data?.data ?? res?.data ?? null;
}
