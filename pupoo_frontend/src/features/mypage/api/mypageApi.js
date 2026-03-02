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
      fallbackMessage: "내 이벤트 신청 내역을 불러오지 못했습니다.",
    });
  },
  getMyProgramApplies({ page = 0, size = 20 } = {}, options) {
    return apiClient.get("/api/program-applies/my", {
      ...options,
      params: { page, size },
      fallbackMessage: "프로그램 신청 내역을 불러오지 못했습니다.",
    });
  },
  deleteMe(options) {
    return apiClient.delete("/api/users/me", {
      ...options,
      fallbackMessage: "회원 탈퇴 처리에 실패했습니다.",
    });
  },
};
