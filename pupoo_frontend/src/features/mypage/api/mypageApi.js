import { userApi } from "../../user/api/userApi";
import { petApi } from "../../pet/api/petApi";
import { apiClient } from "../../shared/api/apiClient";

export const mypageApi = {
  getMe: userApi.getMe,
  updateMe: userApi.updateMe,
  getMyPets: petApi.getMyPets,
  createPet: petApi.createPet,
  updatePet: petApi.updatePet,
  deletePet: petApi.deletePet,
  issueMyQr(eventId, options) {
    return apiClient.get("/api/qr/me", {
      ...options,
      params: { eventId },
      fallbackMessage: "QR 발급에 실패했습니다.",
    });
  },
  getMyEventRegistrations({ page = 0, size = 20 } = {}, options) {
    return apiClient.get("/api/users/me/event-registrations", {
      ...options,
      params: { page, size },
      fallbackMessage: "신청 행사 목록을 불러오지 못했습니다.",
    });
  },
};
