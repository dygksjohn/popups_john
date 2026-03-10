import { axiosInstance } from "./axiosInstance";

function ensureId(name, value) {
  if (value == null || Number.isNaN(Number(value))) {
    throw new Error(`${name} is required`);
  }
}

export const aiApi = {
  // GET /api/ai/events/{eventId}/congestion/predict
  predictEventCongestion: (eventId) => {
    ensureId("predictEventCongestion: eventId", eventId);
    return axiosInstance.get(`/api/ai/events/${eventId}/congestion/predict`);
  },

  // GET /api/ai/programs/{programId}/congestion/predict
  predictProgramCongestion: (programId) => {
    ensureId("predictProgramCongestion: programId", programId);
    return axiosInstance.get(`/api/ai/programs/${programId}/congestion/predict`);
  },

  // GET /api/ai/programs/{programId}/recommendations
  getProgramRecommendations: (programId) => {
    ensureId("getProgramRecommendations: programId", programId);
    return axiosInstance.get(`/api/ai/programs/${programId}/recommendations`);
  },
};

