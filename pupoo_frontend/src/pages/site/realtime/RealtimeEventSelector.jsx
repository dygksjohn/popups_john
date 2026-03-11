import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Radio,
  Signal,
  CalendarDays,
  MapPin,
  Search,
} from "lucide-react";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import { aiApi } from "../../../app/http/aiApi";
import { getToken } from "../../../api/noticeApi";
import { sortAdminEventsByOperationalPriority } from "../../admin/shared/adminStatus";
import { normalizePrediction } from "./aiCongestionViewModel";

const STATUS_CONFIG = {
  live: {
    label: "LIVE",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  upcoming: {
    label: "\uC608\uC815",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  ended: {
    label: "\uC885\uB8CC",
    color: "#6b7280",
    bg: "#f3f4f6",
    border: "#e5e7eb",
  },
  cancelled: {
    label: "\uCDE8\uC18C",
    color: "#b91c1c",
    bg: "#fef2f2",
    border: "#fecaca",
  },
};

const EVENT_VIEW_BUTTONS = [
  { key: "dashboard", label: "\uD1B5\uD569 \uD604\uD669", path: "/realtime/dashboard" },
  { key: "waiting", label: "\uB300\uAE30 \uD604\uD669", path: "/realtime/waitingstatus" },
  { key: "checkin", label: "\uCCB4\uD06C\uC778 \uD604\uD669", path: "/realtime/checkinstatus" },
  { key: "vote", label: "\uD22C\uD45C \uD604\uD669", path: "/realtime/votestatus" },
];

const selectorStyles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .rte-selector {
    max-width: 1400px;
    margin: 0 auto;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
  }
  .rte-selector *, .rte-selector *::before, .rte-selector *::after {
    box-sizing: border-box;
    font-family: inherit;
  }
  .rte-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .rte-topbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .rte-monitor-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #1e293b, #334155);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(30,41,59,0.18);
  }
  .rte-topbar-title {
    font-size: 15px; font-weight: 700; color: #111827;
    line-height: 1.3;
  }
  .rte-topbar-desc {
    font-size: 12px; color: #9ca3af; margin-top: 1px;
  }
  .rte-search-wrap {
    position: relative;
    width: 260px;
  }
  .rte-search-input {
    width: 100%;
    height: 38px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 0 14px 0 36px;
    font-size: 13px;
    color: #374151;
    background: #fff;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .rte-search-input::placeholder { color: #c4c9d4; }
  .rte-search-input:focus {
    border-color: #1a4fd6;
    box-shadow: 0 0 0 3px rgba(26,79,214,0.08);
  }
  .rte-search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #c4c9d4;
    pointer-events: none;
  }
  .rte-filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .rte-filter-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    min-width: 0;
  }
  .rte-filter-tab {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    background: #fff;
    font-size: 12.5px;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
    display: flex; align-items: center; gap: 5px;
  }
  .rte-filter-tab:hover { border-color: #cbd5e1; background: #f8fafc; }
  .rte-filter-tab.active {
    background: #1e293b;
    border-color: #1e293b;
    color: #fff;
  }
  .rte-filter-count {
    font-size: 10px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 100px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.06);
  }
  .rte-filter-tab.active .rte-filter-count {
    background: rgba(255,255,255,0.2);
  }
  .rte-event-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .rte-event-row {
    background: #fff;
    border: 1.5px solid #e9ecef;
    border-radius: 14px;
    padding: 20px 24px;
    display: grid;
    grid-template-columns: 74px minmax(220px, 1fr) 240px minmax(320px, 420px);
    align-items: center;
    gap: 20px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
    opacity: 0;
    transform: translateY(12px);
    animation: rte-row-in 0.4s ease forwards;
  }
  .rte-event-row::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 0;
    background: linear-gradient(135deg, #1e293b, #334155);
    transition: width 0.25s ease;
    border-radius: 14px 0 0 14px;
  }
  .rte-event-row:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    transform: translateY(-1px);
  }
  .rte-event-row:hover::before {
    width: 4px;
  }
  .rte-event-row.live-row {
    border-color: #fecaca;
    background: linear-gradient(135deg, #fffbfb, #fff);
  }
  .rte-event-row.live-row:hover {
    border-color: #f87171;
    box-shadow: 0 4px 24px rgba(239,68,68,0.1);
  }
  .rte-event-row.live-row::before {
    width: 4px;
    background: linear-gradient(180deg, #ef4444, #dc2626);
  }
  .rte-status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    border: 1px solid;
    min-width: 54px;
  }
  .rte-live-pulse {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #ef4444;
    animation: rte-pulse 1.4s ease-in-out infinite;
  }
  @keyframes rte-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }
  .rte-event-info { min-width: 0; }
  .rte-event-name {
    font-size: 15px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rte-event-meta {
    display: flex;
    column-gap: 14px;
    row-gap: 4px;
    align-items: center;
    flex-wrap: wrap;
  }
  .rte-meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #9ca3af;
  }
  .rte-event-actions {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
  }
  .rte-event-action-btn {
    height: 34px;
    border-radius: 9px;
    border: 1px solid #dbe2ea;
    background: #fff;
    color: #475569;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 0 10px;
    white-space: nowrap;
  }
  .rte-event-action-btn:hover {
    border-color: #94a3b8;
    color: #1e293b;
    background: #f8fafc;
  }
  .rte-event-action-btn.active {
    background: #1e293b;
    border-color: #1e293b;
    color: #fff;
  }
  .rte-metrics {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .rte-metric {
    text-align: center;
    min-width: 56px;
  }
  .rte-metric-value {
    font-size: 18px;
    font-weight: 800;
    color: #111827;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .rte-metric-label {
    font-size: 10.5px;
    color: #9ca3af;
    margin-top: 4px;
    font-weight: 500;
  }
  .rte-metric-divider {
    width: 1px;
    height: 28px;
    background: #f1f3f5;
  }
  .rte-empty {
    text-align: center;
    padding: 60px 20px;
    color: #9ca3af;
  }
  .rte-empty-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 12px;
  }
  .rte-empty-text { font-size: 14px; font-weight: 600; color: #6b7280; }
  .rte-empty-sub { font-size: 12px; margin-top: 4px; }
  @keyframes rte-row-in {
    to { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 900px) {
    .rte-event-row {
      grid-template-columns: auto 1fr;
      gap: 14px;
    }
    .rte-event-actions {
      grid-column: 1 / -1;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .rte-metrics { display: none; }
  }
  @media (max-width: 640px) {
    .rte-topbar { flex-direction: column; align-items: flex-start; }
    .rte-filters { flex-direction: column; align-items: stretch; }
    .rte-filter-tabs { width: 100%; }
    .rte-search-wrap { width: 100%; }
    .rte-event-row { padding: 16px 18px; }
  }
`;

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

const toDateKey = (value) => {
  const date = toValidDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

const buildOperationRangeByDate = (startAt, endAt, dateKey) => {
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

const resolveEventAiRangeParams = (event, status) => {
  const dateOptions = buildDateKeysFromRange(event?.startAt, event?.endAt);
  if (dateOptions.length === 0) {
    return {};
  }

  const todayKey = toDateKey(new Date());
  const selectedDateKey =
    status === "active" && dateOptions.includes(todayKey)
      ? todayKey
      : dateOptions[0];

  const operationRange = buildOperationRangeByDate(
    event?.startAt,
    event?.endAt,
    selectedDateKey,
  );

  if (!operationRange.startAt || !operationRange.endAt) {
    return {};
  }

  return {
    from: operationRange.startAt,
    to: operationRange.endAt,
  };
};

const congestionLevelToPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.min(Math.round(numeric * 20), 100);
};

const formatDateRange = (startAt, endAt) => {
  const start = startAt ? new Date(startAt) : null;
  const end = endAt ? new Date(endAt) : null;
  const validStart = start && !Number.isNaN(start.getTime()) ? start : null;
  const validEnd = end && !Number.isNaN(end.getTime()) ? end : null;

  if (!validStart && !validEnd) return "\uC77C\uC815 \uC815\uBCF4 \uC5C6\uC74C";
  if (validStart && validEnd) {
    return `${validStart.getFullYear()}.${String(validStart.getMonth() + 1).padStart(2, "0")}.${String(validStart.getDate()).padStart(2, "0")} ~ ${validEnd.getFullYear()}.${String(validEnd.getMonth() + 1).padStart(2, "0")}.${String(validEnd.getDate()).padStart(2, "0")}`;
  }
  const target = validStart || validEnd;
  return `${target.getFullYear()}.${String(target.getMonth() + 1).padStart(2, "0")}.${String(target.getDate()).padStart(2, "0")}`;
};

const toAdminStatus = (status) => {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "ONGOING") return "active";
  if (normalized === "ENDED" || normalized === "CANCELLED") return "ended";
  return "pending";
};

const toSelectorStatus = (status) => {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "ONGOING") return "live";
  if (normalized === "ENDED") return "ended";
  if (normalized === "CANCELLED") return "cancelled";
  return "upcoming";
};

const FILTER_VALUES = new Set(["all", "live", "upcoming", "ended"]);

const normalizeFilterValue = (value) =>
  FILTER_VALUES.has(String(value)) ? String(value) : "all";

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

export default function RealtimeEventSelector({ onSelectEvent, pageTitle, programCategory }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(() =>
    normalizeFilterValue(searchParams.get("status")),
  );
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentRealtimePath = useMemo(() => {
    const pathname = String(location.pathname || "");
    if (pathname.startsWith("/realtime/dashboard")) return "/realtime/dashboard";
    if (pathname.startsWith("/realtime/waitingstatus")) return "/realtime/waitingstatus";
    if (pathname.startsWith("/realtime/checkinstatus")) return "/realtime/checkinstatus";
    if (pathname.startsWith("/realtime/votestatus")) return "/realtime/votestatus";
    return "";
  }, [location.pathname]);

  useEffect(() => {
    const nextFilter = normalizeFilterValue(searchParams.get("status"));
    setFilter((prev) => (prev === nextFilter ? prev : nextFilter));
  }, [searchParams]);

  const handleFilterChange = (nextFilter) => {
    const normalized = normalizeFilterValue(nextFilter);
    setFilter(normalized);

    const nextParams = new URLSearchParams(searchParams);
    if (normalized === "all") {
      nextParams.delete("status");
    } else {
      nextParams.set("status", normalized);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleSelectEventView = (eventId, targetPath, event) => {
    event.stopPropagation();
    navigate(`${targetPath}/${eventId}`);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      try {
        const [eventsResponse, performanceRows] = await Promise.all([
          eventApi.getEvents({ page: 0, size: 120, sort: "startAt,asc" }),
          fetchAdminData("/api/admin/analytics/events", { page: 0, size: 200 }, []),
        ]);

        const rawEvents = toArray(unwrapData(eventsResponse, { content: [] }));
        const performanceMap = new Map(
          toArray(performanceRows).map((row) => [Number(row.eventId), row]),
        );

        const sortedEvents = sortAdminEventsByOperationalPriority(
          rawEvents.map((event) => ({
            ...event,
            status: toAdminStatus(event.status),
          })),
        );

        const eventAvailabilityMap = programCategory
          ? new Map(
              await Promise.all(
                sortedEvents.map(async (event) => {
                  try {
                    const response = await programApi.getPrograms({
                      eventId: Number(event.eventId),
                      category: programCategory,
                      page: 0,
                      size: 1,
                      sort: "startAt,asc",
                    });
                    const totalElements = Number(response?.data?.data?.totalElements ?? 0);
                    return [Number(event.eventId), totalElements > 0];
                  } catch {
                    return [Number(event.eventId), false];
                  }
                }),
              ),
            )
          : null;

        const visibleEvents = eventAvailabilityMap
          ? sortedEvents.filter((event) => eventAvailabilityMap.get(Number(event.eventId)))
          : sortedEvents;

        const congestionTargets = visibleEvents.filter((event) => {
          const status = String(event.status).toLowerCase();
          return status === "active" || status === "pending";
        });

        const congestionEntries = await Promise.all(
          congestionTargets.map(async (event) => {
            const eventId = Number(event.eventId);
            const status = String(event.status).toLowerCase();

            if (status === "active") {
              const payload = await fetchAdminData(
                `/api/admin/dashboard/realtime/events/${event.eventId}/congestions`,
                { limit: 60 },
                [],
              );
              const values = toArray(payload)
                .map((row) => congestionLevelToPercent(row.congestionLevel))
                .filter((value) => Number.isFinite(value) && value > 0);
              const average = values.length
                ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
                : null;

              if (average != null) {
                return [eventId, average];
              }
            }

            // For active/pending events: fallback (or primary for pending) with AI prediction.
            try {
              const aiRangeParams = resolveEventAiRangeParams(event, status);
              const aiResponse = await aiApi.predictEventCongestion(eventId, aiRangeParams);
              const aiPrediction = normalizePrediction(unwrapData(aiResponse, null));
              const aiAverage = aiPrediction
                ? Math.round(Number(aiPrediction.avgScore) || 0)
                : null;
              return [eventId, Number.isFinite(aiAverage) ? aiAverage : null];
            } catch {
              return [eventId, null];
            }
          }),
        );

        const congestionMap = new Map(congestionEntries);

        if (!mounted) return;

        setEvents(
          visibleEvents.map((event, index) => {
            const rawStatus = String(rawEvents.find((row) => Number(row.eventId) === Number(event.eventId))?.status ?? event.status).toUpperCase();
            const performance = performanceMap.get(Number(event.eventId));
            const registrations =
              Number(
                performance?.activeRegistrationCount ??
                performance?.approvedRegistrationCount,
              ) || 0;
            const checkedInRaw = Number(performance?.checkinCount) || 0;
            const checkedIn = rawStatus === "PLANNED" ? 0 : checkedInRaw;
            return {
              id: event.eventId,
              name: event.eventName,
              date: formatDateRange(event.startAt, event.endAt),
              location: event.location || "\uC7A5\uC18C \uC815\uBCF4 \uC5C6\uC74C",
              rawStatus,
              status: toSelectorStatus(rawStatus),
              registrations,
              checkedIn,
              congestion: congestionMap.get(Number(event.eventId)),
              delay: index * 60,
            };
          }),
        );
      } catch (error) {
        console.error("[RealtimeEventSelector] load failed:", error);
        if (mounted) setEvents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const keyword = search.trim().toLowerCase();
      const matchSearch =
        keyword === "" ||
        event.name.toLowerCase().includes(keyword) ||
        event.location.toLowerCase().includes(keyword) ||
        event.date.toLowerCase().includes(keyword);
      const matchFilter =
        filter === "all" ||
        event.status === filter ||
        (filter === "ended" && event.status === "cancelled");
      return matchSearch && matchFilter;
    });
  }, [events, filter, search]);

  const counts = {
    all: events.length,
    live: events.filter((event) => event.status === "live").length,
    upcoming: events.filter((event) => event.status === "upcoming").length,
    ended: events.filter((event) => event.status === "ended" || event.status === "cancelled").length,
  };

  return (
    <>
      <style>{selectorStyles}</style>
      <div className="rte-selector">
        <div className="rte-topbar">
          <div className="rte-topbar-left">
            <div className="rte-monitor-icon">
              <Signal size={18} color="#fff" />
            </div>
            <div>
              <div className="rte-topbar-title">
                {"\uBAA8\uB2C8\uD130\uB9C1\uD560 \uD589\uC0AC\uB97C \uC120\uD0DD\uD558\uC138\uC694"}
              </div>
              <div className="rte-topbar-desc">
                {pageTitle} {"\uD654\uBA74\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4"}
              </div>
            </div>
          </div>        </div>

        <div className="rte-filters">
          <div className="rte-filter-tabs">
            {[
              { key: "all", label: "\uC804\uCCB4" },
              { key: "live", label: "\uC9C4\uD589\uC911" },
              { key: "upcoming", label: "\uC608\uC815" },
              { key: "ended", label: "\uC885\uB8CC" },
            ].map((item) => (
              <button
                key={item.key}
                className={`rte-filter-tab ${filter === item.key ? "active" : ""}`}
                onClick={() => handleFilterChange(item.key)}
              >
                {item.label}
                <span className="rte-filter-count">{counts[item.key]}</span>
              </button>
            ))}
          </div>
          <div className="rte-search-wrap">
            <Search size={14} className="rte-search-icon" />
            <input
              className="rte-search-input"
              type="text"
              placeholder={"\uD589\uC0AC\uBA85 \uB610\uB294 \uC7A5\uC18C \uAC80\uC0C9..."}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="rte-event-list">
          {loading ? (
            <div className="rte-empty">
              <div className="rte-empty-icon">
                <Radio size={20} color="#9ca3af" />
              </div>
              <div className="rte-empty-text">{"\uD589\uC0AC \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4"}</div>
              <div className="rte-empty-sub">{"\uC2E4\uC81C \uD589\uC0AC \uB370\uC774\uD130\uB97C \uC5F0\uACB0\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4"}</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rte-empty">
              <div className="rte-empty-icon">
                <Search size={20} color="#9ca3af" />
              </div>
              <div className="rte-empty-text">{"\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4"}</div>
              <div className="rte-empty-sub">{"\uB2E4\uB978 \uAC80\uC0C9\uC5B4\uB098 \uD544\uD130\uB97C \uC2DC\uB3C4\uD574\uBCF4\uC138\uC694"}</div>
            </div>
          ) : (
            filtered.map((event) => {
              const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.upcoming;
              return (
                <div
                  key={event.id}
                  className={`rte-event-row ${event.status === "live" ? "live-row" : ""}`}
                  style={{ animationDelay: `${event.delay}ms` }}
                  onClick={() => onSelectEvent?.(event.id)}
                >
                  <div
                    className="rte-status-badge"
                    style={{
                      color: statusConfig.color,
                      background: statusConfig.bg,
                      borderColor: statusConfig.border,
                    }}
                  >
                    {event.status === "live" ? <span className="rte-live-pulse" /> : null}
                    {statusConfig.label}
                  </div>

                  <div className="rte-event-info">
                    <div className="rte-event-name">{event.name}</div>
                    <div className="rte-event-meta">
                      <span className="rte-meta-item">
                        <CalendarDays size={12} />
                        {event.date}
                      </span>
                      <span className="rte-meta-item">
                        <MapPin size={12} />
                        {event.location}
                      </span>
                    </div>
                  </div>

                  <div className="rte-metrics">
                    <div className="rte-metric">
                      <div className="rte-metric-value">
                        {event.registrations.toLocaleString()}
                      </div>
                      <div className="rte-metric-label">{"\uC0AC\uC804\uB4F1\uB85D"}</div>
                    </div>
                    <div className="rte-metric-divider" />
                    <div className="rte-metric">
                      <div
                        className="rte-metric-value"
                        style={{
                          color: event.checkedIn > 0 ? "#10b981" : "#d1d5db",
                        }}
                      >
                        {event.status === "upcoming" ? "-" : event.checkedIn.toLocaleString()}
                      </div>
                      <div className="rte-metric-label">{"\uCCB4\uD06C\uC778"}</div>
                    </div>
                    <div className="rte-metric-divider" />
                    <div className="rte-metric">
                      <div
                        className="rte-metric-value"
                        style={{
                          color: event.congestion != null ? "#d97706" : "#d1d5db",
                        }}
                      >
                        {event.congestion != null ? `${event.congestion}%` : "-"}
                      </div>
                      <div className="rte-metric-label">
                        {event.rawStatus === "PLANNED" ||
                        event.status === "upcoming" ||
                        event.status === "pending"
                          ? "\uC608\uC0C1 \uD63C\uC7A1"
                          : "\uD3C9\uADE0 \uD63C\uC7A1"}
                      </div>
                    </div>
                  </div>

                  <div className="rte-event-actions">
                    {EVENT_VIEW_BUTTONS.map((view) => (
                      <button
                        key={`${event.id}-${view.key}`}
                        type="button"
                        className={`rte-event-action-btn${currentRealtimePath === view.path ? " active" : ""}`}
                        onClick={(clickEvent) =>
                          handleSelectEventView(event.id, view.path, clickEvent)
                        }
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

