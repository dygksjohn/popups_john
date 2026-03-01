// src/app/http/adminNotificationApi.js
import { axiosInstance } from "./axiosInstance";

function unwrap(res) {
  const body = res?.data;
  return body?.data ?? body;
}

/**
 * 관리자 알림 API (인증: ADMIN)
 * POST /api/admin/notifications/event — 이벤트 기반 알림 발행
 */
export const adminNotificationApi = {
  /**
   * 이벤트 기반 알림 발행
   * @param {{
   *   type: string,
   *   title: string,
   *   content: string,
   *   targetType: string,
   *   targetId: number,
   *   eventId: number,
   *   channels?: string[],
   *   recipientScope?: string
   * }} payload
   * @returns {Promise<void>}
   */
  publishEvent(payload) {
    const body = {
      type: payload.type,
      title: payload.title,
      content: payload.content,
      targetType: payload.targetType,
      targetId: payload.targetId,
      eventId: payload.eventId,
      channels: payload.channels ?? ["APP"],
      recipientScope: payload.recipientScope ?? "INTEREST_SUBSCRIBERS",
    };
    return axiosInstance
      .post("/api/admin/notifications/event", body)
      .then((res) => unwrap(res));
  },
};
