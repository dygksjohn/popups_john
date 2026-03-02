import { axiosInstance } from "../app/http/axiosInstance";
import { unwrapApiResponse } from "../app/http/apiResponse";

export function unwrap(res) {
  return unwrapApiResponse(res?.data);
}

export const postApi = {
  list: ({ boardId, uiPage = 1, size = 10, searchType, keyword }) =>
    axiosInstance.get("/api/posts", {
      params: {
        boardId,
        page: uiPage - 1,
        size,
        ...(searchType ? { searchType } : {}),
        ...(keyword ? { keyword } : {}),
      },
    }),
  get: (postId) => axiosInstance.get(`/api/posts/${postId}`),
  listByBoardType: (boardType, page = 0, size = 10) =>
    axiosInstance.get("/api/posts/by-board-type", {
      params: { boardType, page, size },
    }),
};
