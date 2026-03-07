import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getToken } from "../../../api/noticeApi";

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

const DEFAULT_HOURS = Array.from({ length: 12 }, (_, index) => 10 + index);

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
  const token = getToken();
  if (!token) return fallback;

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
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState(new Date());

  const loadData = useCallback(async (options = {}) => {
    const { preserveLoading = false } = options;
    if (!numericEventId || Number.isNaN(numericEventId)) {
      setErrorMsg("잘못된 행사 경로입니다.");
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

      setEventDetail(detail);
      setPerformance({
        approved: Number(matchedPerformance?.approvedRegistrationCount) || 0,
        checkin: Number(matchedPerformance?.checkinCount) || 0,
      });
      setHourlyRows(toArray(hourlyData));
      setCongestionRows(toArray(latestCongestions));
      setErrorMsg("");
      setLastLoadedAt(new Date());
    } catch (error) {
      console.error("[Realtime Dashboard] load failed:", error);
      setErrorMsg("실시간 운영 데이터를 불러오지 못했습니다.");
    } finally {
      if (!preserveLoading) setLoading(false);
    }
  }, [numericEventId]);

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

  const hours = useMemo(() => {
    const hourlyMap = new Map(
      hourlyRows.map((row) => [
        Number(row.hour ?? row.h),
        congestionLevelToPercent(row.avgCongestionLevel ?? row.avgCongestion ?? row.avg_level),
      ]),
    );

    return DEFAULT_HOURS.map((hour) => {
      const value = hourlyMap.get(hour) ?? 0;
      return {
        h: String(hour),
        v: value,
        pct: value,
      };
    });
  }, [hourlyRows]);

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
      label: "승인 등록",
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
      label: "평균 혼잡",
      rawValue: averageCongestion,
      suffix: "%",
      sub: hotBoothCount > 0 ? `${hotBoothCount}개 부스 주의` : "안정적인 운영 상태",
      up: null,
      icon: <Radio size={18} color="#f59e0b" />,
      iconBg: "#fffbeb",
      barColor: "#f59e0b",
    },
  ], [averageCongestion, checkinRate, hotBoothCount, performance.approved, performance.checkin]);

  const badge = STATUS_BADGE[String(eventDetail?.status).toUpperCase()] || STATUS_BADGE.PLANNED;

  if (loading && !eventDetail) {
    return (
      <div className="rt-card">
        <div className="rt-empty">
          <span className="rt-empty-strong">실시간 운영 데이터를 불러오는 중입니다</span>
          선택한 행사 기준으로 최신 운영 현황을 연결하고 있습니다.
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

      <div className="rt-two-col">
        <div className="rt-card">
          <div className="rt-card-header">
            <div className="rt-card-title">
              <div className="rt-card-title-icon">
                <BarChart2 size={14} color="#1a4fd6" />
              </div>
              실시간 운영 추이
            </div>
            <span className="rt-card-tag">시간대별 혼잡</span>
          </div>

          <div className="rt-hour-grid">
            {hours.map((item, index) => (
              <AnimatedHeatCell key={item.h} item={item} index={index} />
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
      <PageHeader
        title="통합 현황"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />
      <main className="rt-container">
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
