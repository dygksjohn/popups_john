import PageHeader from "../components/PageHeader";
import EventDetailModal from "./EventDetailModal";
import { useCallback, useEffect, useState } from "react";
import { eventApi } from "../../../app/http/eventApi";
import {
  MapPin,
  Calendar,
  ChevronRight,
  Search,
  Zap,
} from "lucide-react";

export const SERVICE_CATEGORIES = [
  { label: "현재 진행 행사", path: "/event/current" },
  { label: "예정 행사", path: "/event/upcoming" },
  { label: "종료 행사", path: "/event/closed" },
  { label: "행사 사전 등록", path: "/event/preregister" },
  { label: "행사 일정 안내", path: "/event/eventschedule" },
];

export const SUBTITLE_MAP = {
  "/event/current": "",
  "/event/upcoming": "예정된 행사 일정을 확인합니다",
  "/event/closed": "종료된 행사 목록을 확인합니다",
  "/event/preregister": "행사 사전 등록을 진행합니다",
  "/event/eventschedule": "행사 일정을 안내합니다",
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .ev-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .ev-root *, .ev-root *::before, .ev-root *::after { box-sizing: border-box; font-family: inherit; }

  .ev-header { background: #fff; border-bottom: 1px solid #e9ecef; padding: 0 32px; }
  .ev-header-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .ev-header-left { display: flex; flex-direction: column; }
  .ev-header-title { font-size: 17px; font-weight: 800; color: #111827; }
  .ev-header-sub { font-size: 12px; color: #9ca3af; margin-top: 1px; }
  .ev-nav { display: flex; gap: 4px; }
  .ev-nav-btn { height: 34px; padding: 0 14px; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; color: #6b7280; background: transparent; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .ev-nav-btn:hover { background: #f3f4f6; color: #111827; }
  .ev-nav-btn.active { background: #1a4fd6; color: #fff; font-weight: 600; }

  .ev-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .ev-live-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca; border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444; margin-bottom: 20px; }
  .ev-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #ef4444; animation: ev-pulse 1.4s ease-in-out infinite; }
  @keyframes ev-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }

  .ev-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
  .ev-stat-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px 22px; display: flex; align-items: center; gap: 14px; }
  .ev-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ev-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .ev-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  .ev-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .ev-list-shell { display: flex; flex-direction: column; min-height: 0; }
  .ev-list-head { position: sticky; top: 0; z-index: 2; background: #fff; }
  .ev-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .ev-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; margin: 0; }
  .ev-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #fffbeb; display: flex; align-items: center; justify-content: center; }
  .ev-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  .ev-toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; }
  .ev-search-wrap { position: relative; flex: 1; }
  .ev-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
  .ev-search { width: 100%; height: 40px; padding: 0 13px 0 36px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13.5px; color: #111827; outline: none; font-family: inherit; background: #fff; transition: border-color 0.15s; }
  .ev-search:focus { border-color: #1a4fd6; box-shadow: 0 0 0 3px rgba(26,79,214,0.08); }
  .ev-date-wrap { width: 180px; flex-shrink: 0; }
  .ev-date-input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13.5px; color: #111827; outline: none; background: #fff; font-family: inherit; transition: border-color 0.15s; }
  .ev-date-input:focus { border-color: #1a4fd6; box-shadow: 0 0 0 3px rgba(26,79,214,0.08); }

  .ev-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .ev-list-scroll {
    max-height: calc(100vh - 320px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 6px;
  }
  .ev-list-scroll::-webkit-scrollbar { width: 8px; }
  .ev-list-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
  .ev-list-scroll::-webkit-scrollbar-track { background: transparent; }
  .ev-event-card { background: #fff; border: 1px solid #e9ecef; border-radius: 14px; overflow: hidden; transition: box-shadow 0.2s, transform 0.2s; cursor: pointer; }
  .ev-event-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); transform: translateY(-2px); }

  .ev-card-thumb { height: 160px; position: relative; overflow: hidden; }
  .ev-card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s ease; }
  .ev-event-card:hover .ev-card-thumb img { transform: scale(1.05); }
  .ev-card-thumb-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 100%); }
  .ev-card-thumb-label { position: absolute; top: 12px; left: 12px; display: flex; align-items: center; gap: 5px; background: rgba(0,0,0,0.55); color: #fff; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; backdrop-filter: blur(4px); }
  .ev-card-thumb-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; }

  .ev-event-card-body { padding: 18px 20px 20px; }
  .ev-event-category { font-size: 11px; font-weight: 600; color: #1a4fd6; margin-bottom: 6px; }
  .ev-event-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 10px; line-height: 1.4; }
  .ev-event-meta { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
  .ev-event-meta-row { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #6b7280; }
  .ev-event-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid #f1f3f5; }
  .ev-progress-wrap { flex: 1; margin-right: 14px; }
  .ev-progress-label { display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
  .ev-progress-track { height: 5px; background: #f1f3f5; border-radius: 100px; overflow: hidden; }
  .ev-progress-fill { height: 100%; border-radius: 100px; background: #1a4fd6; }
  .ev-card-btn { height: 32px; padding: 0 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; font-size: 12px; font-weight: 600; color: #374151; cursor: pointer; display: flex; align-items: center; gap: 4px; font-family: inherit; white-space: nowrap; transition: all 0.15s; flex-shrink: 0; }
  .ev-card-btn:hover { background: #1a4fd6; color: #fff; border-color: #1a4fd6; }

  @media (max-width: 700px) {
    .ev-grid { grid-template-columns: 1fr; }
    .ev-card { padding: 20px 16px; }
    .ev-list-scroll { max-height: calc(100vh - 280px); }
    .ev-date-wrap { width: 150px; }
  }
`;

function formatDate(value) {
  if (!value) return "일정 미정";
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "일정 미정";
  return `${m[1]}.${m[2]}.${m[3]}`;
}

function formatDateRange(startAt, endAt) {
  const startDate = formatDate(startAt);
  const endDate = formatDate(endAt);

  if (startDate === "일정 미정" && endDate === "일정 미정") return "일정 미정";
  if (startDate === "일정 미정") return `~ ${endDate}`;
  if (endDate === "일정 미정") return `${startDate} ~`;
  return `${startDate} ~ ${endDate}`;
}

function toSortTimestamp(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  const ts = Date.parse(String(value));
  return Number.isNaN(ts) ? Number.POSITIVE_INFINITY : ts;
}

function toDateOnlyNumber(value) {
  if (!value) return null;
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return Number(`${m[1]}${m[2]}${m[3]}`);
}

function mapEvent(raw) {
  const eventId = raw?.eventId ?? raw?.id ?? null;
  const eventName = raw?.eventName ?? raw?.title ?? "행사";
  const category = raw?.category ?? raw?.eventCategory ?? "행사";
  const location = raw?.location ?? raw?.place ?? "장소 미정";
  const startAt = raw?.startAt ?? raw?.startDateTime ?? raw?.startDate ?? null;
  const endAt = raw?.endAt ?? raw?.endDateTime ?? raw?.endDate ?? null;
  const participants = raw?.participants ?? raw?.appliedCount ?? 0;
  const capacity = raw?.capacity ?? raw?.maxParticipants ?? 1;

  return {
    id: eventId,
    title: eventName,
    category,
    location,
    date: formatDateRange(startAt, endAt),
    startAt,
    endAt,
    endSortKey: toSortTimestamp(endAt),
    participants,
    capacity,
    fallback: "🐶",
  };
}

function EventThumb({ ev }) {
  return (
    <div className="ev-card-thumb">
      <div
        className="ev-card-thumb-fallback"
        style={{
          background: "linear-gradient(135deg, #1a4fd6 0%, #6366f1 100%)",
        }}
      >
        {ev.fallback}
      </div>
      <div className="ev-card-thumb-overlay" />
      <div className="ev-card-thumb-label">
        <Zap size={10} />
        진행 중
      </div>
    </div>
  );
}

export default function Current() {
  const PAGE_SIZE = 10;

  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPath, setCurrentPath] = useState("/event/current");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [totalCount, setTotalCount] = useState(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchEvents = useCallback(async (targetPage) => {
    if (targetPage === 0) setLoading(true);
    else setLoadingMore(true);

    setError("");

    try {
      const res = await eventApi.getEvents({
        status: "ONGOING",
        page: targetPage,
        size: PAGE_SIZE,
      });

      const pageData = res?.data?.data ?? {};
      const content = Array.isArray(pageData?.content) ? pageData.content : [];
      const mapped = content.map(mapEvent);
      if (typeof pageData?.totalElements === "number") {
        setTotalCount(pageData.totalElements);
      }

      setEvents((prev) => {
        const merged = targetPage === 0 ? mapped : [...prev, ...mapped];
        const dedup = Array.from(new Map(merged.map((e) => [e.id, e])).values());
        return dedup.sort((a, b) => a.endSortKey - b.endSortKey);
      });

      const pageNumber =
        typeof pageData?.number === "number" ? pageData.number : targetPage;
      const hasNextByMeta =
        typeof pageData?.last === "boolean"
          ? !pageData.last
          : typeof pageData?.totalPages === "number"
            ? pageNumber + 1 < pageData.totalPages
            : content.length === PAGE_SIZE;

      setPage(pageNumber);
      setHasNext(hasNextByMeta);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to load events.";
      setError(msg);
    } finally {
      if (targetPage === 0) setLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(0);
  }, [fetchEvents]);

  const filtered = events.filter((e) => {
    const q = query.trim();
    const textMatched =
      !q ||
      e.title.includes(q) ||
      e.category.includes(q) ||
      e.location.includes(q);

    if (!textMatched) return false;
    if (!selectedDate) return true;

    const selectedNum = toDateOnlyNumber(selectedDate);
    if (!selectedNum) return true;

    const startNum = toDateOnlyNumber(e.startAt);
    const endNum = toDateOnlyNumber(e.endAt);

    if (startNum && endNum) return selectedNum >= startNum && selectedNum <= endNum;
    if (startNum) return selectedNum >= startNum;
    if (endNum) return selectedNum <= endNum;
    return false;
  });

  const handleListScroll = (e) => {
    if (loading || loadingMore || !hasNext) return;
    const el = e.currentTarget;
    const remain = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remain <= 120) {
      fetchEvents(page + 1);
    }
  };

  return (
    <div className="ev-root">
      <style>{styles}</style>
      <PageHeader
        title=""
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

      <main className="ev-container">
        {loading ? (
          <div className="ev-live-badge">Loading...</div>
        ) : error ? (
          <div className="ev-live-badge">{error}</div>
        ) : (
          <div className="ev-live-badge">
            <div className="ev-live-dot" />
            LIVE · {(typeof totalCount === "number" ? totalCount : events.length)}개 행사 진행 중
          </div>
        )}

        <div className="ev-card">
          <div className="ev-list-shell">
            <div className="ev-list-head">
              <div className="ev-card-header">
                <div className="ev-card-title">
                  <div className="ev-card-title-icon">
                    <Calendar size={14} color="#f59e0b" />
                  </div>
                  진행 중인 행사
                </div>
                <span className="ev-card-tag">{filtered.length}개 행사</span>
              </div>

              <div className="ev-toolbar">
                <div className="ev-search-wrap">
                  <Search size={15} className="ev-search-icon" />
                  <input
                    className="ev-search"
                    placeholder="행사명, 카테고리, 장소 검색"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="ev-date-wrap">
                  <input
                    type="date"
                    className="ev-date-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    aria-label="행사 날짜 검색"
                  />
                </div>
              </div>
            </div>

            <div className="ev-list-scroll" onScroll={handleListScroll}>
              <div className="ev-grid">
                {filtered.map((ev) => {
                  const safeCapacity =
                    ev.capacity && ev.capacity > 0 ? ev.capacity : 1;
                  const safeParticipants = ev.participants ?? 0;
                  const pct = Math.round((safeParticipants / safeCapacity) * 100);
                  return (
                    <div
                      key={ev.id}
                      className="ev-event-card"
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <EventThumb ev={ev} />
                      <div className="ev-event-card-body">
                        <div className="ev-event-category">{ev.category}</div>
                        <div className="ev-event-title">{ev.title}</div>
                        <div className="ev-event-meta">
                          <div className="ev-event-meta-row">
                            <MapPin size={12} />
                            {ev.location}
                          </div>
                          <div className="ev-event-meta-row">
                            <Calendar size={12} />
                            {ev.date}
                          </div>
                        </div>
                        <div className="ev-event-footer">
                          <div className="ev-progress-wrap">
                            <div className="ev-progress-label">
                              <span>참가자 {ev.participants.toLocaleString()}명</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="ev-progress-track">
                              <div
                                className="ev-progress-fill"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <button
                            className="ev-card-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                          >
                            상세 <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!loading && filtered.length === 0 && (
                <div className="ev-live-badge" style={{ marginTop: 12 }}>
                  검색 결과가 없습니다.
                </div>
              )}
              {loadingMore && (
                <div className="ev-live-badge" style={{ marginTop: 12 }}>
                  행사 목록 불러오는 중...
                </div>
              )}
              {!loading && !loadingMore && !hasNext && events.length > 0 && (
                <div className="ev-live-badge" style={{ marginTop: 12 }}>
                  모든 진행 중 행사를 불러왔습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
