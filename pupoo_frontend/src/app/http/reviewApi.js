// src/app/http/reviewApi.js
import { axiosInstance } from "./axiosInstance";

function unwrap(res) {
  const body = res?.data;
  return body?.data ?? body;
}

/**
 * 행사 후기 API
 * - 목록/상세: 공개 (인증 불필요)
 * - 작성/수정/삭제: 인증 필요 (Bearer 토큰)
 */
export const reviewApi = {
  /**
   * GET /api/reviews — 후기 목록 (페이징, 검색)
   * @param {object} opts - { page (0-based), size, searchType, keyword }
   */
  list(opts = {}) {
    const { page = 0, size = 10, searchType, keyword } = opts;
    const params = { page, size };
    if (searchType != null && searchType !== "") params.searchType = searchType;
    if (keyword != null && keyword !== "") params.keyword = keyword;
    return axiosInstance.get("/api/reviews", { params }).then((res) => unwrap(res));
  },

  /** GET /api/reviews/{reviewId} — 후기 단건 조회 */
  get(reviewId) {
    if (reviewId == null) throw new Error("reviewApi.get: reviewId is required");
    return axiosInstance.get(`/api/reviews/${reviewId}`).then((res) => unwrap(res));
  },

  /** POST /api/reviews — 후기 작성 (인증 필요). eventId, rating(1~5), content */
  create(payload) {
    if (payload?.eventId == null || payload?.rating == null)
      throw new Error("reviewApi.create: eventId, rating are required");
    return axiosInstance
      .post("/api/reviews", {
        eventId: payload.eventId,
        rating: payload.rating,
        content: payload.content ?? "",
      })
      .then((res) => unwrap(res));
  },

  /** PATCH /api/reviews/{reviewId} — 후기 수정 (본인만). rating(1~5), content */
  update(reviewId, payload) {
    if (reviewId == null) throw new Error("reviewApi.update: reviewId is required");
    return axiosInstance
      .patch(`/api/reviews/${reviewId}`, {
        rating: payload?.rating ?? 5,
        content: payload?.content ?? "",
      })
      .then((res) => unwrap(res));
  },

  /** DELETE /api/reviews/{reviewId} — 후기 삭제 (본인만) */
  delete(reviewId) {
    if (reviewId == null) throw new Error("reviewApi.delete: reviewId is required");
    return axiosInstance.delete(`/api/reviews/${reviewId}`).then((res) => unwrap(res));
  },
};
