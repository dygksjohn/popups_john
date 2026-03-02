// src/app/http/programApi.js
import { axiosInstance } from "./axiosInstance";

export const programApi = {
  // =========================
  // Program
  // =========================

  // GET /api/events/{eventId}/programs
  getPrograms: ({ eventId, category, page = 0, size = 10, sort } = {}) => {
    if (eventId == null) throw new Error("getPrograms: eventId is required");

    return axiosInstance.get(`/api/events/${eventId}/programs`, {
      params: {
        ...(category ? { category } : {}),
        page,
        size,
        ...(sort ? { sort } : {}),
      },
    });
  },

  // GET /api/programs/{programId}
  getProgramDetail: (programId) => {
    if (programId == null)
      throw new Error("getProgramDetail: programId is required");
    return axiosInstance.get(`/api/programs/${programId}`);
  },

  // GET /api/programs/{programId}/speakers
  getProgramSpeakers: (programId) => {
    if (programId == null)
      throw new Error("getProgramSpeakers: programId is required");
    return axiosInstance.get(`/api/programs/${programId}/speakers`);
  },

  // GET /api/programs/{programId}/speakers/{speakerId}
  getProgramSpeaker: (programId, speakerId) => {
    if (programId == null)
      throw new Error("getProgramSpeaker: programId is required");
    if (speakerId == null)
      throw new Error("getProgramSpeaker: speakerId is required");
    return axiosInstance.get(
      `/api/programs/${programId}/speakers/${speakerId}`,
    );
  },

  // =========================
  // Program Apply
  // =========================

  // GET /api/program-applies/my
  getMyProgramApplies: ({ page = 0, size = 200, sort } = {}) =>
    axiosInstance.get(`/api/program-applies/my`, {
      params: { page, size, ...(sort ? { sort } : {}) },
    }),

  // POST /api/program-applies
  createProgramApply: (payload) => {
    if (!payload || payload.programId == null) {
      throw new Error("createProgramApply: payload.programId is required");
    }
    return axiosInstance.post(`/api/program-applies`, payload);
  },

  // PATCH /api/program-applies/{id}/cancel
  cancelProgramApply: (applyId) => {
    if (applyId == null)
      throw new Error("cancelProgramApply: applyId is required");
    return axiosInstance.patch(`/api/program-applies/${applyId}/cancel`);
  },

  // GET /api/program-applies/{id}
  getProgramApply: (applyId) => {
    if (applyId == null)
      throw new Error("getProgramApply: applyId is required");
    return axiosInstance.get(`/api/program-applies/${applyId}`);
  },

  // =========================
  // Contest Vote
  // =========================

  // GET /api/programs/{programId}/votes/result
  getContestVoteResult: (programId) => {
    if (programId == null)
      throw new Error("getContestVoteResult: programId is required");
    return axiosInstance.get(`/api/programs/${programId}/votes/result`);
  },

  // POST /api/programs/{programId}/votes
  voteContest: (programId, programApplyId) => {
    if (programId == null) throw new Error("voteContest: programId is required");
    if (programApplyId == null)
      throw new Error("voteContest: programApplyId is required");

    return axiosInstance.post(
      `/api/programs/${programId}/votes`,
      { programApplyId },
      { params: { programApplyId } },
    );
  },

  // DELETE /api/programs/{programId}/votes
  cancelContestVote: (programId) => {
    if (programId == null)
      throw new Error("cancelContestVote: programId is required");
    return axiosInstance.delete(`/api/programs/${programId}/votes`);
  },
};
