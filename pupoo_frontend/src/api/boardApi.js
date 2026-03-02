import { axiosInstance } from "../app/http/axiosInstance";
import { unwrapApiResponse } from "../app/http/apiResponse";

export const boardApi = {
  getBoards: (activeOnly = true) => axiosInstance.get("/api/boards", { params: { activeOnly } }),
};

export function unwrap(res) {
  return unwrapApiResponse(res?.data);
}
