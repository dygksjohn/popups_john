import PageHeader from "../components/PageHeader";
import PageLoading from "../components/PageLoading";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RealtimeEventSelector from "./RealtimeEventSelector";
import {
  RefreshCw,
  ClipboardCheck,
  ArrowLeft,
  CalendarDays,
  MapPin,
  UserCheck,
  Users,
  CheckCircle,
  Clock,
} from "lucide-react";
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
  { label: "전체 행사", path: "/realtime/checkinstatus", countKey: "all" },
  { label: "진행중 행사", path: "/realtime/checkinstatus?status=live", countKey: "live" },
  { label: "예정 행사", path: "/realtime/checkinstatus?status=upcoming", countKey: "upcoming" },
  { label: "종료 행사", path: "/realtime/checkinstatus?status=ended", countKey: "ended" },
];

export const SUBTITLE_MAP = {
  "/realtime/dashboard": "행사 전체 현황을 실시간으로 모니터링합니다",
  "/realtime/waitingstatus": "대기열 현황을 실시간으로 확인합니다",
  "/realtime/checkinstatus": "참가자 체크인 현황을 실시간으로 확인합니다",
  "/realtime/votestatus": "진행 중인 투표의 실시간 결과를 확인합니다",
};

const formatDateRange = (startAt, endAt) => {
  const fmt = (v) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}` : null; };
  const s = fmt(startAt), e = fmt(endAt);
  if (s && e) return `${s} ~ ${e}`;
  return s || e || "일정 정보 없음";
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .ck-root { box-sizing: border-box; font-family: 'Pretendard Variable','Pretendard',-apple-system,sans-serif; background: #f0f4fa; min-height: 100vh; flex: 1; }
  .ck-root *, .ck-root *::before, .ck-root *::after { box-sizing: border-box; font-family: inherit; }
  .ck-container { max-width: 1400px; margin: 0 auto; padding: 20px 0 64px; }
  .ck-container.selector-mode { padding-top: 32px; }
  .ck-page-shell { max-width: 1400px; margin: 0 auto; }

  .ck-back-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; border-radius: 12px;
    border: 1.5px solid #111827; background: #111827; color: #fff;
    font-size: 16px; font-weight: 700; cursor: pointer;
    transition: all 0.15s; margin-bottom: 20px; font-family: inherit; letter-spacing: -0.01em;
  }
  .ck-back-btn:hover { background: #1f2937; border-color: #1f2937; }
  .ck-back-btn:active { transform: scale(0.97); }

  /* ── 히어로 ── */
  .ck-hero {
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 40px 44px;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #fff 0%, #fafbff 100%);
    color: #111827;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }
  .ck-hero::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, #6366f1, #a78bfa, #6366f1);
    background-size: 200% 100%;
    animation: ck-hero-bar 3s ease infinite;
  }
  @keyframes ck-hero-bar {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .ck-hero-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
  }
  .ck-hero-main { min-width: 0; flex: 1 1 auto; }
  .ck-hero-title-row { display: flex; align-items: center; gap: 12px; }
  .ck-hero-title { margin: 0; font-size: 32px; line-height: 1.15; letter-spacing: -0.03em; font-weight: 900; color: #111827; }
  .ck-hero-meta { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 16px; font-size: 15px; color: #9ca3af; }
  .ck-hero-meta-item { display: inline-flex; align-items: center; gap: 5px; }
  .ck-hero-divider { margin: 16px 0; border: none; border-top: 1px solid #f0f0f0; }
  .ck-hero-checkin-line { display: flex; align-items: center; gap: 10px; font-size: 15px; color: #9ca3af; font-weight: 500; }
  .ck-hero-checkin-line strong { font-weight: 800; color: #111827; font-size: 16px; }
  .ck-hero-checkin-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: #6366f1; box-shadow: 0 0 6px rgba(99,102,241,0.4);
    animation: ck-pulse 1.6s ease-in-out infinite; flex-shrink: 0;
  }

  .ck-hero-kpi-grid {
    margin-top: 0;
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px; width: min(760px, 100%); margin-left: auto; flex-shrink: 0;
  }
  .ck-hero-kpi {
    border: 1px solid #ebebeb; border-radius: 16px;
    background: #fff; padding: 24px 26px;
  }
  .ck-hero-kpi-label { font-size: 14px; color: #6b7280; font-weight: 700; margin-bottom: 12px; }
  .ck-hero-kpi-row { display: flex; align-items: baseline; gap: 4px; }
  .ck-hero-kpi-value { font-size: 38px; line-height: 1; font-weight: 900; color: #111827; letter-spacing: -0.02em; }
  .ck-hero-kpi-unit { font-size: 18px; color: #9ca3af; font-weight: 700; }
  .ck-hero-kpi-bar { margin-top: 14px; height: 10px; border-radius: 99px; background: #f0f0f0; overflow: hidden; }
  .ck-hero-kpi-bar-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
  .ck-hero-kpi-sub { margin-top: 12px; font-size: 13px; color: #6b7280; line-height: 1.5; font-weight: 600; word-break: keep-all; }
  .ck-hero-footer {
    display: flex; align-items: center; justify-content: flex-end;
    gap: 10px; margin-top: 20px; padding-top: 14px; border-top: 1px solid #f0f0f0;
  }
  .ck-timestamp { font-size: 14px; color: #9ca3af; font-weight: 500; font-variant-numeric: tabular-nums; }
  .ck-refresh-btn {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1px solid #e2e8f0; background: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6b7280; transition: all 0.15s;
  }
  .ck-refresh-btn:hover { border-color: #02A17E; color: #02A17E; background: #f5f8ff; }
  .ck-refresh-btn:active { transform: scale(0.93); }

  .ck-status-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 14px; border-radius: 999px; font-size: 13px; font-weight: 700;
  }
  .ck-status-chip-active { background: #ecfdf3; color: #166534; border: 1px solid #bbf7d0; }
  .ck-status-chip-active .ck-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: ck-pulse 1.6s ease-in-out infinite; }
  .ck-status-chip-ended { background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }
  .ck-status-chip-planned { background: #E6F7F2; color: #02A17E; border: 1px solid #CCF0E4; }
  @keyframes ck-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .5; transform: scale(.75); } }

  /* ── 카드 ── */
  .ck-card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
    padding: 28px 32px; margin-bottom: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  }
  .ck-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0;
  }
  .ck-card-title {
    font-size: 18px; font-weight: 800; color: #111827;
    display: flex; align-items: center; gap: 10px; margin: 0;
  }
  .ck-card-title-icon {
    width: 32px; height: 32px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .ck-card-tag { font-size: 13px; color: #9ca3af; font-weight: 600; }

  /* ── 내 체크인 ── */
  .ck-my-status-title { font-size: 24px; font-weight: 900; color: #111827; letter-spacing: -0.02em; }
  .ck-my-status-desc { margin-top: 6px; font-size: 15px; color: #9ca3af; font-weight: 500; }
  .ck-my-checkin-grid { margin-top: 18px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .ck-my-checkin-item {
    border: 1px solid #eef0f4; border-radius: 14px; background: #fafbfc;
    padding: 18px 20px; transition: all 0.15s;
  }
  .ck-my-checkin-item:hover { border-color: #e2e5ea; background: #f3f4f6; }
  .ck-my-checkin-label { font-size: 13px; font-weight: 600; color: #9ca3af; }
  .ck-my-checkin-value { margin-top: 8px; font-size: 22px; color: #111827; font-weight: 900; }

  .ck-status-chip-done { color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; }
  .ck-status-chip-wait { color: #ea580c; background: #fff7ed; border: 1px solid #fdba74; }
  .ck-status-chip-pending { color: #6b7280; background: #f3f4f6; border: 1px solid #e5e7eb; }
  .ck-status-chip-cancel { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; }

  /* ── 진행률 ── */
  .ck-progress-list { display: flex; flex-direction: column; gap: 14px; }
  .ck-progress-item {
    border: 1px solid #eef0f4; border-radius: 14px; background: #fafbfc;
    padding: 22px 24px; transition: all 0.15s;
  }
  .ck-progress-item:hover { border-color: #e2e5ea; }
  .ck-progress-name { font-size: 17px; color: #111827; font-weight: 800; }
  .ck-progress-meta { font-size: 14px; color: #9ca3af; font-weight: 500; margin-top: 4px; }
  .ck-progress-track { margin-top: 16px; width: 100%; height: 10px; border-radius: 999px; background: #f0f0f0; overflow: hidden; }
  .ck-progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #6366f1, #818cf8); transition: width 0.5s ease; }
  .ck-progress-val { margin-top: 10px; font-size: 22px; color: #111827; font-weight: 900; letter-spacing: -0.02em; }
  .ck-live-count { font-size: 14px; color: #6366f1; font-weight: 700; }

  /* ── 프로그램 목록 ── */
  .ck-my-program-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; list-style: none; padding: 0; margin: 0; }
  .ck-my-program-item {
    border: 1px solid #eef0f4; border-radius: 14px; background: #fff;
    padding: 20px 22px; display: flex; flex-direction: column; gap: 10px;
    transition: all 0.2s ease; position: relative; overflow: hidden;
  }
  .ck-my-program-item::before {
    content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  }
  .ck-my-program-item:has(.ck-status-chip-done)::before { background: #059669; }
  .ck-my-program-item:has(.ck-status-chip-wait)::before { background: #ea580c; }
  .ck-my-program-item:has(.ck-status-chip-pending)::before { background: #d1d5db; }
  .ck-my-program-item:has(.ck-status-chip-cancel)::before { background: #dc2626; }
  .ck-my-program-item:hover { border-color: #d1d5db; box-shadow: 0 4px 16px rgba(0,0,0,0.05); transform: translateY(-2px); }
  .ck-my-program-title { font-size: 16px; color: #111827; font-weight: 800; margin: 0; }
  .ck-my-program-time { font-size: 13px; color: #9ca3af; font-weight: 500; }
  .ck-my-program-meta { font-size: 14px; color: #374151; font-weight: 600; }
  .ck-my-program-right { display: flex; align-items: center; justify-content: flex-start; margin-top: auto; padding-top: 12px; border-top: 1px solid #f0f0f0; }

  .ck-notice {
    display: flex; align-items: center; gap: 10px;
    color: #374151; background: linear-gradient(135deg, #f8fafc 0%, #E6F7F2 100%);
    border: 1px solid #e2e8f0; border-radius: 14px;
    padding: 16px 20px; margin-bottom: 18px; font-size: 14px; font-weight: 600; line-height: 1.4;
  }
  .ck-notice::before {
    content: "ℹ"; display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 8px;
    background: #02A17E; color: #fff; font-size: 14px; font-weight: 800; flex-shrink: 0;
  }
  .ck-empty { text-align: center; padding: 44px 0; color: #c5c9cf; font-size: 14px; font-weight: 500; }

  @media (max-width: 900px) {
    .ck-hero-top { flex-direction: column; align-items: flex-start; }
    .ck-hero-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; margin-left: 0; margin-top: 14px; }
    .ck-hero { padding: 28px 24px; }
    .ck-hero-title { font-size: 26px; }
    .ck-card { padding: 24px 22px; }
    .ck-my-checkin-grid { grid-template-columns: 1fr; }
    .ck-my-program-list { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .ck-container { padding: 20px 16px 48px; }
    .ck-hero { padding: 22px 18px; }
    .ck-hero-title { font-size: 22px; }
    .ck-hero-kpi-grid { grid-template-columns: 1fr; width: 100%; margin-left: 0; margin-top: 14px; }
    .ck-hero-kpi-value { font-size: 26px; }
    .ck-card { padding: 22px 18px; }
    .ck-my-program-list { grid-template-columns: 1fr; }
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

  const STATUS_TEXT = { WAITING: "대기 중", CHECKED_IN: "체크인 완료", NOT_STARTED: "운영 전", CANCELED: "참여 취소", PENDING: "집계 중" };
  const STATUS_TONE = { WAITING: "wait", CHECKED_IN: "done", NOT_STARTED: "pending", CANCELED: "cancel", PENDING: "pending" };
  const STATUS_LABEL_MAP = { WAITING: "체크인 대기", NOT_STARTED: "시작 전", CHECKED_IN: "체크인 완료", CANCELED: "참여 취소", PENDING: "집계 중" };

  const eventName = eventDetail?.eventName || "행사 정보 없음";
  const rawStatus = String(eventDetail?.status ?? "").toUpperCase();
  const isActive = rawStatus === "ONGOING";
  const isEnded = rawStatus === "ENDED" || rawStatus === "CANCELLED";
  const badgeClass = isActive ? "ck-status-chip-active" : isEnded ? "ck-status-chip-ended" : "ck-status-chip-planned";
  const badgeLabel = isActive ? "진행 중" : isEnded ? "종료" : "예정";

  // KPI data
  const totalApplied = myPrograms.reduce((s, p) => s + 1, 0);
  const checkedCount = myPrograms.filter(p => String(p.status).toUpperCase() === "CHECKED_IN").length;
  const waitingCount = myPrograms.filter(p => String(p.status).toUpperCase() === "WAITING").length;
  const checkinRate = totalApplied > 0 ? Math.round((checkedCount / totalApplied) * 100) : 0;

  // Program progress
  const hasProgCheckin = Boolean(programCheckinStatus?.programName);
  const progCheckedIn = Number(programCheckinStatus?.checkedIn) || 0;
  const progWaiting = Number(programCheckinStatus?.waiting) || 0;
  const progTotal = Math.max(Number(programCheckinStatus?.totalApply) || 0, progCheckedIn + progWaiting);
  const progRate = progTotal > 0 ? Math.round((progCheckedIn / progTotal) * 100) : 0;

  const heroKpis = [
    { label: "신청", value: totalApplied, unit: "건", barValue: Math.min(100, totalApplied * 10), barColor: "#6366f1", sub: "참여 예정" },
    { label: "완료", value: checkedCount, unit: "건", barValue: checkinRate, barColor: "#059669", sub: `${checkinRate}%` },
    { label: "대기", value: waitingCount, unit: "건", barValue: totalApplied > 0 ? Math.round((waitingCount / totalApplied) * 100) : 0, barColor: "#d97706", sub: "대기 중" },
    { label: "진행률", value: progRate, unit: "%", barValue: progRate, barColor: "#6366f1", sub: hasProgCheckin ? programCheckinStatus.programName : "-" },
  ];

  if (loading && !eventDetail) {
    return <PageLoading message="체크인현황을 불러오는 중입니다" />;
  }

  return (
    <>
      <div className="ck-page-shell">
        {errorMsg ? <div className="ck-notice">{errorMsg}</div> : null}

        {/* ── 히어로 카드 ── */}
        <section className="ck-hero">
          <div className="ck-hero-top">
            <div className="ck-hero-main">
              <div className="ck-hero-title-row">
                <h1 className="ck-hero-title">{eventName}</h1>
                <div className={`ck-status-chip ${badgeClass}`}>
                  {isActive && <span className="ck-status-dot" />}
                  {badgeLabel}
                </div>
              </div>
              <div className="ck-hero-meta">
                <span className="ck-hero-meta-item"><CalendarDays size={14} />{formatDateRange(eventDetail?.startAt, eventDetail?.endAt)}</span>
                <span className="ck-hero-meta-item"><MapPin size={14} />{eventDetail?.location || "장소 정보 없음"}</span>
              </div>
              <hr className="ck-hero-divider" />
              <div className="ck-hero-checkin-line">
                <span className="ck-hero-checkin-dot" />
                체크인 완료 <strong>{checkedCount}</strong>건 / 총 <strong>{totalApplied}</strong>건
              </div>
            </div>
            <div className="ck-hero-kpi-grid">
              {heroKpis.map((item) => (
                <div key={item.label} className="ck-hero-kpi">
                  <div className="ck-hero-kpi-label">{item.label}</div>
                  <div className="ck-hero-kpi-row">
                    <span className="ck-hero-kpi-value">{item.value}</span>
                    <span className="ck-hero-kpi-unit">{item.unit}</span>
                  </div>
                  <div className="ck-hero-kpi-bar">
                    <div className="ck-hero-kpi-bar-fill" style={{ width: `${item.barValue}%`, background: item.barColor }} />
                  </div>
                  <div className="ck-hero-kpi-sub">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="ck-hero-footer">
            <span className="ck-timestamp" style={{ marginLeft: "auto" }}>마지막 갱신: {formatTimestamp(lastLoadedAt)}</span>
            <button className="ck-refresh-btn" onClick={refresh} title="새로고침">
              <RefreshCw size={14} style={{ animation: spinning ? "anim-spin 0.8s cubic-bezier(0.4,0,0.2,1)" : "none" }} />
            </button>
          </div>
        </section>

        {/* ── 내 체크인 상태 ── */}
        <div className="ck-card">
          <div className="ck-card-header">
            <h2 className="ck-card-title">
              <span className="ck-card-title-icon" style={{ background: "#eff4ff" }}><UserCheck size={16} color="#02A17E" /></span>
              내 체크인 상태
            </h2>
            {myCheckin && (
              <span className={`ck-status-chip ck-status-chip-${STATUS_TONE[String(myCheckin.status ?? "PENDING").toUpperCase()] || "pending"}`}>
                {STATUS_TEXT[String(myCheckin.status ?? "PENDING").toUpperCase()] || "집계 중"}
              </span>
            )}
          </div>
          <div className="ck-my-status-title">{myCheckin?.programName || "참여 프로그램 없음"}</div>
          <div className="ck-my-status-desc">{myCheckin?.programTime || "운영 시간 정보 없음"}</div>
          <div className="ck-my-checkin-grid">
            <div className="ck-my-checkin-item">
              <div className="ck-my-checkin-label">내 순서</div>
              <div className="ck-my-checkin-value">{myCheckin?.status === "WAITING" && myCheckin?.myPosition > 0 ? `${myCheckin.myPosition}번째` : "-"}</div>
            </div>
            <div className="ck-my-checkin-item">
              <div className="ck-my-checkin-label">예상 체크인</div>
              <div className="ck-my-checkin-value">{myCheckin?.status === "WAITING" && myCheckin?.estimatedCheckinTime ? myCheckin.estimatedCheckinTime : "-"}</div>
            </div>
          </div>
        </div>

        {/* ── 프로그램 체크인 진행률 ── */}
        <div className="ck-card">
          <div className="ck-card-header">
            <h2 className="ck-card-title">
              <span className="ck-card-title-icon" style={{ background: "#f0fdf4" }}><Users size={16} color="#22c55e" /></span>
              프로그램 체크인 진행률
            </h2>
            {hasProgCheckin && <span className="ck-live-count">진행률 {progRate}%</span>}
          </div>
          {!hasProgCheckin ? (
            <div className="ck-empty">참여 중인 프로그램 체크인 정보가 없습니다.</div>
          ) : (
            <div className="ck-progress-list">
              <div className="ck-progress-item">
                <div className="ck-progress-name">{programCheckinStatus.programName}</div>
                <div className="ck-progress-meta">체크인 완료 {progCheckedIn}명 · 대기 {progWaiting}명</div>
                <div className="ck-progress-track">
                  <div className="ck-progress-fill" style={{ width: `${progRate}%` }} />
                </div>
                <div className="ck-progress-val">{progRate}%</div>
              </div>
            </div>
          )}
        </div>

        {/* ── 오늘 참여 프로그램 ── */}
        <div className="ck-card">
          <div className="ck-card-header">
            <h2 className="ck-card-title">
              <span className="ck-card-title-icon" style={{ background: "#fef3c7" }}><Clock size={16} color="#f59e0b" /></span>
              오늘 참여 프로그램
            </h2>
            <span className="ck-card-tag">총 {myPrograms.length}건</span>
          </div>
          {myPrograms.length === 0 ? (
            <div className="ck-empty">오늘 참여 프로그램이 없습니다.</div>
          ) : (
            <ul className="ck-my-program-list">
              {myPrograms.map((program, idx) => (
                <li key={program.programApplyId ?? `${program.programId}-${idx}`} className="ck-my-program-item">
                  <div className="ck-my-program-time">{program.time}</div>
                  <div className="ck-my-program-title">{program.programName}</div>
                  <div className="ck-my-program-right">
                    <span className={`ck-status-chip ck-status-chip-${STATUS_TONE[String(program.status ?? "PENDING").toUpperCase()] || "pending"}`} style={{ fontSize: 12 }}>
                      {STATUS_LABEL_MAP[String(program.status ?? "PENDING").toUpperCase()] || "집계 중"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export default function CheckinStatus() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const handleSelectEvent = (id) => {
    navigate(`/realtime/checkinstatus/${id}`);
  };

  return (
    <div className="ck-root">
      <style>{styles}</style>
      <style>{SHARED_ANIM_STYLES}</style>
      <PageHeader
        title={eventId ? "체크인현황" : "실시간현황"}
        subtitle={eventId ? "참가자 체크인 현황을 실시간으로 확인합니다" : "행사별 실시간 데이터를 한눈에 확인하세요"}
        icon={<ClipboardCheck size={42} color="#02A17E" strokeWidth={1.6} />}
        titleStyle={{ fontSize: 46, lineHeight: "66px", letterSpacing: "-1px" }}
        subtitleStyle={{ fontSize: 20 }}
      />

      <main className={`ck-container${eventId ? "" : " selector-mode"}`}>
        {eventId ? (
          <>
            <button className="ck-back-btn" onClick={() => navigate("/realtime/checkinstatus")}>
              <ArrowLeft size={15} />
              목록으로
            </button>
            <CheckinContent eventId={eventId} />
          </>
        ) : (
          <RealtimeEventSelector onSelectEvent={handleSelectEvent} pageTitle="체크인 현황" metricType="checkin" />
        )}
      </main>
    </div>
  );
}
