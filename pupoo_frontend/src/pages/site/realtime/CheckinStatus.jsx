import PageHeader from "../components/PageHeader";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import RealtimeEventSelector from "./RealtimeEventSelector";
import { RefreshCw } from "lucide-react";
import {
  useRefresh,
  useAutoRefresh,
  SHARED_ANIM_STYLES,
} from "./useRealtimeAnimations";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { tokenStore } from "../../../app/http/tokenStore";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import MyCheckinStatusCard from "../../../components/checkin/MyCheckinStatusCard";
import ProgramCheckinProgressCard from "../../../components/checkin/ProgramCheckinProgressCard";
import MyProgramList from "../../../components/checkin/MyProgramList";

export const SERVICE_CATEGORIES = [
  { label: "통합 현황", path: "/realtime/dashboard" },
  { label: "대기 현황", path: "/realtime/waitingstatus" },
  { label: "체크인 현황", path: "/realtime/checkinstatus" },
  { label: "투표 현황", path: "/realtime/votestatus" },
];

export const SUBTITLE_MAP = {
  "/realtime/dashboard": "행사 전체 현황을 실시간으로 모니터링합니다",
  "/realtime/waitingstatus": "대기열 현황을 실시간으로 확인합니다",
  "/realtime/checkinstatus": "참가자 체크인 현황을 실시간으로 확인합니다",
  "/realtime/votestatus": "진행 중인 투표의 실시간 결과를 확인합니다",
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .ck-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .ck-root *, .ck-root *::before, .ck-root *::after { box-sizing: border-box; font-family: inherit; }

  .ck-container { max-width: 1400px; margin: 0 auto; padding: 32px 25px 64px; }
  .ck-container.with-event { padding-top: 92px; }
  .ck-container.selector-mode { padding-top: 104px; }
  .ck-page-shell { max-width: 1120px; margin: 0 auto; }

  .rt-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 0;
    line-height: 1;
  }
  .rt-live-badge.planned {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #2563eb;
    justify-content: center;
    gap: 0;
  }
  .rt-live-badge.ended {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #6b7280;
    justify-content: center;
    gap: 0;
  }
  .rt-live-badge.cancelled {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
    justify-content: center;
    gap: 0;
  }
  .rt-live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    animation: ck-pulse 1.4s ease-in-out infinite;
  }
  .rt-live-dot.placeholder {
    visibility: hidden;
    animation: none;
    width: 0;
    margin: 0;
  }
  @keyframes ck-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .ck-live-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    margin-bottom: 10px;
    gap: 12px;
  }
  .ck-live-header-left {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .ck-live-meta {
    display: none;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 13px;
    font-weight: 600;
    color: #6b7280;
  }
  .ck-live-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .ck-refresh-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.15s;
  }
  .ck-refresh-btn:hover {
    border-color: #1a4fd6;
    color: #1a4fd6;
    background: #f5f8ff;
  }
  .ck-timestamp {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  .checkin-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: none;
    margin: 0;
  }

  .ck-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 20px;
  }
  .ck-stat-card {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 13px;
    padding: 20px 22px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .ck-stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .ck-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .ck-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  .ck-two-col {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 14px;
    margin-bottom: 16px;
  }

  .ck-card {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 13px;
    padding: 22px 22px 20px;
    margin-bottom: 0;
  }
  .ck-live-count {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 600;
  }
  .ck-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid #f1f3f5;
  }
  .ck-card-title {
    font-size: 15px;
    font-weight: 700;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }
  .ck-card-title-icon {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: #eff4ff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .my-checkin-card { border-color: #dbe5f5; background: #fff; }
  .ck-my-status-title {
    font-size: 30px;
    line-height: 1.08;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #111827;
  }
  .ck-my-status-desc {
    margin-top: 6px;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 600;
    color: #6b7280;
  }
  .ck-my-checkin-grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .ck-my-checkin-item {
    border: 1px solid #e9eef5;
    border-radius: 10px;
    background: #fafcff;
    padding: 11px 12px;
  }
  .ck-my-checkin-label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
  }
  .ck-my-checkin-value {
    margin-top: 5px;
    font-size: 15px;
    line-height: 1.2;
    color: #111827;
    font-weight: 800;
  }
  .ck-status-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
  }
  .ck-status-chip-done { color: #166534; background: #ecfdf3; border-color: #bbf7d0; }
  .ck-status-chip-wait { color: #9a3412; background: #fff7ed; border-color: #fdba74; }
  .ck-status-chip-pending { color: #4b5563; background: #f3f4f6; border-color: #d1d5db; }
  .ck-status-chip-cancel { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }

  .ck-progress-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ck-progress-item {
    border: 1px solid #e9eef5;
    border-radius: 11px;
    background: #fafcff;
    padding: 12px;
  }
  .ck-progress-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: start;
  }
  .ck-progress-name {
    font-size: 14px;
    color: #111827;
    font-weight: 800;
    line-height: 1.3;
  }
  .ck-progress-time {
    margin-top: 4px;
    font-size: 12px;
    color: #6b7280;
  }
  .ck-progress-right {
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-end;
  }
  .ck-progress-val {
    font-size: 12px;
    color: #374151;
    font-weight: 700;
  }
  .ck-progress-track {
    margin-top: 10px;
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: #e5e7eb;
    overflow: hidden;
  }
  .ck-progress-fill {
    height: 100%;
    border-radius: inherit;
    background: #1a4fd6;
    transition: width 0.5s ease;
  }
  .ck-progress-meta {
    margin-top: 7px;
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
  }

  .ck-my-program-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ck-my-program-item {
    border: 1px solid #e9eef5;
    border-radius: 11px;
    background: #fff;
    padding: 12px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
  }
  .ck-my-program-title {
    font-size: 14px;
    line-height: 1.3;
    color: #111827;
    font-weight: 800;
  }
  .ck-my-program-time {
    margin-top: 4px;
    font-size: 12px;
    color: #6b7280;
  }
  .ck-my-program-meta {
    margin-top: 7px;
    font-size: 12px;
    color: #374151;
    font-weight: 600;
    line-height: 1.35;
  }
  .ck-my-program-right {
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-end;
  }
  .ck-my-program-checkin {
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
  }

  .ck-ticket-chip {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
  }

  .ck-notice {
    color: #9a3412;
    background: #fffbeb;
    border: 1px solid #fed7aa;
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 16px;
    font-size: 13px;
    font-weight: 600;
  }

  .ck-empty {
    text-align: center;
    padding: 36px 0;
    color: #9ca3af;
    font-size: 13.5px;
  }

  @media (max-width: 900px) {
    .ck-my-checkin-grid { grid-template-columns: 1fr; }
    .ck-my-program-item { grid-template-columns: 1fr; }
    .ck-my-program-right {
      align-items: flex-start;
      text-align: left;
    }
    .ck-progress-top { grid-template-columns: 1fr; }
    .ck-progress-right {
      align-items: flex-start;
      text-align: left;
    }
  }
  @media (max-width: 640px) {
    .ck-container { padding: 20px 16px 48px; }
    .ck-container.with-event { padding-top: 80px; }
    .ck-container.selector-mode { padding-top: 88px; }
    .ck-card { padding: 20px 16px; }
    .ck-card-header { flex-wrap: wrap; gap: 8px; }
    .ck-my-status-title { font-size: 24px; }
  }
`;

const unwrapData = (response, fallback) => response?.data?.data ?? response?.data ?? fallback;

const toArray = (payload) =>
  Array.isArray(payload?.content)
    ? payload.content
    : Array.isArray(payload)
      ? payload
      : [];

const toValidDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isUnauthorizedError = (error) => {
  const status = Number(error?.response?.status);
  return status === 401 || status === 403;
};

const getAdminAccessToken = () => {
  try {
    return localStorage.getItem("pupoo_admin_token");
  } catch {
    return null;
  }
};

const getUserAccessToken = () => {
  try {
    return tokenStore.getAccess();
  } catch {
    return null;
  }
};

const parseJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = payloadBase64.padEnd(
      payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
      "=",
    );
    const payloadJson = atob(paddedBase64);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
};

const isExpiredAccessToken = (token) => {
  const payload = parseJwtPayload(token);
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp)) return false;
  return exp * 1000 <= Date.now() + 1000;
};

const hasUsableUserAccessToken = () => {
  const accessToken = getUserAccessToken();
  if (!accessToken) return false;
  return !isExpiredAccessToken(accessToken);
};

const formatTimestamp = (value) => {
  const date = toValidDate(value);
  if (!date) return "--:--:--";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const formatTime = (value) => {
  const date = toValidDate(value);
  if (!date) return "-";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const normalizeApplyState = (apply) => {
  const status = String(apply?.status ?? "").toUpperCase();
  if (apply?.checkedInAt || status === "CHECKED_IN") return "done";
  if (status === "CANCELLED" || status === "REJECTED" || status === "CANCELED") return "no";
  return "wait";
};

const MY_STATUS = {
  WAITING: "WAITING",
  CHECKED_IN: "CHECKED_IN",
  NOT_STARTED: "NOT_STARTED",
  CANCELED: "CANCELED",
  PENDING: "PENDING",
};

const resolveMyProgramStatus = (apply, program) => {
  const status = String(apply?.status ?? "").toUpperCase();
  if (apply?.checkedInAt || status === "CHECKED_IN") return MY_STATUS.CHECKED_IN;
  if (status === "CANCELLED" || status === "REJECTED" || status === "CANCELED") {
    return MY_STATUS.CANCELED;
  }

  const now = Date.now();
  const startAt = toValidDate(program?.startAt)?.getTime() ?? null;
  if (startAt && now < startAt) return MY_STATUS.NOT_STARTED;

  return MY_STATUS.WAITING;
};

const buildDisplayName = (apply) => {
  const owner = String(apply?.ownerNickname ?? "").trim();
  const pet = String(apply?.petName ?? "").trim();

  if (owner && pet) return `${owner} / ${pet}`;
  if (owner) return owner;
  if (pet) return pet;
  if (apply?.userId != null) return `사용자 ${apply.userId}`;
  if (apply?.programApplyId != null) return `신청 #${apply.programApplyId}`;
  return "참가자";
};

const formatProgramTimeRange = (startAt, endAt) => {
  const start = formatTime(startAt);
  const end = formatTime(endAt);
  if (start === "-" && end === "-") return "운영 시간 정보 없음";
  if (start !== "-" && end !== "-") return `${start} ~ ${end}`;
  return start !== "-" ? `${start} 시작` : `${end} 종료`;
};

const buildMyPrograms = (programs, programApplies) => {
  const programById = new Map(
    programs.map((program) => [Number(program?.programId), program]),
  );

  return programApplies
    .map((apply) => {
      const program = programById.get(Number(apply?.programId));
      const status = resolveMyProgramStatus(apply, program);
      const checkedInAt = apply?.checkedInAt ?? null;
      const createdAt = apply?.createdAt ?? null;
      const startAt = program?.startAt ?? null;
      const endAt = program?.endAt ?? null;

      return {
        programApplyId: apply?.programApplyId ?? null,
        programId: Number(apply?.programId),
        programName:
          program?.programTitle || program?.name || `프로그램 ${apply?.programId ?? "-"}`,
        time: formatProgramTimeRange(startAt, endAt),
        status,
        requestNo: apply?.ticketNo || `PA-${apply?.programApplyId ?? "-"}`,
        participantName: buildDisplayName(apply),
        checkedInTimeText: formatTime(checkedInAt),
        checkedInAt,
        createdAt,
        startAt,
      };
    })
    .sort((left, right) => {
      const statusPriority = {
        [MY_STATUS.WAITING]: 0,
        [MY_STATUS.NOT_STARTED]: 1,
        [MY_STATUS.CHECKED_IN]: 2,
        [MY_STATUS.CANCELED]: 3,
      };
      const leftPriority = statusPriority[left.status] ?? 3;
      const rightPriority = statusPriority[right.status] ?? 3;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;

      const leftStart = toValidDate(left.startAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightStart = toValidDate(right.startAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (leftStart !== rightStart) return leftStart - rightStart;

      const leftCreated = toValidDate(left.createdAt)?.getTime() ?? 0;
      const rightCreated = toValidDate(right.createdAt)?.getTime() ?? 0;
      if (leftCreated !== rightCreated) return rightCreated - leftCreated;

      return String(left.programName).localeCompare(String(right.programName), "ko-KR");
    });
};

const estimateCheckinTime = (position) => {
  if (!Number.isFinite(position) || position <= 0) return "집계 중";

  const estimated = new Date(Date.now() + Math.max(position - 1, 0) * 2 * 60 * 1000);
  return formatTime(estimated);
};

const buildProgramCheckinStats = (programApplies, myPrograms) => {
  const checkedIn = programApplies.filter((apply) => normalizeApplyState(apply) === "done").length;
  const waitingApplies = programApplies.filter((apply) => normalizeApplyState(apply) === "wait");
  const waiting = waitingApplies.length;
  const totalApply = programApplies.length;

  const waitingQueue = waitingApplies
    .map((apply) => ({
      programApplyId: apply?.programApplyId ?? null,
      createdAtMs: toValidDate(apply?.createdAt)?.getTime() ?? 0,
    }))
    .sort((left, right) => {
      if (left.createdAtMs !== right.createdAtMs) return left.createdAtMs - right.createdAtMs;
      return Number(left.programApplyId ?? 0) - Number(right.programApplyId ?? 0);
    });

  const myWaitingApplyIds = myPrograms
    .filter((item) => item.status === MY_STATUS.WAITING)
    .map((item) => Number(item.programApplyId))
    .filter(Number.isFinite);

  let myPosition = null;
  myWaitingApplyIds.forEach((applyId) => {
    const queueIndex = waitingQueue.findIndex(
      (queueItem) => Number(queueItem.programApplyId) === applyId,
    );
    if (queueIndex >= 0) {
      const position = queueIndex + 1;
      myPosition = myPosition == null ? position : Math.min(myPosition, position);
    }
  });

  return {
    totalApply,
    checkedIn,
    waiting,
    myPosition,
    estimatedCheckinTime: estimateCheckinTime(myPosition),
  };
};

const pickPrimaryProgram = (myPrograms) => {
  if (!myPrograms.length) return null;
  return (
    myPrograms.find((item) => item.status === MY_STATUS.WAITING) ||
    myPrograms.find((item) => item.status === MY_STATUS.NOT_STARTED) ||
    myPrograms.find((item) => item.status === MY_STATUS.CHECKED_IN) ||
    myPrograms[0]
  );
};

const buildMyCheckin = (primaryProgram, stats) => {
  if (!primaryProgram) return null;

  const isWaiting = primaryProgram.status === MY_STATUS.WAITING;
  const myPosition = isWaiting ? Number(stats?.myPosition ?? 0) : 0;
  const waitingCount = isWaiting ? Math.max(myPosition - 1, 0) : 0;
  const estimatedCheckinTime = isWaiting
    ? stats?.estimatedCheckinTime || "집계 중"
    : primaryProgram.status === MY_STATUS.CHECKED_IN
      ? primaryProgram.checkedInTimeText
      : "-";

  return {
    programName: primaryProgram.programName,
    programTime: primaryProgram.time,
    status: primaryProgram.status,
    myPosition,
    waitingCount,
    estimatedCheckinTime,
  };
};

const buildProgramCheckinStatus = (primaryProgram, stats) => {
  if (!primaryProgram) return null;
  return {
    programName: primaryProgram.programName,
    totalApply: Number(stats?.totalApply ?? 0),
    checkedIn: Number(stats?.checkedIn ?? 0),
    waiting: Number(stats?.waiting ?? 0),
  };
};

async function fetchAllProgramApplies(programId, pageSize = 200, maxPages = 100) {
  if (!programId) return [];

  const fallbackPublicCandidates = async () => {
    const rows = [];
    let page = 0;
    let isLast = false;

    while (!isLast && page < maxPages) {
      const response = await programApi.getCandidates(programId, {
        page,
        size: pageSize,
      });

      const payload = unwrapData(response, {});
      rows.push(...toArray(payload));

      const totalPages = Number(payload?.totalPages ?? 1);
      isLast = Boolean(payload?.last) || page + 1 >= totalPages;
      page += 1;
    }

    return rows;
  };

  if (!getAdminAccessToken()) {
    return fallbackPublicCandidates();
  }

  const rows = [];
  let page = 0;
  let isLast = false;

  try {
    while (!isLast && page < maxPages) {
      const response = await axiosInstance.get(
        `/api/admin/dashboard/programs/${programId}/applies`,
        {
          params: { page, size: pageSize },
        },
      );

      const payload = unwrapData(response, {});
      rows.push(...toArray(payload));

      const totalPages = Number(payload?.totalPages ?? 1);
      isLast = Boolean(payload?.last) || page + 1 >= totalPages;
      page += 1;
    }

    return rows;
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      throw error;
    }
    return fallbackPublicCandidates();
  }
}

async function fetchAllMyProgramApplies(pageSize = 200, maxPages = 100) {
  const rows = [];
  let page = 0;
  let isLast = false;

  while (!isLast && page < maxPages) {
    const response = await programApi.getMyProgramApplies({
      page,
      size: pageSize,
      sort: "createdAt,desc",
    });

    const payload = unwrapData(response, {});
    rows.push(...toArray(payload));

    const totalPages = Number(payload?.totalPages ?? 1);
    isLast = Boolean(payload?.last) || page + 1 >= totalPages;
    page += 1;
  }

  return rows;
}

async function fetchProgramsByEvent(eventId) {
  if (!getAdminAccessToken()) {
    return programApi.getAllProgramsByEvent({
      eventId,
      pageSize: 200,
      sort: "startAt,asc",
    });
  }

  try {
    const adminResponse = await axiosInstance.get(
      `/api/admin/dashboard/events/${eventId}/programs`,
    );
    return toArray(unwrapData(adminResponse, []));
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      throw error;
    }
    return programApi.getAllProgramsByEvent({
      eventId,
      pageSize: 200,
      sort: "startAt,asc",
    });
  }
}

function CheckinContent({ eventId }) {
  const numericEventId = Number(eventId);
  const { tick } = useAutoRefresh(15000);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [eventDetail, setEventDetail] = useState(null);
  const [myPrograms, setMyPrograms] = useState([]);
  const [myCheckin, setMyCheckin] = useState(null);
  const [programCheckinStatus, setProgramCheckinStatus] = useState(null);
  const [lastLoadedAt, setLastLoadedAt] = useState(new Date());
  const statusBadge = useMemo(() => {
    const status = String(eventDetail?.status ?? "").toUpperCase();
    if (status === "PLANNED" || status === "PENDING" || status === "UPCOMING") {
      return { className: "planned", label: "예정", showDot: false };
    }
    if (status === "ENDED") {
      return { className: "ended", label: "종료", showDot: false };
    }
    if (status === "CANCELLED") {
      return { className: "cancelled", label: "취소", showDot: false };
    }
    return { className: "", label: "LIVE", showDot: true };
  }, [eventDetail?.status]);

  const loadData = useCallback(
    async ({ preserveLoading = false } = {}) => {
      if (!numericEventId || Number.isNaN(numericEventId)) {
        setErrorMsg("잘못된 행사 경로입니다.");
        setMyPrograms([]);
        setMyCheckin(null);
        setProgramCheckinStatus(null);
        setLoading(false);
        return;
      }

      if (!preserveLoading) setLoading(true);

      try {
        const [eventResponse, programsResponse] = await Promise.all([
          eventApi.getEventDetail(numericEventId),
          fetchProgramsByEvent(numericEventId),
        ]);
        let myProgramApplies = [];
        let myProgramNotice = "";
        if (!hasUsableUserAccessToken()) {
          myProgramNotice = "로그인하면 내 체크인 상태를 바로 확인할 수 있습니다.";
        } else {
          try {
            myProgramApplies = await fetchAllMyProgramApplies();
          } catch (myProgramError) {
            if (isUnauthorizedError(myProgramError)) {
              myProgramNotice = "로그인하면 내 체크인 상태를 바로 확인할 수 있습니다.";
            } else {
              myProgramNotice = "내 체크인 데이터를 일부 불러오지 못했습니다.";
            }
          }
        }

        const eventPayload = unwrapData(eventResponse, null);
        const programs = toArray(programsResponse);
        const eventProgramIds = new Set(
          programs.map((program) => Number(program?.programId)).filter(Number.isFinite),
        );
        const filteredMyApplies = toArray(myProgramApplies).filter((apply) =>
          eventProgramIds.has(Number(apply?.programId)),
        );

        const nextMyPrograms = buildMyPrograms(programs, filteredMyApplies);
        const myProgramMap = new Map();
        nextMyPrograms.forEach((programItem) => {
          const key = Number(programItem.programId);
          if (!Number.isFinite(key)) return;
          if (!myProgramMap.has(key)) myProgramMap.set(key, []);
          myProgramMap.get(key).push(programItem);
        });

        const programStatsEntries = await Promise.all(
          [...myProgramMap.keys()].map(async (programId) => {
            const myProgramsInProgram = myProgramMap.get(programId) || [];
            const programApplies = await fetchAllProgramApplies(programId);
            const stats = buildProgramCheckinStats(programApplies, myProgramsInProgram);
            return [programId, stats];
          }),
        );

        const programStatsMap = new Map(programStatsEntries);
        const primaryProgram = pickPrimaryProgram(nextMyPrograms);
        const primaryStats = primaryProgram
          ? programStatsMap.get(Number(primaryProgram.programId))
          : null;
        const nextMyCheckin = buildMyCheckin(primaryProgram, primaryStats);
        const nextProgramCheckinStatus = buildProgramCheckinStatus(primaryProgram, primaryStats);

        setEventDetail(eventPayload);
        setMyPrograms(nextMyPrograms);
        setMyCheckin(nextMyCheckin);
        setProgramCheckinStatus(nextProgramCheckinStatus);
        setErrorMsg(myProgramNotice);
        setLastLoadedAt(new Date());
      } catch (error) {
        console.error("[Realtime Checkin] load failed:", error);
        setMyPrograms([]);
        setMyCheckin(null);
        setProgramCheckinStatus(null);
        setEventDetail(null);
        if (isUnauthorizedError(error)) {
          setErrorMsg("체크인 정보를 불러오려면 로그인 상태를 확인해 주세요.");
        } else {
          setErrorMsg("체크인 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (!preserveLoading) setLoading(false);
      }
    },
    [numericEventId],
  );

  const { spinning, refresh } = useRefresh(() => {
    loadData({ preserveLoading: true });
  }, 800);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading) {
      loadData({ preserveLoading: true });
    }
  }, [tick, loadData, loading]);

  if (loading && !eventDetail) {
    return (
      <div className="ck-card">
        <div className="ck-empty">체크인 데이터를 불러오는 중입니다.</div>
      </div>
    );
  }

  return (
    <>
      <div className="ck-page-shell">
        <div className="ck-live-header">
          <div className="ck-live-header-left">
            <div className={`rt-live-badge ${statusBadge.className} anim-glow`.trim()}>
              <div className={`rt-live-dot${statusBadge.showDot ? "" : " placeholder"}`} />
              {statusBadge.label}
            </div>
          </div>

          <div className="ck-live-header-right">
            <span className="ck-timestamp">마지막 갱신: {formatTimestamp(lastLoadedAt)}</span>
            <button className="ck-refresh-btn" onClick={refresh} title="새로고침">
              <RefreshCw
                size={14}
                style={{
                  animation: spinning ? "anim-spin 0.8s cubic-bezier(0.4,0,0.2,1)" : "none",
                }}
              />
            </button>
          </div>
        </div>

        {errorMsg ? <div className="ck-notice">{errorMsg}</div> : null}

        <div className="checkin-page">
          <MyCheckinStatusCard myCheckin={myCheckin} />
          <ProgramCheckinProgressCard
            programCheckinStatus={programCheckinStatus}
            loading={loading}
          />
          <MyProgramList myPrograms={myPrograms} loading={loading} />
        </div>
      </div>
    </>
  );
}

export default function CheckinStatus() {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = useMemo(() => {
    if (location.pathname.startsWith("/realtime/dashboard")) return "/realtime/dashboard";
    if (location.pathname.startsWith("/realtime/waitingstatus")) return "/realtime/waitingstatus";
    if (location.pathname.startsWith("/realtime/votestatus")) return "/realtime/votestatus";
    return "/realtime/checkinstatus";
  }, [location.pathname]);

  const handleSelectEvent = (id) => {
    navigate(`/realtime/checkinstatus/${id}`);
  };

  const handleNavigate = (path) => {
    if (!eventId) {
      navigate(path);
      return;
    }

    const match = String(path || "").match(/^([^?#]*)(.*)$/);
    const pathname = (match?.[1] || "").replace(/\/+$/, "");
    const suffix = match?.[2] || "";
    const lastSegment = pathname.split("/").filter(Boolean).at(-1);

    if (lastSegment && /^\d+$/.test(lastSegment)) {
      navigate(`${pathname}${suffix}`);
      return;
    }

    navigate(`${pathname}/${eventId}${suffix}`);
  };

  return (
    <div className="ck-root">
      <style>{styles}</style>
      <style>{SHARED_ANIM_STYLES}</style>
      {eventId ? (
        <PageHeader
          title={null}
          subtitle={null}
          categories={SERVICE_CATEGORIES}
          stickyCategories
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
      ) : null}

      <main className={`ck-container${eventId ? " with-event" : " selector-mode"}`}>
        {eventId ? (
          <CheckinContent eventId={eventId} />
        ) : (
          <RealtimeEventSelector onSelectEvent={handleSelectEvent} pageTitle="체크인 현황" />
        )}
      </main>
    </div>
  );
}
