import { axiosInstance } from "../app/http/axiosInstance";

export function unwrap(res) {
  return res?.data?.data ?? res?.data ?? null;
}

export const qnaApi = {
  list: (uiPage = 1, size = 10) =>
    axiosInstance.get("/api/qnas", { params: { page: uiPage - 1, size } }),
  get: (qnaId) => axiosInstance.get(`/api/qnas/${qnaId}`),
};
