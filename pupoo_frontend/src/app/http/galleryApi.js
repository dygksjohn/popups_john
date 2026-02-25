import { axiosInstance } from "./axiosInstance";

export const galleryApi = {
  // GET /api/galleries?page=0&size=10 — 갤러리 목록(페이징)
  list: (page = 0, size = 10) =>
    axiosInstance.get("/api/galleries", { params: { page, size } }),

  // POST /api/galleries — 갤러리 생성
  create: (body) => {
    if (!body || body.eventId == null) {
      throw new Error("galleryApi.create: eventId is required");
    }
    if (!body.title || String(body.title).trim() === "") {
      throw new Error("galleryApi.create: title is required");
    }
    return axiosInstance.post("/api/galleries", {
      eventId: body.eventId,
      title: body.title.trim(),
      ...(body.description != null && { description: body.description }),
      ...(Array.isArray(body.imageUrls) && body.imageUrls.length > 0 && { imageUrls: body.imageUrls }),
    });
  },
};