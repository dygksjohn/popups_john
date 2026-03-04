// src/api/reviewApi.js
import { axiosInstance } from "../app/http/axiosInstance";

/* ── 관리자 토큰 관리 ── */
const ADMIN_TOKEN_KEY = "pupoo_admin_token";

function adminAuthHeaders() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function unwrap(res) {
  return res?.data?.data ?? res?.data ?? null;
}

/* ── 엔드포인트 자동 탐색 ── */
// 백엔드 구조에 따라 /api/admin/reviews 또는 /api/reviews 사용
let resolvedBase = null;

async function resolveBase() {
  if (resolvedBase) return resolvedBase;

  // 1순위: /api/admin/reviews
  const candidates = ["/api/admin/reviews", "/api/reviews"];

  for (const base of candidates) {
    try {
      const res = await axiosInstance.get(base, {
        params: { page: 0, size: 1 },
        headers: adminAuthHeaders(),
      });
      if (res.status === 200) {
        resolvedBase = base;
        console.log(`[reviewApi] ✅ endpoint resolved: ${base}`);
        return base;
      }
    } catch (err) {
      const status = err?.response?.status;
      // 401 = 인증 문제(엔드포인트는 존재), 200 = OK → 이 base 사용
      if (status === 401 || status === 403) {
        resolvedBase = base;
        console.log(`[reviewApi] ✅ endpoint resolved (auth issue): ${base}`);
        return base;
      }
      // 400, 404, 500 → 다음 후보
      console.log(`[reviewApi] ❌ ${base} → ${status}`);
    }
  }

  // 기본값
  resolvedBase = "/api/admin/reviews";
  console.log(`[reviewApi] ⚠ fallback: ${resolvedBase}`);
  return resolvedBase;
}

/* ── 관리자용 Review API ── */
export const adminReviewApi = {
  list: async (uiPage = 1, size = 20) => {
    const base = await resolveBase();
    return axiosInstance.get(base, {
      params: { page: uiPage - 1, size },
      headers: adminAuthHeaders(),
    });
  },

  get: async (reviewId) => {
    const base = await resolveBase();
    return axiosInstance.get(`${base}/${reviewId}`, {
      headers: adminAuthHeaders(),
    });
  },

  create: async (data) => {
    const base = await resolveBase();
    return axiosInstance.post(
      base,
      {
        eventId: data.eventId || null,
        content: data.content || "",
        rating: data.rating ?? 5,
        title: data.title || "",
      },
      { headers: adminAuthHeaders() },
    );
  },

  update: async (reviewId, data) => {
    const base = await resolveBase();
    return axiosInstance.patch(
      `${base}/${reviewId}`,
      {
        content: data.content || "",
        rating: data.rating ?? 5,
        title: data.title || "",
      },
      { headers: adminAuthHeaders() },
    );
  },

  delete: async (reviewId) => {
    const base = await resolveBase();
    return axiosInstance.delete(`${base}/${reviewId}`, {
      headers: adminAuthHeaders(),
    });
  },
};
