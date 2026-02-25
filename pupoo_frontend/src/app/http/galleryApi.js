// src/app/http/galleryApi.js
import { axiosInstance } from "./axiosInstance";

export const galleryApi = {
  // =========================
  // 공개 API (사이트/목록/상세/좋아요)
  // =========================

  // GET /api/galleries — 목록 조회 (페이지네이션, PUBLIC만)
  getList: ({ page = 0, size = 10 } = {}) =>
    axiosInstance.get("/api/galleries", { params: { page, size } }),

  // GET /api/galleries/{galleryId} — 단건 조회
  getOne: (galleryId) => {
    if (galleryId == null)
      throw new Error("galleryApi.getOne: galleryId is required");
    return axiosInstance.get(`/api/galleries/${galleryId}`);
  },

  // POST /api/galleries/{galleryId}/like — 좋아요 (로그인 사용자, X-USER-ID는 인터셉터에서 처리한다고 가정)
  like: (galleryId) => {
    if (galleryId == null)
      throw new Error("galleryApi.like: galleryId is required");
    return axiosInstance.post(`/api/galleries/${galleryId}/like`);
  },

  // =========================
  // 관리자 API (등록/수정/삭제)
  // =========================

  // POST /api/admin/galleries — 갤러리 등록
  create: (payload) => {
    if (!payload || payload.eventId == null)
      throw new Error("galleryApi.create: payload.eventId is required");
    if (!payload?.title?.trim())
      throw new Error("galleryApi.create: payload.title is required");
    return axiosInstance.post("/api/admin/galleries", payload);
  },

  // PATCH /api/admin/galleries/{galleryId} — 수정
  update: (galleryId, payload) => {
    if (galleryId == null)
      throw new Error("galleryApi.update: galleryId is required");
    return axiosInstance.patch(`/api/admin/galleries/${galleryId}`, payload);
  },

  // DELETE /api/admin/galleries/{galleryId} — 삭제 (소프트 삭제)
  delete: (galleryId) => {
    if (galleryId == null)
      throw new Error("galleryApi.delete: galleryId is required");
    return axiosInstance.delete(`/api/admin/galleries/${galleryId}`);
  },
};