import PageHeader from "../components/PageHeader";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import RealtimeEventSelector from "./RealtimeEventSelector";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  UserCheck,
  Users,
  ScanLine,
  RefreshCw,
  ListFilter,
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
import { programApi } from "../../../app/http/programApi";

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
  .ck-container.selector-mode { padding-top: 104px; }

  .rt-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 20px;
  }
  .rt-live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ef4444;
    animation: ck-pulse 1.4s ease-in-out infinite;
  }
  @keyframes ck-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .ck-live-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 12px;
  }
  .ck-live-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 12px;
    color: #6b7280;
  }
  .ck-live-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .ck-timestamp {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
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
    padding: 24px 28px;
    margin-bottom: 16px;
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

  .ck-ring-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 0 16px;
    gap: 28px;
  }
  .ck-ring-legend {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ck-ring-legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #374151;
  }
  .ck-ring-legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ck-ring-legend-val {
    font-weight: 700;
    color: #111827;
    margin-left: 4px;
  }

  .ck-prog-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .ck-prog-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    gap: 8px;
  }
  .ck-prog-name {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ck-prog-val {
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
  }
  .ck-prog-track {
    height: 7px;
    background: #f1f3f5;
    border-radius: 100px;
    overflow: hidden;
  }
  .ck-prog-fill { height: 100%; border-radius: 100px; }

  .ck-toolbar {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .ck-search-wrap {
    position: relative;
    flex: 1;
    min-width: 220px;
  }
  .ck-search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }
  .ck-search {
    width: 100%;
    height: 40px;
    padding: 0 13px 0 36px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13.5px;
    color: #111827;
    outline: none;
    background: #fff;
    transition: border-color 0.15s;
  }
  .ck-search:focus {
    border-color: #1a4fd6;
    box-shadow: 0 0 0 3px rgba(26,79,214,0.08);
  }
  .ck-filter-btn {
    height: 40px;
    padding: 0 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: border-color 0.15s;
  }
  .ck-filter-btn:hover {
    border-color: #1a4fd6;
    color: #1a4fd6;
  }
  .ck-filter-btn.active {
    border-color: #1a4fd6;
    background: #f5f8ff;
    color: #1a4fd6;
  }

  .ck-table-wrap { overflow-x: auto; }
  .ck-table { width: 100%; border-collapse: collapse; }
  .ck-table thead tr { background: #f9fafb; }
  .ck-table th {
    padding: 11px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
    white-space: nowrap;
  }
  .ck-table td {
    padding: 14px 16px;
    font-size: 13px;
    color: #374151;
    border-bottom: 1px solid #f1f3f5;
  }
  .ck-table tbody tr:hover { background: #fafbff; }
  .ck-table tbody tr:last-child td { border-bottom: none; }

  .ck-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
  }
  .ck-badge.done { background: #ecfdf5; color: #059669; }
  .ck-badge.wait { background: #fff7ed; color: #d97706; }
  .ck-badge.no { background: #fef2f2; color: #dc2626; }

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

  .ck-error {
    color: #b91c1c;
    background: #fef2f2;
    border: 1px solid #fecaca;
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

  .ck-table tbody tr {
    opacity: 0;
    transform: translateY(8px);
    animation: ck-row-in 0.35s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  @keyframes ck-row-in {
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 900px) {
    .ck-stat-grid { grid-template-columns: repeat(2, 1fr); }
    .ck-two-col { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .ck-container { padding: 20px 16px 48px; }
    .ck-container.selector-mode { padding-top: 88px; }
    .ck-stat-grid { grid-template-columns: 1fr 1fr; }
    .ck-card { padding: 20px 16px; }
    .ck-card-header { flex-wrap: wrap; gap: 8px; }
  }
`;

const STATUS_BADGE = {
  done: { label: "완료", icon: <CheckCircle2 size={11} />, cls: "done" },
  wait: { label: "대기", icon: <Clock size={11} />, cls: "wait" },
  no: { label: "취소", icon: <XCircle size={11} />, cls: "no" },
};

const TICKET_COLOR_PALETTE = [
  { bg: "#eff4ff", color: "#1a4fd6", bar: "#1a4fd6" },
  { bg: "#f5f3ff", color: "#7c3aed", bar: "#8b5cf6" },
  { bg: "#ecfdf5", color: "#059669", bar: "#10b981" },
  { bg: "#fff7ed", color: "#c2410c", bar: "#f59e0b" },
  { bg: "#fef2f2", color: "#b91c1c", bar: "#ef4444" },
  { bg: "#eff6ff", color: "#1e40af", bar: "#3b82f6" },
];

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
  if (status === "CANCELLED" || status === "REJECTED") return "no";
  return "wait";
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

const buildRows = (programs, programApplies) => {
  const programById = new Map(
    programs.map((program) => [Number(program?.programId), program]),
  );

  return programApplies
    .map((apply) => {
      const program = programById.get(Number(apply?.programId));
      const status = normalizeApplyState(apply);
      const checkedInAt = apply?.checkedInAt ?? null;
      const createdAt = apply?.createdAt ?? null;

      return {
        key: apply?.programApplyId ?? `${apply?.programId}-${apply?.ticketNo ?? "-"}`,
        requestNo: apply?.ticketNo || `PA-${apply?.programApplyId ?? "-"}`,
        name: buildDisplayName(apply),
        ticket: program?.name || `프로그램 ${apply?.programId ?? "-"}`,
        gate: program?.category || "-",
        time: formatTime(checkedInAt),
        status,
        checkedInAt,
        createdAt,
      };
    })
    .sort((left, right) => {
      const leftTime = toValidDate(left.checkedInAt ?? left.createdAt)?.getTime() ?? 0;
      const rightTime = toValidDate(right.checkedInAt ?? right.createdAt)?.getTime() ?? 0;
      return rightTime - leftTime;
    });
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

function AnimStatCard({ label, rawValue, icon, bg, index }) {
  const count = useCountUp(rawValue, 1000, index * 120);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 100 + 50);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div className={`ck-stat-card anim-pop ${visible ? "visible" : ""}`}>
      <div className="ck-stat-icon" style={{ background: bg }}>
        {icon}
      </div>
      <div>
        <div className="ck-stat-label">{label}</div>
        <div className="ck-stat-value">{count.toLocaleString()}명</div>
      </div>
    </div>
  );
}

function AnimTicketProgress({ item, index }) {
  const [width, setWidth] = useState(0);
  const pct = item.total > 0 ? Math.round((item.done / item.total) * 100) : 0;
  const animatedDone = useCountUp(item.done, 800, index * 120 + 400);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), index * 140 + 400);
    return () => clearTimeout(timer);
  }, [index, pct]);

  return (
    <div className="ck-prog-item">
      <div className="ck-prog-header">
        <span className="ck-prog-name">{item.name}</span>
        <span className="ck-prog-val">
          {animatedDone.toLocaleString()}/{item.total.toLocaleString()}
        </span>
      </div>
      <div className="ck-prog-track">
        <div
          className="ck-prog-fill anim-progress-fill"
          style={{ width: `${width}%`, background: item.color }}
        />
      </div>
    </div>
  );
}

function AnimatedDonut({ doneCount, waitCount, noCount, total }) {
  const radius = 54;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = Math.max(total, 1);
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimProgress(1), 300);
    return () => clearTimeout(timer);
  }, []);

  const donePct = doneCount / safeTotal;
  const waitPct = waitCount / safeTotal;
  const noPct = noCount / safeTotal;

  const doneLen = circumference * donePct * animProgress;
  const waitLen = circumference * waitPct * animProgress;
  const noLen = circumference * noPct * animProgress;

  const doneDisplay = useCountUp(doneCount, 900, 200);
  const waitDisplay = useCountUp(waitCount, 900, 260);
  const noDisplay = useCountUp(noCount, 900, 320);
  const rateDisplay = useCountUp(Math.round(donePct * 100), 1000, 180);

  return (
    <div className="ck-ring-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f1f3f5" strokeWidth="14" />

        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#ef4444"
          strokeWidth="14"
          strokeDasharray={`${noLen} ${circumference - noLen}`}
          strokeDashoffset={-(doneLen + waitLen)}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="14"
          strokeDasharray={`${waitLen} ${circumference - waitLen}`}
          strokeDashoffset={-doneLen}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth="14"
          strokeDasharray={`${doneLen} ${circumference - doneLen}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="round"
        />

        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="#111827">
          {rateDisplay}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#9ca3af">
          체크인율
        </text>
      </svg>

      <div className="ck-ring-legend">
        <div className="ck-ring-legend-item">
          <div className="ck-ring-legend-dot" style={{ background: "#10b981" }} />
          완료
          <span className="ck-ring-legend-val">{doneDisplay.toLocaleString()}명</span>
        </div>
        <div className="ck-ring-legend-item">
          <div className="ck-ring-legend-dot" style={{ background: "#f59e0b" }} />
          대기
          <span className="ck-ring-legend-val">{waitDisplay.toLocaleString()}명</span>
        </div>
        <div className="ck-ring-legend-item">
          <div className="ck-ring-legend-dot" style={{ background: "#ef4444" }} />
          취소
          <span className="ck-ring-legend-val">{noDisplay.toLocaleString()}명</span>
        </div>
      </div>
    </div>
  );
}

function CheckinContent({ eventId }) {
  const numericEventId = Number(eventId);
  const { tick } = useAutoRefresh(15000);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [eventDetail, setEventDetail] = useState(null);
  const [checkinRows, setCheckinRows] = useState([]);
  const [lastLoadedAt, setLastLoadedAt] = useState(new Date());

  const loadData = useCallback(
    async ({ preserveLoading = false } = {}) => {
      if (!numericEventId || Number.isNaN(numericEventId)) {
        setErrorMsg("잘못된 행사 경로입니다.");
        setCheckinRows([]);
        setLoading(false);
        return;
      }

      if (!preserveLoading) setLoading(true);

      try {
        const [eventResponse, programs] = await Promise.all([
          eventApi.getEventDetail(numericEventId),
          fetchProgramsByEvent(numericEventId),
        ]);

        const eventPayload = unwrapData(eventResponse, null);

        const applyGroups = await Promise.all(
          programs.map((program) => fetchAllProgramApplies(program?.programId)),
        );
        const allProgramApplies = applyGroups.flat();

        setEventDetail(eventPayload);
        setCheckinRows(buildRows(programs, allProgramApplies));
        setErrorMsg("");
        setLastLoadedAt(new Date());
      } catch (error) {
        console.error("[Realtime Checkin] load failed:", error);
        setErrorMsg("체크인 데이터를 불러오지 못했습니다.");
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

  const ticketToneByName = useMemo(() => {
    const toneMap = new Map();
    let colorIndex = 0;

    checkinRows.forEach((row) => {
      if (!toneMap.has(row.ticket)) {
        toneMap.set(row.ticket, TICKET_COLOR_PALETTE[colorIndex % TICKET_COLOR_PALETTE.length]);
        colorIndex += 1;
      }
    });

    return toneMap;
  }, [checkinRows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return checkinRows.filter((row) => {
      const filterMatched = filter === "all" || row.status === filter;
      if (!filterMatched) return false;

      if (!normalizedQuery) return true;

      const target = `${row.requestNo} ${row.name} ${row.ticket} ${row.gate}`.toLowerCase();
      return target.includes(normalizedQuery);
    });
  }, [checkinRows, filter, query]);

  const visibleRows = useStaggerIn(filteredRows.length, 30);

  const doneCount = useMemo(
    () => checkinRows.filter((row) => row.status === "done").length,
    [checkinRows],
  );
  const waitCount = useMemo(
    () => checkinRows.filter((row) => row.status === "wait").length,
    [checkinRows],
  );
  const noCount = useMemo(
    () => checkinRows.filter((row) => row.status === "no").length,
    [checkinRows],
  );
  const totalCount = checkinRows.length;

  const ticketStats = useMemo(() => {
    const grouped = new Map();

    checkinRows.forEach((row) => {
      const existing = grouped.get(row.ticket) ?? {
        name: row.ticket,
        done: 0,
        total: 0,
      };
      existing.total += 1;
      if (row.status === "done") existing.done += 1;
      grouped.set(row.ticket, existing);
    });

    return Array.from(grouped.values())
      .sort((left, right) => right.total - left.total)
      .slice(0, 6)
      .map((item) => ({
        ...item,
        color: ticketToneByName.get(item.name)?.bar || "#1a4fd6",
      }));
  }, [checkinRows, ticketToneByName]);

  const stats = useMemo(
    () => [
      {
        label: "전체 신청",
        rawValue: totalCount,
        icon: <Users size={20} color="#1a4fd6" />,
        bg: "#eff4ff",
      },
      {
        label: "체크인 완료",
        rawValue: doneCount,
        icon: <CheckCircle2 size={20} color="#10b981" />,
        bg: "#ecfdf5",
      },
      {
        label: "체크인 대기",
        rawValue: waitCount,
        icon: <Clock size={20} color="#f59e0b" />,
        bg: "#fffbeb",
      },
      {
        label: "취소/거절",
        rawValue: noCount,
        icon: <XCircle size={20} color="#ef4444" />,
        bg: "#fef2f2",
      },
    ],
    [doneCount, noCount, totalCount, waitCount],
  );

  if (loading && !eventDetail) {
    return (
      <div className="ck-card">
        <div className="ck-empty">체크인 데이터를 불러오는 중입니다.</div>
      </div>
    );
  }

  return (
    <>
      {errorMsg ? <div className="ck-error">{errorMsg}</div> : null}

      <div className="ck-live-header">
        <div>
          <div className="rt-live-badge anim-glow">
            <div className="rt-live-dot" />
            LIVE
          </div>
          <div className="ck-live-meta">
            <span>{eventDetail?.eventName || "행사 정보 없음"}</span>
            <span>·</span>
            <span>실시간 체크인</span>
          </div>
        </div>

        <div className="ck-live-header-right">
          <span className="ck-timestamp">마지막 갱신: {formatTimestamp(lastLoadedAt)}</span>
          <button
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6b7280",
              transition: "all 0.15s",
            }}
            onClick={refresh}
            title="새로고침"
          >
            <RefreshCw
              size={14}
              style={{
                animation: spinning ? "anim-spin 0.8s cubic-bezier(0.4,0,0.2,1)" : "none",
              }}
            />
          </button>
        </div>
      </div>

      <div className="ck-stat-grid">
        {stats.map((stat, index) => (
          <AnimStatCard key={stat.label} {...stat} index={index} />
        ))}
      </div>

      <div className="ck-two-col">
        <div className="ck-card" style={{ padding: "24px" }}>
          <div className="ck-card-header">
            <div className="ck-card-title">
              <div className="ck-card-title-icon">
                <UserCheck size={14} color="#1a4fd6" />
              </div>
              체크인 비율
            </div>
          </div>

          <AnimatedDonut
            doneCount={doneCount}
            waitCount={waitCount}
            noCount={noCount}
            total={totalCount}
          />

          <div style={{ borderTop: "1px solid #f1f3f5", paddingTop: 16 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 12,
              }}
            >
              프로그램별 체크인
            </div>
            <div className="ck-prog-list">
              {ticketStats.length === 0 ? (
                <div className="ck-empty" style={{ padding: "16px 0" }}>
                  프로그램 체크인 데이터가 없습니다.
                </div>
              ) : (
                ticketStats.map((item, index) => (
                  <AnimTicketProgress key={item.name} item={item} index={index} />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="ck-card" style={{ padding: "24px" }}>
          <div className="ck-card-header">
            <div className="ck-card-title">
              <div className="ck-card-title-icon">
                <ScanLine size={14} color="#1a4fd6" />
              </div>
              체크인 목록
            </div>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              총 {filteredRows.length.toLocaleString()}건
            </span>
          </div>

          <div className="ck-toolbar">
            <div className="ck-search-wrap">
              <Search size={15} className="ck-search-icon" />
              <input
                className="ck-search"
                placeholder="이름/신청번호/프로그램 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            {[
              { key: "all", label: "전체" },
              { key: "done", label: "완료" },
              { key: "wait", label: "대기" },
              { key: "no", label: "취소" },
            ].map((item) => (
              <button
                key={item.key}
                className={`ck-filter-btn${filter === item.key ? " active" : ""}`}
                onClick={() => setFilter(item.key)}
              >
                <ListFilter size={13} />
                {item.label}
              </button>
            ))}
          </div>

          <div className="ck-table-wrap">
            <table className="ck-table">
              <thead>
                <tr>
                  <th>신청번호</th>
                  <th>참가자</th>
                  <th>프로그램</th>
                  <th>구분</th>
                  <th>체크인 시각</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="ck-empty">
                      표시할 체크인 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const badge = STATUS_BADGE[row.status] ?? STATUS_BADGE.wait;
                    const tone =
                      ticketToneByName.get(row.ticket) ?? {
                        bg: "#eff4ff",
                        color: "#1a4fd6",
                      };

                    return (
                      <tr
                        key={row.key}
                        className={`anim-slide-right ${visibleRows.includes(index) ? "visible" : ""}`}
                        style={{ animationDelay: `${index * 20}ms` }}
                      >
                        <td style={{ color: "#9ca3af", fontSize: 12 }}>{row.requestNo}</td>
                        <td style={{ fontWeight: 600, color: "#111827" }}>{row.name}</td>
                        <td>
                          <span className="ck-ticket-chip" style={{ background: tone.bg, color: tone.color }}>
                            {row.ticket}
                          </span>
                        </td>
                        <td style={{ color: "#6b7280" }}>{row.gate}</td>
                        <td style={{ color: "#6b7280" }}>{row.time}</td>
                        <td>
                          <span className={`ck-badge ${badge.cls}`}>
                            {badge.icon}
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
    if (eventId) {
      navigate(`${path}/${eventId}`);
      return;
    }
    navigate(path);
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
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
      ) : null}

      <main className={`ck-container${eventId ? "" : " selector-mode"}`}>
        {eventId ? (
          <CheckinContent eventId={eventId} />
        ) : (
          <RealtimeEventSelector onSelectEvent={handleSelectEvent} pageTitle="체크인 현황" />
        )}
      </main>
    </div>
  );
}
