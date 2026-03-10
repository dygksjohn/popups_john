import { axiosInstance } from "./axiosInstance";

export const eventApi = {
  // GET /api/events
  getEvents: (params) => axiosInstance.get("/api/events", { params }),

  // GET /api/events/{eventId}
  getEventDetail: (eventId) => axiosInstance.get(`/api/events/${eventId}`),

  // GET /api/events/closed/analytics
  getClosedAnalytics: () => axiosInstance.get("/api/events/closed/analytics"),

  // POST /api/admin/events/{eventId}/poster/generate
  generateAdminPoster: (eventId, body, config = {}) =>
    axiosInstance.post(`/api/admin/events/${eventId}/poster/generate`, body, config),

  // POST /api/admin/events/{eventId}/poster/apply
  applyAdminPoster: (eventId, body, config = {}) =>
    axiosInstance.post(`/api/admin/events/${eventId}/poster/apply`, body, config),
};
