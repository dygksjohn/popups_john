// src/api/qnaApi.js
import { axiosInstance } from "../app/http/axiosInstance";
import { tokenStore } from "../app/http/tokenStore";

/* ── 관리자 토큰 관리 (adminQnaApi 전용) ── */
const ADMIN_TOKEN_KEY = "pupoo_admin_token";

function adminAuthHeaders() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return {};
  const headers = { Authorization: `Bearer ${token}` };
  return headers;
}

function userAuthHeaders() {
  const token = tokenStore.getAccess();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/* ── 공통 유틸 ── */
export function unwrap(res) {
  return res?.data?.data ?? res?.data ?? null;
}

/* ── 사용자용 (QnA.jsx) ── */
// ✅ headers를 수동으로 넣지 않음 → interceptors.js가
//    tokenStore의 사용자 토큰을 자동으로 Authorization에 붙여줌
export const qnaApi = {
  list: (uiPage = 1, size = 10) =>
    axiosInstance.get("/api/qnas", {
      params: { page: uiPage - 1, size },
      headers: userAuthHeaders(),
    }),

  // 숨김(HIDDEN) 상세는 작성자 판별이 필요해, 로그인 사용자는 토큰을 함께 보낸다.
  get: (qnaId) => axiosInstance.get(`/api/qnas/${qnaId}`, {
    headers: userAuthHeaders(),
  }),

  create: (data) =>
    axiosInstance.post("/api/qnas", {
      title: data.title,
      content: data.content,
    }, { timeout: 120000 }),

  update: (qnaId, data) =>
    axiosInstance.patch(`/api/qnas/${qnaId}`, {
      title: data.title,
      content: data.content,
    }, { timeout: 120000 }),

  delete: (qnaId) => axiosInstance.delete(`/api/qnas/${qnaId}`),

  /** 질문 마감(본인) — POST /api/qnas/{qnaId}/close */
  close: (qnaId) => axiosInstance.post(`/api/qnas/${qnaId}/close`),
};

/* ── 관리자용 (BoardManage) ── */
// ✅ 관리자 전용 토큰(pupoo_admin_token)을 명시적으로 사용
export const adminQnaApi = {
  list: (uiPage = 1, size = 20) =>
    axiosInstance.get("/api/qnas", {
      params: { page: uiPage - 1, size },
      headers: adminAuthHeaders(),
    }),

  get: (qnaId) =>
    axiosInstance.get(`/api/qnas/${qnaId}`, { headers: adminAuthHeaders() }),

  create: (data) =>
    axiosInstance.post(
      "/api/qnas",
      { title: data.title, content: data.content },
      { headers: adminAuthHeaders() },
    ),

  update: (qnaId, data) =>
    axiosInstance.patch(
      `/api/qnas/${qnaId}`,
      { title: data.title, content: data.content },
      { headers: adminAuthHeaders() },
    ),

  delete: (qnaId) =>
    axiosInstance.delete(`/api/qnas/${qnaId}`, {
      headers: adminAuthHeaders(),
    }),

  /** 운영자 답변 등록/수정 */
  answer: (qnaId, answerContent) =>
    axiosInstance.put(
      `/api/admin/qnas/${qnaId}/answer`,
      { answerContent },
      { headers: adminAuthHeaders() },
    ),

  /** 운영자 답변 삭제 */
  clearAnswer: (qnaId) =>
    axiosInstance.delete(`/api/admin/qnas/${qnaId}/answer`, {
      headers: adminAuthHeaders(),
    }),

  /** QnA 공개(PUBLISHED) / 숨김(HIDDEN) — 관리자 */
  setVisibility: (qnaId, publicationStatus) =>
    axiosInstance.patch(
      `/api/admin/qnas/${qnaId}/visibility`,
      { publicationStatus },
      { headers: adminAuthHeaders() },
    ),
};
