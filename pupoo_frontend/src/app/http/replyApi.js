// src/app/http/replyApi.js
import { axiosInstance } from "./axiosInstance";

const TARGET_POST = "POST";

function unwrap(res) {
  const body = res?.data;
  return body?.data ?? body;
}

/**
 * 댓글 API (게시글/후기 댓글)
 * - 목록: GET /api/replies?targetType=&targetId=&page=&size=
 * - 생성/수정/삭제: 인증 필요
 */
export const replyApi = {
  /**
   * GET /api/replies — 댓글 목록 (targetType=POST|REVIEW, targetId=postId|reviewId)
   */
  list(targetType, targetId, page = 0, size = 20) {
    if (targetType == null || targetId == null)
      throw new Error("replyApi.list: targetType, targetId are required");
    return axiosInstance
      .get("/api/replies", { params: { targetType, targetId, page, size } })
      .then((res) => unwrap(res));
  },

  /** POST /api/replies — 댓글 작성 */
  create(payload) {
    if (!payload?.targetType || payload?.targetId == null || payload?.content == null)
      throw new Error("replyApi.create: targetType, targetId, content are required");
    return axiosInstance
      .post("/api/replies", {
        targetType: payload.targetType,
        targetId: payload.targetId,
        content: payload.content.trim(),
      })
      .then((res) => unwrap(res));
  },

  /** PATCH /api/replies/{replyId}?targetType= — 댓글 수정 */
  update(replyId, targetType, content) {
    if (replyId == null || targetType == null)
      throw new Error("replyApi.update: replyId, targetType are required");
    return axiosInstance
      .patch(`/api/replies/${replyId}`, { content: content ?? "" }, { params: { targetType } })
      .then((res) => unwrap(res));
  },

  /** DELETE /api/replies/{replyId}?targetType= — 댓글 삭제(soft) */
  delete(replyId, targetType) {
    if (replyId == null || targetType == null)
      throw new Error("replyApi.delete: replyId, targetType are required");
    return axiosInstance
      .delete(`/api/replies/${replyId}`, { params: { targetType } })
      .then((res) => unwrap(res));
  },
};

/** 게시글 댓글 전용 헬퍼 */
export const postReplyApi = {
  list: (postId, page, size) => replyApi.list(TARGET_POST, postId, page, size),
  create: (postId, content) => replyApi.create({ targetType: TARGET_POST, targetId: postId, content }),
  update: (replyId, content) => replyApi.update(replyId, TARGET_POST, content),
  delete: (replyId) => replyApi.delete(replyId, TARGET_POST),
};
