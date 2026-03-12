import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  Clock3,
  Layers3,
  MapPin,
  ChevronRight,
  Sparkles,
  Search,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import PageLoading from "../components/PageLoading";
import EmptyState from "../components/EmptyState";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import { boothApi } from "../../../app/http/boothApi";
import {
  loadImageCache as loadProgramImageCache,
  injectProgramImages,
} from "../../admin/shared/programImageStore";

const PROGRAM_STATUS_CATEGORIES = [
  { label: "현재 진행 프로그램", path: "/program/current" },
  { label: "예정 프로그램", path: "/program/upcoming" },
  { label: "종료 프로그램", path: "/program/closed" },
];

const CATEGORY_FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "SESSION", label: "세션/강연" },
  { key: "EXPERIENCE", label: "체험존" },
  { key: "CONTEST", label: "콘테스트 및 투표" },
];

const PAGE_CONFIG = {
  current: {
    title: "현재 진행 프로그램",
    subtitle: "현재 진행 행사에 속한 프로그램을 확인하세요",
  },
  upcoming: {
    title: "예정 프로그램",
    subtitle: "예정 행사에 속한 프로그램을 미리 확인하세요",
  },
  closed: {
    title: "종료 프로그램",
    subtitle: "종료 행사에 속한 프로그램 이력을 확인하세요",
  },
};

const styles = `
  .ps-root { background:#f8f9fc; min-height:100vh; }
  .ps-wrap { max-width:1400px; margin:0 auto; padding:32px 25px 64px; }

  .ps-toolbar {
    display:flex; align-items:center; justify-content:space-between; gap:14px;
    flex-wrap:wrap; margin-bottom:18px;
  }
  .ps-toolbar-left {
    display:flex; align-items:center; gap:10px;
    min-width:0; flex:1 1 auto;
  }
  .ps-select {
    width:240px; min-width:240px; height:42px; padding:0 14px; border-radius:10px;
    border:1px solid #dbe2ea; background:#fff; color:#111827; font-size:13px;
    flex:0 0 240px;
  }
  .ps-search-wrap {
    position:relative;
    min-width:280px;
    width:320px;
    flex:0 0 320px;
  }
  .ps-search-input {
    width:100%; height:42px; padding:0 14px 0 38px; border-radius:10px;
    border:1px solid #dbe2ea; background:#fff; color:#111827; font-size:13px;
    outline:none; transition:border-color .15s ease, box-shadow .15s ease;
  }
  .ps-search-input:focus {
    border-color:#1a4fd6;
    box-shadow:0 0 0 3px rgba(26,79,214,.08);
  }
  .ps-search-icon {
    position:absolute; left:13px; top:50%; transform:translateY(-50%);
    color:#94a3b8; pointer-events:none;
  }
  .ps-filter { display:flex; gap:8px; flex-wrap:wrap; }
  .ps-filter button {
    border:1px solid #dbe2ea; background:#fff; color:#6b7280;
    padding:8px 14px; border-radius:999px; font-size:12px; font-weight:700; cursor:pointer;
    transition:all .15s ease;
  }
  .ps-filter button.active { background:#1a4fd6; border-color:#1a4fd6; color:#fff; }

  .ps-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px; }
  .ps-stat {
    background:#fff; border:1px solid #e9ecef; border-radius:14px; padding:18px 20px;
    display:flex; align-items:center; gap:12px;
  }
  .ps-stat-icon {
    width:42px; height:42px; border-radius:11px; display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
  }
  .ps-stat-label { font-size:12px; color:#6b7280; }
  .ps-stat-value { font-size:22px; font-weight:800; color:#111827; }

  .ps-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
  .ps-card {
    background:#fff; border:1px solid #e9ecef; border-radius:16px; overflow:hidden;
    display:flex; flex-direction:column; transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
    cursor:pointer;
  }
  .ps-card:hover { transform:translateY(-3px); box-shadow:0 12px 30px rgba(15,23,42,0.08); border-color:#bfdbfe; }
  .ps-card.done { opacity:0.76; }
  .ps-thumb {
    width:100%; aspect-ratio:16/10; background:linear-gradient(135deg,#eff6ff 0%,#f8fafc 100%);
    position:relative; overflow:hidden;
  }
  .ps-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
  .ps-thumb-ph {
    position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
    color:#bfccdf;
  }
  .ps-thumb-ph span { font-size:12px; font-weight:600; color:#b0bcce; }
  .ps-badges {
    position:absolute; top:12px; left:12px; right:12px; display:flex; justify-content:space-between; gap:8px;
  }
  .ps-badge {
    display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:999px;
    font-size:11px; font-weight:700; backdrop-filter:blur(6px);
  }
  .ps-badge.live { background:#ecfdf5; color:#059669; }
  .ps-badge.upcoming { background:#fff7ed; color:#d97706; }
  .ps-badge.done { background:#f3f4f6; color:#6b7280; }
  .ps-event-badge {
    display:inline-flex; align-items:center; max-width:55%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    background:rgba(17,24,39,.72); color:#fff; padding:4px 10px; border-radius:999px; font-size:10px; font-weight:700;
  }
  .ps-body { padding:16px; display:flex; flex-direction:column; gap:11px; flex:1; }
  .ps-card-top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .ps-category {
    display:inline-flex; align-items:center; padding:3px 9px; border-radius:999px; font-size:10px; font-weight:700;
    background:#eff4ff; color:#1a4fd6;
  }
  .ps-title { font-size:16px; font-weight:800; color:#111827; line-height:1.35; }
  .ps-desc {
    font-size:12.5px; color:#6b7280; line-height:1.55; min-height:38px;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
  }
  .ps-meta { display:flex; flex-direction:column; gap:7px; font-size:12px; color:#6b7280; }
  .ps-meta-row { display:flex; align-items:center; gap:6px; }
  .ps-footer {
    margin-top:auto; padding-top:10px; border-top:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between; gap:8px;
  }
  .ps-footer button {
    border:none; background:none; color:#1a4fd6; font-size:12px; font-weight:700; cursor:pointer;
    display:inline-flex; align-items:center; gap:4px;
  }

  .ps-empty {
    background:#fff; border:1px solid #e9ecef; border-radius:16px; padding:70px 24px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; color:#94a3b8;
  }
  .ps-empty strong { color:#475569; margin-bottom:6px; }

  @media (max-width:1100px) { .ps-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width:760px) {
    .ps-wrap { padding:20px 16px 48px; }
    .ps-stats { grid-template-columns:repeat(2,1fr); }
    .ps-grid { grid-template-columns:1fr; }
    .ps-toolbar-left { width:100%; flex-wrap:wrap; }
    .ps-select, .ps-search-wrap { width:100%; min-width:0; }
  }
`;

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return "일정 미정";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

function formatTime(value) {
  const match = String(value ?? "").match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffDays(dateA, dateB) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (startOfDay(dateA).getTime() - startOfDay(dateB).getTime()) / oneDay,
  );
}

function rebaseProgramDate(value, sourceBaseDate, targetBaseDate) {
  const original = toDate(value);
  if (!original || !sourceBaseDate || !targetBaseDate) return original;
  const offsetDays = diffDays(original, sourceBaseDate);
  const rebased = new Date(startOfDay(targetBaseDate));
  rebased.setDate(rebased.getDate() + offsetDays);
  rebased.setHours(
    original.getHours(),
    original.getMinutes(),
    original.getSeconds(),
    original.getMilliseconds(),
  );
  return rebased;
}

function formatDateTimeRange(startAt, endAt) {
  if (!startAt && !endAt) return "일정 미정";
  const dayText = startAt ? formatDate(startAt) : formatDate(endAt);
  const startText = formatTime(startAt);
  const endText = formatTime(endAt);
  if (startText && endText) return `${dayText} ${startText}~${endText}`;
  if (startText || endText) return `${dayText} ${startText || endText}`.trim();
  return dayText;
}

function toProgramRuntimeStatus(startAt, endAt) {
  const now = Date.now();
  const startTs = startAt?.getTime?.() ?? Number.NaN;
  const endTs = endAt?.getTime?.() ?? Number.NaN;
  if (Number.isFinite(startTs) && now < startTs) return "upcoming";
  if (Number.isFinite(endTs) && now > endTs) return "done";
  return "live";
}

function getPageApiStatus(statusKey) {
  if (statusKey === "current") return "ONGOING";
  if (statusKey === "upcoming") return "PLANNED";
  return "ENDED";
}

function toEventPageStatus(item) {
  const raw = String(item?.status ?? item?.eventStatus ?? "").toUpperCase();
  if (raw.includes("ONGOING") || raw.includes("LIVE")) return "current";
  if (raw.includes("PLANNED") || raw.includes("UPCOMING")) return "upcoming";
  if (raw.includes("END")) return "closed";
  const startAt = toDate(item?.startAt ?? item?.startDateTime);
  const endAt = toDate(item?.endAt ?? item?.endDateTime);
  const now = Date.now();
  if (endAt && now > endAt.getTime()) return "closed";
  if (startAt && now >= startAt.getTime()) return "current";
  return "upcoming";
}

function sortEventsByPage(events, statusKey) {
  const list = [...events];
  if (statusKey === "current") {
    return list.sort((a, b) => {
      const aTime = toDate(a?.endAt ?? a?.endDateTime)?.getTime() ?? Number.POSITIVE_INFINITY;
      const bTime = toDate(b?.endAt ?? b?.endDateTime)?.getTime() ?? Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
  }
  if (statusKey === "upcoming") {
    return list.sort((a, b) => {
      const aTime = toDate(a?.startAt ?? a?.startDateTime)?.getTime() ?? Number.POSITIVE_INFINITY;
      const bTime = toDate(b?.startAt ?? b?.startDateTime)?.getTime() ?? Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
  }
  return list.sort((a, b) => {
    const aTime = toDate(a?.endAt ?? a?.endDateTime)?.getTime() ?? 0;
    const bTime = toDate(b?.endAt ?? b?.endDateTime)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

function compareProgramsByPage(left, right, statusKey) {
  const eventDiff =
    (left.eventSortOrder ?? Number.POSITIVE_INFINITY) -
    (right.eventSortOrder ?? Number.POSITIVE_INFINITY);
  if (eventDiff !== 0) return eventDiff;

  if (statusKey === "closed") {
    const leftEnd = left.endSortAt ?? 0;
    const rightEnd = right.endSortAt ?? 0;
    if (leftEnd !== rightEnd) return rightEnd - leftEnd;
  } else {
    const leftStart = left.startSortAt ?? Number.POSITIVE_INFINITY;
    const rightStart = right.startSortAt ?? Number.POSITIVE_INFINITY;
    if (leftStart !== rightStart) return leftStart - rightStart;
  }

  return (left.programId ?? 0) - (right.programId ?? 0);
}

function normalizeCategory(value) {
  const raw = String(value ?? "").toUpperCase();
  if (
    raw.includes("SESSION") ||
    raw.includes("LECTURE") ||
    raw.includes("SEMINAR") ||
    raw.includes("세션") ||
    raw.includes("강연") ||
    raw.includes("교육") ||
    raw.includes("상담") ||
    raw.includes("문화")
  ) {
    return "SESSION";
  }
  if (
    raw.includes("EXPERIENCE") ||
    raw.includes("EXHIBIT") ||
    raw.includes("BOOTH") ||
    raw.includes("체험")
  ) {
    return "EXPERIENCE";
  }
  if (
    raw.includes("CONTEST") ||
    raw.includes("VOTE") ||
    raw.includes("COMPETITION") ||
    raw.includes("콘테스트") ||
    raw.includes("대회") ||
    raw.includes("투표")
  ) {
    return "CONTEST";
  }
  return "ETC";
}

function categoryLabel(value) {
  if (value === "SESSION") return "세션/강연";
  if (value === "EXPERIENCE") return "체험존";
  if (value === "CONTEST") return "콘테스트";
  return "기타";
}

function resolveDetailPath(program) {
  if (program.categoryKey === "CONTEST") {
    return `/program/contest/${program.eventId}/detail/${program.programId}`;
  }
  return `/program/detail?programId=${program.programId}`;
}

export default function ProgramStatus({ statusKey = "current" }) {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const config = PAGE_CONFIG[statusKey] ?? PAGE_CONFIG.current;
  const safeEventId = Number(eventId);

  const [events, setEvents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const eventsRes = await eventApi.getEvents({
          status: getPageApiStatus(statusKey),
          page: 0,
          size: 200,
          sort: statusKey === "current" ? "endAt,asc" : "startAt,asc",
        });
        if (!mounted) return;
        let eventRows = Array.isArray(eventsRes?.data?.data?.content)
          ? eventsRes.data.data.content
          : [];

        if (eventRows.length === 0) {
          const fallbackRes = await eventApi.getEvents({
            page: 0,
            size: 200,
            sort: "startAt,asc",
          });
          if (!mounted) return;
          const allRows = Array.isArray(fallbackRes?.data?.data?.content)
            ? fallbackRes.data.data.content
            : [];
          eventRows = allRows.filter(
            (row) => toEventPageStatus(row) === statusKey,
          );
        }

        if (eventRows.length === 0) {
          setEvents([]);
          setPrograms([]);
          return;
        }

        const orderedEvents = sortEventsByPage(eventRows, statusKey);

        const [programLists, boothLists] = await Promise.all([
          Promise.all(
            orderedEvents.map((row) =>
              programApi
                .getAllProgramsByEvent({
                  eventId: row.eventId,
                  sort: "startAt,asc",
                })
                .catch(() => []),
            ),
          ),
          Promise.all(
            orderedEvents.map((row) =>
              boothApi
                .getEventBooths({
                  eventId: row.eventId,
                  page: 0,
                  size: 200,
                  sort: "boothId,asc",
                })
                .then((res) =>
                  Array.isArray(res?.data?.data?.content)
                    ? res.data.data.content
                    : [],
                )
                .catch(() => []),
            ),
          ),
        ]);
        if (!mounted) return;

        const eventMap = new Map(
          orderedEvents.map((row) => [Number(row?.eventId), row]),
        );
        const eventOrderMap = new Map(
          orderedEvents.map((row, index) => [Number(row?.eventId), index]),
        );
        const rawProgramBaseDateByEvent = new Map();
        programLists.forEach((list, index) => {
          const eventId = Number(orderedEvents[index]?.eventId);
          const dates = (Array.isArray(list) ? list : [])
            .map((row) => toDate(row?.startAt ?? row?.startDateTime))
            .filter(Boolean)
            .sort((a, b) => a.getTime() - b.getTime());
          if (Number.isFinite(eventId) && dates.length > 0) {
            rawProgramBaseDateByEvent.set(eventId, dates[0]);
          }
        });
        const boothMap = new Map();
        boothLists.flat().forEach((row) => {
          const boothId = Number(row?.boothId);
          if (Number.isFinite(boothId) && row?.placeName) {
            boothMap.set(boothId, row.placeName);
          }
        });

        await loadProgramImageCache();
        const matchingPrograms = injectProgramImages(
          programLists.flat().filter(Boolean),
        )
          .map((row, idx) => {
            const normalizedCategory = normalizeCategory(
              row?.category ?? row?.programCategory,
            );
            const eventInfo = eventMap.get(Number(row?.eventId)) ?? {};
            const eventStartDate = toDate(
              eventInfo?.startAt ?? eventInfo?.startDateTime,
            );
            const rawBaseDate = rawProgramBaseDateByEvent.get(
              Number(row?.eventId),
            );
            const rebasedStartAt = rebaseProgramDate(
              row?.startAt ?? row?.startDateTime ?? null,
              rawBaseDate,
              eventStartDate,
            );
            const rebasedEndAt = rebaseProgramDate(
              row?.endAt ?? row?.endDateTime ?? null,
              rawBaseDate,
              eventStartDate,
            );
            const dayIndex =
              rebasedStartAt && eventStartDate
                ? diffDays(rebasedStartAt, eventStartDate) + 1
                : null;
            return {
              key: `${row?.programId ?? row?.id ?? idx}`,
              programId: Number(row?.programId ?? row?.id ?? idx),
              eventId: Number(row?.eventId),
              eventSortOrder:
                eventOrderMap.get(Number(row?.eventId)) ??
                Number.POSITIVE_INFINITY,
              eventName: eventInfo?.eventName ?? `행사 ${row?.eventId}`,
              title:
                row?.programTitle ??
                row?.programName ??
                row?.title ??
                `프로그램 ${idx + 1}`,
              description: row?.description ?? "",
              location:
                row?.location ??
                row?.place ??
                row?.zone ??
                boothMap.get(Number(row?.boothId)) ??
                "장소 미정",
              schedule: formatDateTimeRange(rebasedStartAt, rebasedEndAt),
              dayLabel: dayIndex ? `${dayIndex}일차` : "",
              startSortAt:
                rebasedStartAt?.getTime?.() ?? Number.POSITIVE_INFINITY,
              endSortAt: rebasedEndAt?.getTime?.() ?? 0,
              imageUrl: row?.imageUrl ?? row?.image_url ?? null,
              status: toProgramRuntimeStatus(rebasedStartAt, rebasedEndAt),
              categoryKey: normalizedCategory,
              categoryLabel: categoryLabel(normalizedCategory),
            };
          })
          .sort((a, b) => compareProgramsByPage(a, b, statusKey));

        const eligibleEventIds = new Set(
          matchingPrograms.map((row) => Number(row.eventId)),
        );
        const eligibleEvents = orderedEvents.filter((row) =>
          eligibleEventIds.has(Number(row?.eventId)),
        );
        const selectedPrograms = Number.isFinite(safeEventId)
          ? matchingPrograms.filter((row) => Number(row.eventId) === safeEventId)
          : matchingPrograms;

        setEvents(eligibleEvents);
        setPrograms(selectedPrograms);
      } catch (err) {
        if (!mounted) return;
        setPrograms([]);
        setError(
          err?.response?.data?.message ??
            err?.message ??
            "프로그램 정보를 불러오지 못했습니다.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [safeEventId, statusKey]);

  useEffect(() => {
    setCategoryFilter("ALL");
  }, [safeEventId, statusKey]);

  useEffect(() => {
    setSearchQuery("");
  }, [safeEventId, statusKey]);

  const filteredPrograms = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return programs.filter((row) => {
      const matchCategory =
        categoryFilter === "ALL" || row.categoryKey === categoryFilter;
      if (!matchCategory) return false;
      if (!keyword) return true;
      return [
        row.title,
        row.description,
        row.location,
        row.eventName,
        row.categoryLabel,
      ].some((value) => String(value ?? "").toLowerCase().includes(keyword));
    });
  }, [programs, categoryFilter, searchQuery]);

  const statPrograms = programs;
  const sessionCount = statPrograms.filter(
    (row) => row.categoryKey === "SESSION",
  ).length;
  const experienceCount = statPrograms.filter(
    (row) => row.categoryKey === "EXPERIENCE",
  ).length;
  const contestCount = statPrograms.filter(
    (row) => row.categoryKey === "CONTEST",
  ).length;

  const handleEventChange = (nextEventId) => {
    if (!nextEventId) {
      navigate(`/program/${statusKey}`);
      return;
    }
    navigate(`/program/${statusKey}/${nextEventId}`);
  };

  return (
    <div className="ps-root">
      <style>{styles}</style>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        categories={PROGRAM_STATUS_CATEGORIES}
      />

      <main className="ps-wrap">
        <div className="ps-toolbar">
          <div className="ps-toolbar-left">
            <select
              className="ps-select"
              value={Number.isFinite(safeEventId) ? String(safeEventId) : ""}
              onChange={(event) => handleEventChange(event.target.value)}
            >
              <option value="">전체 행사</option>
              {events.map((row) => (
                <option key={row?.eventId} value={row?.eventId}>
                  {row?.eventName ?? `행사 ${row?.eventId}`}
                </option>
              ))}
            </select>

            <div className="ps-search-wrap">
              <Search size={15} className="ps-search-icon" />
              <input
                className="ps-search-input"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="프로그램명, 행사명, 장소 검색"
              />
            </div>
          </div>

          <div className="ps-filter">
            {CATEGORY_FILTERS.map((row) => (
              <button
                key={row.key}
                className={categoryFilter === row.key ? "active" : ""}
                onClick={() => setCategoryFilter(row.key)}
                type="button"
              >
                {row.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ps-stats">
          <div className="ps-stat">
            <div className="ps-stat-icon" style={{ background: "#eff4ff" }}>
              <Layers3 size={18} color="#1a4fd6" />
            </div>
            <div>
              <div className="ps-stat-label">전체 프로그램</div>
              <div className="ps-stat-value">{statPrograms.length}개</div>
            </div>
          </div>
          <div className="ps-stat">
            <div className="ps-stat-icon" style={{ background: "#f3e8ff" }}>
              <Sparkles size={18} color="#7c3aed" />
            </div>
            <div>
              <div className="ps-stat-label">세션/강연</div>
              <div className="ps-stat-value">{sessionCount}개</div>
            </div>
          </div>
          <div className="ps-stat">
            <div className="ps-stat-icon" style={{ background: "#ecfeff" }}>
              <CalendarCheck size={18} color="#0891b2" />
            </div>
            <div>
              <div className="ps-stat-label">체험존</div>
              <div className="ps-stat-value">{experienceCount}개</div>
            </div>
          </div>
          <div className="ps-stat">
            <div className="ps-stat-icon" style={{ background: "#fff7ed" }}>
              <CalendarX size={18} color="#ea580c" />
            </div>
            <div>
              <div className="ps-stat-label">콘테스트</div>
              <div className="ps-stat-value">{contestCount}개</div>
            </div>
          </div>
        </div>

        {loading ? (
          <PageLoading message="프로그램 목록을 불러오는 중입니다" />
        ) : error ? (
          <EmptyState type="error" message="프로그램을 불러오지 못했습니다" description={error} />
        ) : filteredPrograms.length === 0 ? (
          <div className="ps-empty">
            <strong>조건에 맞는 프로그램이 없습니다</strong>
            <span>행사나 분류를 바꿔 다시 확인해 주세요.</span>
          </div>
        ) : (
          <div className="ps-grid">
            {filteredPrograms.map((program) => (
              <div
                key={program.key}
                className={`ps-card ${program.status === "done" ? "done" : ""}`}
                onClick={() => navigate(resolveDetailPath(program))}
              >
                <div className="ps-thumb">
                  {program.imageUrl ? (
                    <img
                      src={program.imageUrl}
                      alt={program.title}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        const fallback = event.currentTarget.nextElementSibling;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="ps-thumb-ph"
                    style={{ display: program.imageUrl ? "none" : "flex" }}
                  >
                    <CalendarDays size={28} strokeWidth={1.3} />
                    <span>이미지 없음</span>
                  </div>
                  <div className="ps-badges">
                    <span className={`ps-badge ${program.status}`}>
                      {program.status === "live" ? (
                        <Clock3 size={12} />
                      ) : program.status === "upcoming" ? (
                        <CalendarCheck size={12} />
                      ) : (
                        <CalendarX size={12} />
                      )}
                      {program.status === "live"
                        ? "진행 중"
                        : program.status === "upcoming"
                          ? "예정"
                          : "종료"}
                    </span>
                    <span className="ps-event-badge" title={program.eventName}>
                      {program.eventName}
                    </span>
                  </div>
                </div>

                <div className="ps-body">
                  <div className="ps-card-top">
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span className="ps-category">{program.categoryLabel}</span>
                      {program.dayLabel ? (
                        <span className="ps-category" style={{ background: "#f3f4f6", color: "#475569" }}>
                          {program.dayLabel}
                        </span>
                      ) : null}
                    </div>
                    <span className={`ps-badge ${program.status}`}>
                      {program.status === "live"
                        ? "진행 중"
                        : program.status === "upcoming"
                          ? "예정"
                          : "종료"}
                    </span>
                  </div>

                  <div className="ps-title">{program.title}</div>
                  <div className="ps-desc">
                    {program.description || "설명이 등록되지 않았습니다."}
                  </div>

                  <div className="ps-meta">
                    <div className="ps-meta-row">
                      <CalendarDays size={12} /> {program.schedule}
                    </div>
                    <div className="ps-meta-row">
                      <MapPin size={12} /> {program.location}
                    </div>
                  </div>

                  <div className="ps-footer">
                    <span>{program.eventName}</span>
                    <button type="button">
                      상세보기 <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
