﻿import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import RealtimeEventSelector from "./RealtimeEventSelector";
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Radio,
  Activity,
  BarChart2,
  PieChart,
  RefreshCw,
  MapPin,
  CalendarDays,
} from "lucide-react";
import {
  useCountUp,
  useRefresh,
  useStaggerIn,
  useAutoRefresh,
  SHARED_ANIM_STYLES,
} from "./useRealtimeAnimations";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { eventApi } from "../../../app/http/eventApi";
import { aiApi } from "../../../app/http/aiApi";
import { getToken } from "../../../api/noticeApi";
import {
  formatKoreanTime,
  normalizePrediction,
} from "./aiCongestionViewModel";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .rt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .rt-root *, .rt-root *::before, .rt-root *::after { box-sizing: border-box; font-family: inherit; }
  .rt-container { max-width: 1400px; margin: 0 auto; padding: 32px 25px 64px; }
  .rt-container.selector-mode { padding-top: 104px; }

  .rt-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 12px;
  }
  .rt-live-badge.planned {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #2563eb;
  }
  .rt-live-badge.ended {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #6b7280;
  }
  .rt-live-badge.cancelled {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
  }
  .rt-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: currentColor;
    animation: rt-pulse 1.4s ease-in-out infinite;
  }
  @keyframes rt-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .rt-live-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 20px; gap: 16px;
  }
  .rt-live-header-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .rt-event-name {
    font-size: 28px;
    font-weight: 900;
    color: #111827;
    line-height: 1.1;
    letter-spacing: -0.03em;
  }
  .rt-event-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 13px;
    color: #6b7280;
    margin-top: 4px;
  }
  .rt-event-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .rt-live-header-right {
    display: flex; align-items: center; gap: 12px;
    flex-shrink: 0;
  }
  .rt-timestamp {
    font-size: 12px; color: #9ca3af; font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .rt-refresh-btn {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1px solid #e2e8f0; background: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6b7280;
    transition: all 0.15s;
  }
  .rt-refresh-btn:hover { border-color: #1a4fd6; color: #1a4fd6; background: #f5f8ff; }
  .rt-refresh-btn:active { transform: scale(0.93); }

  .rt-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .rt-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 22px 22px 20px; position: relative; overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .rt-stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
  .rt-stat-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
  }
  .rt-stat-label { font-size: 12.5px; color: #6b7280; font-weight: 500; margin-bottom: 6px; }
  .rt-stat-value { font-size: 26px; font-weight: 800; color: #111827; line-height: 1; }
  .rt-stat-suffix { font-size: 18px; margin-left: 2px; }
  .rt-stat-sub { font-size: 12px; color: #9ca3af; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
  .rt-stat-up { color: #10b981; }
  .rt-stat-down { color: #ef4444; }
  .rt-stat-bg {
    position: absolute; right: -10px; bottom: -10px;
    width: 70px; height: 70px; border-radius: 50%; opacity: 0.06;
  }

  .rt-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .rt-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5;
  }
  .rt-card-title {
    font-size: 15px; font-weight: 700; color: #111827;
    display: flex; align-items: center; gap: 8px; margin: 0;
  }
  .rt-card-title-icon {
    width: 24px; height: 24px; border-radius: 6px;
    background: #eff4ff; display: flex; align-items: center; justify-content: center;
  }
  .rt-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  .rt-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  .rt-progress-wrap { margin-bottom: 14px; }
  .rt-progress-wrap:last-child { margin-bottom: 0; }
  .rt-progress-label { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 7px; gap: 12px; }
  .rt-progress-label-name { font-weight: 600; color: #374151; }
  .rt-progress-label-val { color: #6b7280; text-align: right; }
  .rt-progress-track { height: 8px; background: #f1f3f5; border-radius: 100px; overflow: hidden; }
  .rt-progress-fill { height: 100%; border-radius: 100px; }

  .rt-opinion-list { display: flex; flex-direction: column; gap: 8px; }
  .rt-opinion-item { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-radius: 10px; border: 1px solid #eceef3; }
  .rt-opinion-bar-wrap { flex: 1; }
  .rt-opinion-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 5px; }
  .rt-opinion-track { height: 6px; background: #f1f3f6; border-radius: 100px; overflow: hidden; }
  .rt-opinion-fill { height: 100%; border-radius: 100px; }
  .rt-opinion-val { font-size: 14px; font-weight: 800; color: #1a1d24; min-width: 36px; text-align: right; }

  .rt-timeline { display: flex; flex-direction: column; gap: 0; }
  .rt-timeline-item { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid #f9fafb; }
  .rt-timeline-item:last-child { border-bottom: none; }
  .rt-timeline-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
  .rt-timeline-time { font-size: 11.5px; color: #9ca3af; min-width: 44px; padding-top: 1px; }
  .rt-timeline-text { font-size: 13px; color: #374151; line-height: 1.5; }

  .rt-hour-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; }
  .rt-hour-cell {
    aspect-ratio: 1; border-radius: 4px; display: flex; align-items: center;
    justify-content: center; font-size: 9px; font-weight: 700;
    cursor: default;
  }
  .rt-hour-cell-label {
    font-size: 9px;
    color: #9ca3af;
    text-align: center;
  }

  .rt-empty {
    text-align: center;
    padding: 40px 20px;
    color: #9ca3af;
    font-size: 13px;
  }
  .rt-empty-strong {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: #374151;
    margin-bottom: 4px;
  }
  .rt-error {
    color: #b91c1c;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 16px;
    font-size: 13px;
    font-weight: 600;
  }

  @media (max-width: 900px) {
    .rt-live-header {
      flex-direction: column;
      align-items: flex-start;
    }
    .rt-stat-grid { grid-template-columns: repeat(2, 1fr); }
    .rt-two-col { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .rt-container { padding: 20px 16px 48px; }
    .rt-container.selector-mode { padding-top: 88px; }
    .rt-stat-grid { grid-template-columns: repeat(2, 1fr); }
    .rt-card { padding: 22px 18px; }
    .rt-event-name { font-size: 22px; }
  }
`;

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

const FALLBACK_HOURS = Array.from({ length: 12 }, (_, index) => 10 + index);
const AI_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const SATISFACTION_DATA = [
  { label: "프로그램 구성", pct: 88, color: "#8b5cf6" },
  { label: "부스 운영", pct: 75, color: "#4f46e5" },
  { label: "음식/간식", pct: 92, color: "#10b981" },
  { label: "시설 환경", pct: 68, color: "#f59e0b" },
  { label: "전반적 만족", pct: 84, color: "#ef4444" },
];

const STATUS_BADGE = {
  ONGOING: { className: "", label: "LIVE", showDot: true },
  PLANNED: { className: "planned", label: "예정", showDot: false },
  ENDED: { className: "ended", label: "종료", showDot: false },
  CANCELLED: { className: "cancelled", label: "취소", showDot: false },
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

const toHour = (value) => {
  const date = toValidDate(value);
  return date ? date.getHours() : null;
};

const normalizeHour = (value) => ((Number(value) % 24) + 24) % 24;

const toDateKey = (value) => {
  const date = toValidDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateOptionLabel = (dateKey) => {
  if (!dateKey) return "";
  const date = toValidDate(`${dateKey}T00:00:00`);
  if (!date) return dateKey;
  return date.toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
};

const buildDateKeysFromRange = (startAt, endAt, maxDays = 60) => {
  const startDate = toValidDate(startAt);
  const endDate = toValidDate(endAt);
  if (!startDate || !endDate || endDate < startDate) return [];

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const limit = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const keys = [];

  while (cursor <= limit && keys.length < maxDays) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
};

const isDateKeyInRange = (dateKey, startAt, endAt) => {
  if (!dateKey) return false;
  const clipped = clipRangeByDate(startAt, endAt, dateKey);
  return Boolean(clipped.startAt && clipped.endAt);
};

const buildOperationRangeByDate = (startAt, endAt, dateKey) => {
  if (!dateKey) {
    return {
      startAt: toValidDate(startAt),
      endAt: toValidDate(endAt),
    };
  }

  const clipped = clipRangeByDate(startAt, endAt, dateKey);
  if (!clipped.startAt || !clipped.endAt) return { startAt: null, endAt: null };

  const eventStart = toValidDate(startAt);
  const eventEnd = toValidDate(endAt);
  const baseDate = toValidDate(`${dateKey}T00:00:00`);
  if (!eventStart || !eventEnd || !baseDate) {
    return clipped;
  }

  const rangeStart = new Date(baseDate);
  rangeStart.setHours(eventStart.getHours(), 0, 0, 0);

  const rangeEnd = new Date(baseDate);
  rangeEnd.setHours(eventEnd.getHours(), 59, 59, 999);

  if (rangeEnd < rangeStart) {
    return clipped;
  }

  return {
    startAt: rangeStart,
    endAt: rangeEnd,
  };
};

const clipRangeByDate = (startAt, endAt, dateKey) => {
  const startDate = toValidDate(startAt);
  const endDate = toValidDate(endAt);
  const baseDate = toValidDate(`${dateKey}T00:00:00`);
  if (!startDate || !endDate || !baseDate || endDate < startDate) {
    return { startAt: null, endAt: null };
  }

  const dayStart = new Date(baseDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(baseDate);
  dayEnd.setHours(23, 59, 59, 999);

  if (endDate < dayStart || startDate > dayEnd) {
    return { startAt: null, endAt: null };
  }

  const clippedStart = startDate > dayStart ? startDate : dayStart;
  const clippedEnd = endDate < dayEnd ? endDate : dayEnd;
  return { startAt: clippedStart, endAt: clippedEnd };
};

const buildHourRange = (startAt, endAt) => {
  const startDate = toValidDate(startAt);
  const endDate = toValidDate(endAt);
  if (!startDate || !endDate || endDate < startDate) return [];

  const sameDay = startDate.toDateString() === endDate.toDateString();
  const startHour = startDate.getHours();
  const endHour = sameDay ? endDate.getHours() : 23;
  if (endHour < startHour) return [normalizeHour(startHour)];

  return Array.from({ length: endHour - startHour + 1 }, (_, index) =>
    normalizeHour(startHour + index),
  );
};

const uniqueNormalizedHours = (hours) =>
  Array.from(new Set(hours.map((hour) => normalizeHour(hour)).filter(Number.isFinite))).sort(
    (a, b) => a - b,
  );

const buildHourAxis = ({ hourlyRows, timeline, startAt, endAt, preferRange = false }) => {
  if (preferRange) {
    const range = buildHourRange(startAt, endAt);
    if (range.length > 0) return range;
  }

  const rowHours = uniqueNormalizedHours(
    toArray(hourlyRows)
      .map((row) => Number(row?.hour ?? row?.h))
      .filter(Number.isFinite),
  );
  if (rowHours.length > 0) return rowHours;

  const timelineHours = uniqueNormalizedHours(
    Array.isArray(timeline)
      ? timeline.map((point) => toHour(point?.time)).filter(Number.isFinite)
      : [],
  );
  if (timelineHours.length > 0) return timelineHours;

  const range = buildHourRange(startAt, endAt);
  if (range.length > 0) return range;

  return [...FALLBACK_HOURS];
};

const resolveAiDateKey = (eventDetail, preferredDateKey) => {
  const dateOptions = buildDateKeysFromRange(eventDetail?.startAt, eventDetail?.endAt);
  if (dateOptions.length === 0) {
    return "";
  }
  if (preferredDateKey && dateOptions.includes(preferredDateKey)) {
    return preferredDateKey;
  }

  const status = String(eventDetail?.status ?? "").toUpperCase();
  const todayKey = toDateKey(new Date());
  if (status === "ONGOING" && dateOptions.includes(todayKey)) {
    return todayKey;
  }
  if (status === "ENDED") {
    return dateOptions[dateOptions.length - 1];
  }
  return dateOptions[0];
};

const resolveAiRangeParams = (eventDetail, preferredDateKey) => {
  const selectedDateKey = resolveAiDateKey(eventDetail, preferredDateKey);
  if (selectedDateKey) {
    const operationRange = buildOperationRangeByDate(
      eventDetail?.startAt,
      eventDetail?.endAt,
      selectedDateKey,
    );
    if (operationRange.startAt && operationRange.endAt) {
      return {
        from: operationRange.startAt,
        to: operationRange.endAt,
      };
    }
  }

  const fallbackStart = toValidDate(eventDetail?.startAt);
  const fallbackEnd = toValidDate(eventDetail?.endAt);
  if (fallbackStart && fallbackEnd && fallbackEnd >= fallbackStart) {
    return { from: fallbackStart, to: fallbackEnd };
  }
  return {};
};

const formatDateRange = (startAt, endAt) => {
  const start = startAt ? new Date(startAt) : null;
  const end = endAt ? new Date(endAt) : null;
  const validStart = start && !Number.isNaN(start.getTime()) ? start : null;
  const validEnd = end && !Number.isNaN(end.getTime()) ? end : null;

  if (!validStart && !validEnd) return "일정 정보 없음";
  if (validStart && validEnd) {
    return `${validStart.getFullYear()}.${String(validStart.getMonth() + 1).padStart(2, "0")}.${String(validStart.getDate()).padStart(2, "0")} ~ ${validEnd.getFullYear()}.${String(validEnd.getMonth() + 1).padStart(2, "0")}.${String(validEnd.getDate()).padStart(2, "0")}`;
  }
  const target = validStart || validEnd;
  return `${target.getFullYear()}.${String(target.getMonth() + 1).padStart(2, "0")}.${String(target.getDate()).padStart(2, "0")}`;
};

const formatTime = (value) => {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatTimestamp = (value) => {
  if (!value) return "--:--:--";
  return value.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const congestionLevelToPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return clamp(Math.round(numeric * 20), 0, 100);
};

const getHeatColor = (pct) => {
  if (pct === 0) return "#f1f3f5";
  if (pct < 30) return "#dbeafe";
  if (pct < 60) return "#93c5fd";
  if (pct < 85) return "#3b82f6";
  return "#1d4ed8";
};

const getHeatTextColor = (pct) => {
  if (pct === 0) return "#9ca3af";
  if (pct < 60) return "#d97706";
  return "#f59e0b";
};

const getActivityColor = (pct) => {
  if (pct >= 80) return "#ef4444";
  if (pct >= 50) return "#f59e0b";
  if (pct > 0) return "#10b981";
  return "#9ca3af";
};

const safePercent = (value) => clamp(Math.round(Number(value) || 0), 0, 100);

async function fetchAdminData(url, params, fallback) {
  try {
    const response = await axiosInstance.get(url, {
      headers: authHeaders(),
      params,
    });
    return unwrapData(response, fallback);
  } catch {
    return fallback;
  }
}

function AnimatedStatCard({ stat, index }) {
  const count = useCountUp(stat.rawValue, 1200, index * 120);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 100 + 50);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div className={`rt-stat-card anim-pop ${visible ? "visible" : ""}`}>
      <div className="rt-stat-icon" style={{ background: stat.iconBg }}>
        {stat.icon}
      </div>
      <div className="rt-stat-label">{stat.label}</div>
      <div className="rt-stat-value">
        {count.toLocaleString()}
        {stat.suffix ? <span className="rt-stat-suffix">{stat.suffix}</span> : null}
      </div>
      <div className="rt-stat-sub">
        {stat.up === true ? <TrendingUp size={12} className="rt-stat-up" /> : null}
        <span className={stat.up === true ? "rt-stat-up" : stat.up === false ? "rt-stat-down" : ""}>
          {stat.sub}
        </span>
      </div>
      <div className="rt-stat-bg" style={{ background: stat.barColor }} />
    </div>
  );
}

function AnimatedProgress({ item, index }) {
  const safeTotal = Math.max(Number(item.total) || 0, 1);
  const pct = item.total > 0 ? Math.round((item.val / safeTotal) * 100) : 0;
  const [width, setWidth] = useState(0);
  const animatedVal = useCountUp(item.val, 900, index * 150 + 400);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), index * 150 + 400);
    return () => clearTimeout(timer);
  }, [pct, index]);

  return (
    <div className="rt-progress-wrap">
      <div className="rt-progress-label">
        <span className="rt-progress-label-name">{item.name}</span>
        <span className="rt-progress-label-val">
          {animatedVal.toLocaleString()} / {item.total.toLocaleString()}
          {item.unit ?? "건"}
        </span>
      </div>
      <div className="rt-progress-track">
        <div
          className="rt-progress-fill anim-progress-fill"
          style={{ width: `${width}%`, background: item.color }}
        />
      </div>
    </div>
  );
}

function AnimatedSatisfactionItem({ item, index }) {
  const [width, setWidth] = useState(0);
  const animatedPct = useCountUp(item.pct, 800, index * 100 + 300);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(item.pct), index * 100 + 300);
    return () => clearTimeout(timer);
  }, [item.pct, index]);

  return (
    <div className="rt-opinion-item">
      <div className="rt-opinion-bar-wrap">
        <div className="rt-opinion-label">{item.label}</div>
        <div className="rt-opinion-track">
          <div
            className="rt-opinion-fill anim-progress-fill"
            style={{ width: `${width}%`, background: item.color }}
          />
        </div>
      </div>
      <span className="rt-opinion-val">{animatedPct}%</span>
    </div>
  );
}

function AnimatedHeatCell({ item, index }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 60 + 200);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
      }}
    >
      <div
        className="rt-hour-cell"
        style={{
          background: visible ? getHeatColor(item.pct) : "#f1f3f5",
          width: "100%",
          color: visible ? getHeatTextColor(item.pct) : "#9ca3af",
          transition: "background 0.5s ease, color 0.5s ease, transform 0.5s ease",
          transform: visible ? "scale(1)" : "scale(0.8)",
        }}
        title={`${item.h}:00 / ${item.v}%`}
      >
        {visible && item.v > 0 ? item.v : ""}
      </div>
      <div className="rt-hour-cell-label">{item.h}:00</div>
    </div>
  );
}

function DashboardContent({ eventId }) {
  const numericEventId = Number(eventId);
  const { tick } = useAutoRefresh(15000);
  const [eventDetail, setEventDetail] = useState(null);
  const [performance, setPerformance] = useState({ approved: 0, checkin: 0 });
  const [hourlyRows, setHourlyRows] = useState([]);
  const [congestionRows, setCongestionRows] = useState([]);
  const [eventPrediction, setEventPrediction] = useState(null);
  const [aiErrorMsg, setAiErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState(new Date());
  const aiPredictionRef = useRef(null);
  const aiLoadedAtRef = useRef(0);
  const aiRangeKeyRef = useRef("");
  const [selectedForecastDate, setSelectedForecastDate] = useState("");

  const loadData = useCallback(async (options = {}) => {
    const { preserveLoading = false, forceAi = false } = options;
    if (!numericEventId || Number.isNaN(numericEventId)) {
      setErrorMsg("잘못된 행사 경로입니다.");
      setEventPrediction(null);
      aiPredictionRef.current = null;
      aiLoadedAtRef.current = 0;
      aiRangeKeyRef.current = "";
      setLoading(false);
      return;
    }

    if (!preserveLoading) setLoading(true);

    try {
      const [eventResponse, performanceRows, hourlyData, latestCongestions] = await Promise.all([
        eventApi.getEventDetail(numericEventId),
        fetchAdminData("/api/admin/analytics/events", { page: 0, size: 200 }, []),
        fetchAdminData(`/api/admin/analytics/events/${numericEventId}/congestion-by-hour`, {}, []),
        fetchAdminData(`/api/admin/dashboard/realtime/events/${numericEventId}/congestions`, { limit: 200 }, []),
      ]);

      const detail = unwrapData(eventResponse, null);
      const matchedPerformance = toArray(performanceRows).find(
        (row) => Number(row.eventId) === numericEventId,
      );
      const detailStatus = String(detail?.status ?? "").toUpperCase();
      const rawCheckinCount = Number(matchedPerformance?.checkinCount) || 0;

      setEventDetail(detail);
      setPerformance({
        approved:
          Number(
            matchedPerformance?.activeRegistrationCount ??
            matchedPerformance?.approvedRegistrationCount,
          ) || 0,
        checkin: detailStatus === "PLANNED" ? 0 : rawCheckinCount,
      });
      setHourlyRows(toArray(hourlyData));
      setCongestionRows(toArray(latestCongestions));
      setErrorMsg("");
      setLastLoadedAt(new Date());

      const aiRangeParams = resolveAiRangeParams(detail, selectedForecastDate);
      const aiRangeKey = JSON.stringify({
        from: aiRangeParams?.from || null,
        to: aiRangeParams?.to || null,
      });

      const now = Date.now();
      const shouldLoadAi =
        forceAi ||
        !aiPredictionRef.current ||
        aiRangeKeyRef.current !== aiRangeKey ||
        now - aiLoadedAtRef.current >= AI_REFRESH_INTERVAL_MS;

      if (shouldLoadAi) {
        try {
          const aiResponse = await aiApi.predictEventCongestion(numericEventId, aiRangeParams);
          const aiPayload = normalizePrediction(unwrapData(aiResponse, null));
          aiPredictionRef.current = aiPayload;
          aiLoadedAtRef.current = now;
          aiRangeKeyRef.current = aiRangeKey;
          setEventPrediction(aiPayload);
          setAiErrorMsg("");
        } catch (aiError) {
          console.error("[Realtime Dashboard] ai predict failed:", aiError);
          setAiErrorMsg("AI prediction is temporarily unavailable.");
        }
      } else {
        setEventPrediction(aiPredictionRef.current);
        setAiErrorMsg("");
      }
    } catch (error) {
      console.error("[Realtime Dashboard] load failed:", error);
      setErrorMsg("실시간 운영 데이터를 불러오지 못했습니다.");
    } finally {
      if (!preserveLoading) setLoading(false);
    }
  }, [numericEventId, selectedForecastDate]);

  const { spinning, refresh } = useRefresh(() => {
    loadData({ preserveLoading: true, forceAi: true });
  }, 800);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading) {
      loadData({ preserveLoading: true });
    }
  }, [tick, loadData, loading]);

  const measuredCongestions = useMemo(
    () =>
      congestionRows
        .map((row) => ({
          ...row,
          congestionLevel: Number(row?.congestionLevel),
          congestionPercent: congestionLevelToPercent(row?.congestionLevel),
        }))
        .filter((row) => Number.isFinite(row.congestionLevel)),
    [congestionRows],
  );

  const checkinRate = useMemo(() => {
    if (performance.approved <= 0) return 0;
    return clamp(Math.round((performance.checkin / performance.approved) * 100), 0, 100);
  }, [performance.approved, performance.checkin]);

  const averageCongestion = useMemo(() => {
    if (measuredCongestions.length === 0) return 0;
    const sum = measuredCongestions.reduce((acc, row) => acc + row.congestionPercent, 0);
    return clamp(Math.round(sum / measuredCongestions.length), 0, 100);
  }, [measuredCongestions]);

  const hotBoothCount = useMemo(
    () => measuredCongestions.filter((row) => row.congestionPercent >= 80).length,
    [measuredCongestions],
  );

  const eventStatus = String(eventDetail?.status ?? "").toUpperCase();
  const isPlannedEvent =
    eventStatus === "PLANNED" ||
    eventStatus === "PENDING" ||
    eventStatus === "UPCOMING";
  const isOngoingEvent = eventStatus === "ONGOING";
  const congestionStatLabel = isPlannedEvent ? "예상 혼잡" : "평균 혼잡";

  const forecastDateOptions = useMemo(() => {
    const rangeDates = buildDateKeysFromRange(eventDetail?.startAt, eventDetail?.endAt);
    if (rangeDates.length > 0) return rangeDates;

    const timelineDates = Array.isArray(eventPrediction?.timeline)
      ? Array.from(
          new Set(
            eventPrediction.timeline
              .map((point) => toDateKey(point?.time))
              .filter(Boolean),
          ),
        ).sort((left, right) => left.localeCompare(right))
      : [];
    return timelineDates;
  }, [eventDetail?.endAt, eventDetail?.startAt, eventPrediction?.timeline]);

  useEffect(() => {
    if (forecastDateOptions.length === 0) {
      if (selectedForecastDate) {
        setSelectedForecastDate("");
      }
      return;
    }

    if (selectedForecastDate && forecastDateOptions.includes(selectedForecastDate)) {
      return;
    }

    const todayKey = toDateKey(new Date());
    if (isOngoingEvent && forecastDateOptions.includes(todayKey)) {
      setSelectedForecastDate(todayKey);
      return;
    }

    if (eventStatus === "ENDED") {
      setSelectedForecastDate(forecastDateOptions[forecastDateOptions.length - 1]);
      return;
    }

    setSelectedForecastDate(forecastDateOptions[0]);
  }, [eventStatus, forecastDateOptions, isOngoingEvent, selectedForecastDate]);

  const chartTimeline = useMemo(() => {
    const baseTimeline = Array.isArray(eventPrediction?.timeline)
      ? eventPrediction.timeline
      : [];
    if (baseTimeline.length === 0) return [];
    if (selectedForecastDate) {
      return baseTimeline.filter(
        (point) => toDateKey(point?.time) === selectedForecastDate,
      );
    }
    if (isOngoingEvent) {
      const todayKey = toDateKey(new Date());
      return baseTimeline.filter((point) => toDateKey(point?.time) === todayKey);
    }
    return baseTimeline;
  }, [eventPrediction?.timeline, isOngoingEvent, selectedForecastDate]);

  const hours = useMemo(() => {
    const hourlyMap = new Map(
      toArray(hourlyRows)
        .map((row) => [
          normalizeHour(Number(row?.hour ?? row?.h)),
          congestionLevelToPercent(row?.avgCongestionLevel ?? row?.avgCongestion ?? row?.avg_level),
        ])
        .filter(([hour]) => Number.isFinite(hour)),
    );

    const timelineMap = new Map();
    if (Array.isArray(chartTimeline)) {
      chartTimeline.forEach((point) => {
        const hour = toHour(point?.time);
        if (!Number.isFinite(hour)) return;
        const normalizedHour = normalizeHour(hour);
        const score = clamp(Math.round(Number(point?.score) || 0), 0, 100);
        const previous = timelineMap.get(normalizedHour);
        if (previous == null || score > previous) {
          timelineMap.set(normalizedHour, score);
        }
      });
    }

    const todayKey = toDateKey(new Date());
    const rangeDateKey =
      selectedForecastDate ||
      (isOngoingEvent ? todayKey : forecastDateOptions[0] ?? "");

    let axisStart = eventDetail?.startAt ?? null;
    let axisEnd = eventDetail?.endAt ?? null;
    if (isDateKeyInRange(rangeDateKey, eventDetail?.startAt, eventDetail?.endAt)) {
      const operationRange = buildOperationRangeByDate(
        eventDetail?.startAt,
        eventDetail?.endAt,
        rangeDateKey,
      );
      axisStart = operationRange.startAt;
      axisEnd = operationRange.endAt;
    }

    const hourAxis = buildHourAxis({
      hourlyRows,
      timeline: chartTimeline,
      startAt: axisStart,
      endAt: axisEnd,
      preferRange: Boolean(axisStart && axisEnd),
    });

    return hourAxis.map((hour) => {
      const normalizedHour = normalizeHour(hour);
      const value = isPlannedEvent
        ? timelineMap.get(normalizedHour) ?? hourlyMap.get(normalizedHour) ?? 0
        : hourlyMap.get(normalizedHour) ?? timelineMap.get(normalizedHour) ?? 0;
      return {
        h: String(normalizedHour).padStart(2, "0"),
        v: value,
        pct: value,
      };
    });
  }, [
    chartTimeline,
    eventDetail?.endAt,
    eventDetail?.startAt,
    forecastDateOptions,
    hourlyRows,
    isOngoingEvent,
    isPlannedEvent,
    selectedForecastDate,
  ]);

  const handleForecastDateChange = useCallback(
    (event) => {
      const nextDate = event.target.value;
      if (!nextDate) {
        setSelectedForecastDate("");
        return;
      }
      if (
        forecastDateOptions.length === 0 ||
        forecastDateOptions.includes(nextDate)
      ) {
        setSelectedForecastDate(nextDate);
      }
    },
    [forecastDateOptions],
  );

  const progressData = useMemo(() => {
    const totalBooths = congestionRows.length;
    const trackedBooths = measuredCongestions.length;

    return [
      {
        name: "체크인 완료",
        val: performance.checkin,
        total: performance.approved,
        color: "#10b981",
        unit: "명",
      },
      {
        name: "미체크인",
        val: Math.max(performance.approved - performance.checkin, 0),
        total: performance.approved,
        color: "#f59e0b",
        unit: "명",
      },
      {
        name: "실시간 부스 수집",
        val: trackedBooths,
        total: totalBooths,
        color: "#1a4fd6",
        unit: "개",
      },
      {
        name: "주의 부스",
        val: hotBoothCount,
        total: totalBooths,
        color: "#ef4444",
        unit: "개",
      },
    ];
  }, [congestionRows.length, hotBoothCount, measuredCongestions.length, performance.approved, performance.checkin]);

  const activities = useMemo(() => {
    const liveItems = [...measuredCongestions]
      .sort((left, right) => {
        const leftTime = left.measuredAt ? new Date(left.measuredAt).getTime() : 0;
        const rightTime = right.measuredAt ? new Date(right.measuredAt).getTime() : 0;
        return rightTime - leftTime;
      })
      .slice(0, 6)
      .map((row) => ({
        time: formatTime(row.measuredAt),
        text: `${row.placeName || "부스"} 혼잡도 ${row.congestionPercent}%가 반영되었습니다.`,
        color: getActivityColor(row.congestionPercent),
      }));

    if (liveItems.length > 0) return liveItems;

    return congestionRows.slice(0, 6).map((row) => ({
      time: "--:--",
      text: `${row.placeName || "부스"} 실시간 수집 대기 중입니다.`,
      color: "#9ca3af",
    }));
  }, [congestionRows, measuredCongestions]);

  const timelineVisible = useStaggerIn(activities.length, 100);

  const stats = useMemo(() => [
    {
      label: "사전등록",
      rawValue: performance.approved,
      sub: "행사 등록 기준",
      up: null,
      icon: <Users size={18} color="#1a4fd6" />,
      iconBg: "#eff4ff",
      barColor: "#1a4fd6",
    },
    {
      label: "체크인 완료",
      rawValue: performance.checkin,
      sub: performance.approved > 0 ? `체크인율 ${checkinRate}%` : "체크인 데이터 없음",
      up: null,
      icon: <CheckCircle2 size={18} color="#10b981" />,
      iconBg: "#ecfdf5",
      barColor: "#10b981",
    },
    {
      label: "체크인율",
      rawValue: checkinRate,
      suffix: "%",
      sub: `${performance.checkin.toLocaleString()}명 입장`,
      up: null,
      icon: <TrendingUp size={18} color="#8b5cf6" />,
      iconBg: "#f5f3ff",
      barColor: "#8b5cf6",
    },
    {
      label: congestionStatLabel,
      rawValue: averageCongestion,
      suffix: "%",
      sub: hotBoothCount > 0 ? `${hotBoothCount}개 부스 주의` : "안정적인 운영 상태",
      up: null,
      icon: <Radio size={18} color="#f59e0b" />,
      iconBg: "#fffbeb",
      barColor: "#f59e0b",
    },
  ], [averageCongestion, checkinRate, congestionStatLabel, hotBoothCount, performance.approved, performance.checkin]);

  const aiTimelinePreview = useMemo(
    () => (Array.isArray(chartTimeline) ? chartTimeline.slice(0, 6) : []),
    [chartTimeline],
  );

  const badge = STATUS_BADGE[String(eventDetail?.status).toUpperCase()] || STATUS_BADGE.PLANNED;

  if (loading && !eventDetail) {
    return (
      <div className="rt-card">
        <div className="rt-empty">
          <span className="rt-empty-strong">실시간 운영 데이터를 불러오는 중입니다</span>
          선택된 행사 기준으로 최신 운영 현황을 연결하고 있습니다.
        </div>
      </div>
    );
  }

  return (
    <>
      {errorMsg ? <div className="rt-error">{errorMsg}</div> : null}

      <div className="rt-live-header">
        <div className="rt-live-header-left">
          <div className={`rt-live-badge ${badge.className}`}>
            {badge.showDot ? <div className="rt-live-dot" /> : null}
            {badge.label}
          </div>
          <div className="rt-event-name">{eventDetail?.eventName || "행사 정보 없음"}</div>
          <div className="rt-event-meta">
            <span className="rt-event-meta-item">
              <CalendarDays size={13} />
              {formatDateRange(eventDetail?.startAt, eventDetail?.endAt)}
            </span>
            <span className="rt-event-meta-item">
              <MapPin size={13} />
              {eventDetail?.location || "장소 정보 없음"}
            </span>
          </div>
        </div>

        <div className="rt-live-header-right">
          <span className="rt-timestamp">
            마지막 갱신: {formatTimestamp(lastLoadedAt)}
          </span>
          <button className="rt-refresh-btn" onClick={refresh} title="새로고침">
            <RefreshCw
              size={14}
              style={{
                animation: spinning
                  ? "anim-spin 0.8s cubic-bezier(0.4,0,0.2,1)"
                  : "none",
              }}
            />
          </button>
        </div>
      </div>

      <div className="rt-stat-grid">
        {stats.map((stat, index) => (
          <AnimatedStatCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      <div className="rt-card">
        <div className="rt-card-header">
          <div className="rt-card-title" data-card="ai-congestion-title">
            <div className="rt-card-title-icon">
              <Radio size={14} color="#1a4fd6" />
            </div>
            AI 혼잡도 예측
          </div>
          <span className="rt-card-tag">5분 주기</span>
        </div>

        {eventPrediction ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
              }}
            >
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>평균 점수</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginTop: 4 }}>
                  {Math.round(eventPrediction.avgScore)}
                </div>
              </div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>최고 점수</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginTop: 4 }}>
                  {Math.round(eventPrediction.peakScore)}
                </div>
              </div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>혼잡 레벨</div>
                <div style={{ marginTop: 7 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      border: `1px solid ${eventPrediction.levelTone.border}`,
                      color: eventPrediction.levelTone.color,
                      background: eventPrediction.levelTone.bg,
                    }}
                  >
                    Lv.{eventPrediction.level} {eventPrediction.levelLabel}
                  </span>
                </div>
              </div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>예상 대기</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginTop: 4 }}>
                  {eventPrediction.waitMinutes}
                  <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4 }}>min</span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              <span>기준 시각: {formatKoreanTime(eventPrediction.baseTime)}</span>
              <span>신뢰도: {Math.round(eventPrediction.confidence * 100)}%</span>
              <span>모드: {eventPrediction.fallbackUsed ? "Fallback" : "AI Inference"}</span>
            </div>

            {aiTimelinePreview.length > 0 ? (
              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {aiTimelinePreview.map((point) => (
                  <span
                    key={`${point.time}-${point.score}`}
                    style={{
                      border: `1px solid ${point.tone.border}`,
                      background: point.tone.bg,
                      color: point.tone.color,
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {formatKoreanTime(point.time)} {Math.round(point.score)}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="rt-empty">
            <span className="rt-empty-strong">AI 예측 데이터가 아직 준비되지 않았습니다.</span>
            잠시 후 다시 확인해 주세요.
          </div>
        )}

        {aiErrorMsg ? (
          <div style={{ marginTop: 12, fontSize: 12, color: "#b91c1c" }}>{aiErrorMsg}</div>
        ) : null}
      </div>

      <div className="rt-two-col">
        <div className="rt-card">
          <div className="rt-card-header">
            <div className="rt-card-title">
              <div className="rt-card-title-icon">
                <BarChart2 size={14} color="#1a4fd6" />
              </div>
              실시간 운영 추이
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="rt-card-tag">행사 운영 시간</span>
              {selectedForecastDate ? (
                <span className="rt-card-tag" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                  {formatDateOptionLabel(selectedForecastDate)}
                </span>
              ) : null}
              {forecastDateOptions.length > 0 ? (
                <input
                  type="date"
                  value={selectedForecastDate}
                  min={forecastDateOptions[0]}
                  max={forecastDateOptions[forecastDateOptions.length - 1]}
                  onChange={handleForecastDateChange}
                  style={{
                    height: 28,
                    border: "1px solid #dbe2ea",
                    borderRadius: 7,
                    padding: "0 8px",
                    fontSize: 12,
                    color: "#374151",
                    background: "#fff",
                  }}
                />
              ) : null}
            </div>
          </div>

          <div
            className="rt-hour-grid"
            style={{
              gridTemplateColumns: `repeat(${Math.max(hours.length, 1)}, 1fr)`,
            }}
          >
            {hours.map((item, index) => (
              <AnimatedHeatCell key={`${item.h}-${index}`} item={item} index={index} />
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, color: "#9ca3af" }}>낮음</span>
            {["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8"].map((color) => (
              <div
                key={color}
                style={{
                  width: 16,
                  height: 10,
                  background: color,
                  borderRadius: 2,
                }}
              />
            ))}
            <span style={{ fontSize: 11, color: "#9ca3af" }}>높음</span>
          </div>
        </div>

        <div className="rt-card">
          <div className="rt-card-header">
            <div className="rt-card-title">
              <div className="rt-card-title-icon">
                <TrendingUp size={14} color="#1a4fd6" />
              </div>
              참가 현황 요약
            </div>
            <span className="rt-card-tag">실시간</span>
          </div>

          {progressData.map((item, index) => (
            <AnimatedProgress key={item.name} item={item} index={index} />
          ))}
        </div>
      </div>

      <div className="rt-card">
        <div className="rt-card-header">
          <div className="rt-card-title">
            <div className="rt-card-title-icon">
              <PieChart size={14} color="#1a4fd6" />
            </div>
            항목별 만족도
          </div>
          <span className="rt-card-tag">평균 점수</span>
        </div>
        <div className="rt-opinion-list">
          {SATISFACTION_DATA.map((item, index) => (
            <AnimatedSatisfactionItem key={item.label} item={item} index={index} />
          ))}
        </div>
      </div>

      <div className="rt-card">
        <div className="rt-card-header">
          <div className="rt-card-title">
            <div className="rt-card-title-icon">
              <Activity size={14} color="#1a4fd6" />
            </div>
            최근 운영 반영
          </div>
          <span className="rt-card-tag">자동 갱신</span>
        </div>

        <div className="rt-timeline">
          {activities.length === 0 ? (
            <div className="rt-empty">
              <span className="rt-empty-strong">실시간 반영 데이터가 없습니다</span>
              혼잡도 또는 체크인 데이터가 들어오면 여기에 표시됩니다.
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={`${activity.time}-${index}`}
                className={`rt-timeline-item anim-slide-right ${timelineVisible.includes(index) ? "visible" : ""}`}
              >
                <div
                  className="rt-timeline-dot"
                  style={{ background: activity.color }}
                />
                <div className="rt-timeline-time">{activity.time}</div>
                <div className="rt-timeline-text">{activity.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = useMemo(() => {
    if (location.pathname.startsWith("/realtime/checkinstatus")) return "/realtime/checkinstatus";
    if (location.pathname.startsWith("/realtime/waitingstatus")) return "/realtime/waitingstatus";
    if (location.pathname.startsWith("/realtime/votestatus")) return "/realtime/votestatus";
    return "/realtime/dashboard";
  }, [location.pathname]);

  const handleSelectEvent = (id) => {
    navigate(`/realtime/dashboard/${id}`);
  };

  const handleNavigate = (path) => {
    if (eventId) navigate(`${path}/${eventId}`);
    else navigate(path);
  };

  return (
    <div className="rt-root">
      <style>{styles}</style>
      <style>{SHARED_ANIM_STYLES}</style>
      {eventId ? (
        <PageHeader
          title={null}
          subtitle={null}
          categories={SERVICE_CATEGORIES}
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
      ) : null}
      <main className={`rt-container${eventId ? "" : " selector-mode"}`}>
        {eventId ? (
          <DashboardContent eventId={eventId} />
        ) : (
          <RealtimeEventSelector
            onSelectEvent={handleSelectEvent}
            pageTitle="통합 현황"
          />
        )}
      </main>
    </div>
  );
}
