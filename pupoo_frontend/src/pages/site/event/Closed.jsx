﻿import PageHeader from "../components/PageHeader";
import { useCallback, useEffect, useState } from "react";
import { eventApi } from "../../../app/http/eventApi";
import {
  Archive,
  Users,
  Search,
  Star,
  BarChart2,
} from "lucide-react";

export const SERVICE_CATEGORIES = [
  { label: "현재 진행 행사", path: "/event/current" },
  { label: "예정 행사", path: "/event/upcoming" },
  { label: "종료 행사", path: "/event/closed" },
  { label: "행사 사전 등록", path: "/event/preregister" },
  { label: "행사 일정 안내", path: "/event/eventschedule" },
];

export const SUBTITLE_MAP = {
  "/event/current": "현재 진행 중인 행사 목록을 확인합니다",
  "/event/upcoming": "예정된 행사 일정을 확인합니다",
  "/event/closed": "",
  "/event/preregister": "행사 사전 등록을 진행합니다",
  "/event/eventschedule": "행사 일정을 안내합니다",
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .cl-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .cl-root *, .cl-root *::before, .cl-root *::after { box-sizing: border-box; font-family: inherit; }

  .cl-header { background: #fff; border-bottom: 1px solid #e9ecef; padding: 0 32px; }
  .cl-header-inner {
    max-width: 1400px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between; height: 64px;
  }
  .cl-header-title { font-size: 17px; font-weight: 800; color: #111827; }
  .cl-header-sub { font-size: 12px; color: #9ca3af; margin-top: 1px; }
  .cl-nav { display: flex; gap: 4px; }
  .cl-nav-btn {
    height: 34px; padding: 0 14px; border: none; border-radius: 8px;
    font-size: 13px; font-weight: 500; color: #6b7280; background: transparent;
    cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .cl-nav-btn:hover { background: #f3f4f6; color: #111827; }
  .cl-nav-btn.active { background: #1a4fd6; color: #fff; font-weight: 600; }

  .cl-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .cl-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
  .cl-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 20px 22px; display: flex; align-items: center; gap: 14px;
  }
  .cl-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cl-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .cl-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  .cl-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; }
  .cl-list-shell { display: flex; flex-direction: column; min-height: 0; }
  .cl-list-head { position: sticky; top: 0; z-index: 2; background: #fff; }
  .cl-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .cl-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; }
  .cl-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
  .cl-count { font-size: 12px; color: #9ca3af; }

  .cl-toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
  .cl-search-wrap { position: relative; flex: 1; min-width: 200px; }
  .cl-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
  .cl-search {
    width: 100%; height: 40px; padding: 0 13px 0 36px;
    border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13.5px;
    color: #111827; outline: none; font-family: inherit; background: #fff;
    transition: border-color 0.15s;
  }
  .cl-search:focus { border-color: #1a4fd6; box-shadow: 0 0 0 3px rgba(26,79,214,0.08); }

  .cl-date-range { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .cl-date-wrap { width: 170px; flex-shrink: 0; }
  .cl-date-input {
    width: 100%; height: 40px; padding: 0 12px;
    border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13.5px;
    color: #111827; outline: none; background: #fff; font-family: inherit;
    transition: border-color 0.15s;
  }
  .cl-date-input:focus { border-color: #1a4fd6; box-shadow: 0 0 0 3px rgba(26,79,214,0.08); }
  .cl-date-sep { color: #9ca3af; font-size: 13px; }

  .cl-list-scroll {
    max-height: calc(100vh - 360px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 6px;
  }
  .cl-list-scroll::-webkit-scrollbar { width: 8px; }
  .cl-list-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
  .cl-list-scroll::-webkit-scrollbar-track { background: transparent; }

  .cl-table-wrap { overflow-x: auto; }
  .cl-table { width: 100%; border-collapse: collapse; }
  .cl-table thead tr { background: #f9fafb; }
  .cl-table th { padding: 11px 16px; font-size: 12px; font-weight: 600; color: #6b7280; text-align: center; border-bottom: 1px solid #e9ecef; white-space: nowrap; }
  .cl-table td { padding: 14px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f1f3f5; }
  .cl-table tbody tr:hover { background: #fafbff; }

  .cl-category-chip {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: 11px; font-weight: 600;
  }
  .cl-closed-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600;
    background: #f3f4f6; color: #6b7280;
  }
  .cl-stars { display: flex; gap: 2px; }
  .cl-action-btn {
    height: 30px; padding: 0 10px; border: 1px solid #e2e8f0; border-radius: 6px;
    background: #fff; font-size: 11.5px; font-weight: 500; color: #374151;
    cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
    font-family: inherit; transition: all 0.15s; margin-right: 4px;
    white-space: nowrap;
    writing-mode: horizontal-tb;
  }
  .cl-action-btn:hover { border-color: #1a4fd6; color: #1a4fd6; }
  .cl-result-col { min-width: 88px; white-space: nowrap; }

  @media (max-width: 699px) {
    .cl-stat-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 700px) {
    .cl-card { padding: 20px 16px; }
    .cl-list-scroll { max-height: calc(100vh - 320px); }
    .cl-date-wrap { width: 140px; }
  }
`;

function formatDate(value) {
  if (!value) return "일정 미정";
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "일정 미정";
  return `${m[1]}.${m[2]}.${m[3]}`;
}

function formatTime(startAt, endAt) {
  const pick = (v) => {
    if (!v) return "";
    const m = String(v).match(/(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : "";
  };
  const a = pick(startAt);
  const b = pick(endAt);
  if (a && b) return `${a} ~ ${b}`;
  if (a || b) return a || b;
  return "시간 미정";
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
  const title = raw?.eventName ?? raw?.title ?? "행사";
  const category = raw?.category ?? raw?.eventCategory ?? "행사";
  const location = raw?.location ?? raw?.place ?? "장소 미정";
  const startAt = raw?.startAt ?? raw?.startDateTime ?? raw?.startDate ?? null;
  const endAt = raw?.endAt ?? raw?.endDateTime ?? raw?.endDate ?? null;

  const dateTs = Date.parse(String(endAt || startAt || ""));

  return {
    id: eventId,
    category,
    title,
    date: formatDate(endAt || startAt),
    location,
    time: startAt || endAt ? formatTime(startAt, endAt) : "시간 미정",
    startAt,
    endAt,
    dateSortKey: Number.isNaN(dateTs) ? Number.NEGATIVE_INFINITY : dateTs,
    participants: raw?.participants ?? raw?.appliedCount ?? raw?.registered ?? 0,
    capacity: raw?.capacity ?? raw?.maxParticipants ?? 1,
    rating: raw?.rating ?? raw?.satisfactionAvg ?? 0,
  };
}

function StarRating({ val }) {
  return (
    <div className="cl-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          fill={i <= Math.round(val) ? "#f59e0b" : "none"}
          color={i <= Math.round(val) ? "#f59e0b" : "#d1d5db"}
        />
      ))}
      <span style={{ fontSize: 11.5, color: "#6b7280", marginLeft: 4 }}>
        {Number(val || 0).toFixed(1)}
      </span>
    </div>
  );
}

export default function Closed() {
  const PAGE_SIZE = 10;

  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPath, setCurrentPath] = useState("/event/closed");
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
        status: "ENDED",
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
        return dedup.sort((a, b) => b.dateSortKey - a.dateSortKey);
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
    const matchQ = !q || e.title.includes(q) || e.location.includes(q);
    if (!matchQ) return false;

    const endNum = toDateOnlyNumber(e.endAt || e.startAt);
    if (!endNum) return false;

    const fromNum = toDateOnlyNumber(dateFrom);
    const toNum = toDateOnlyNumber(dateTo);
    if (!fromNum && !toNum) return true;

    const minNum = fromNum && toNum ? Math.min(fromNum, toNum) : (fromNum ?? null);
    const maxNum = fromNum && toNum ? Math.max(fromNum, toNum) : (toNum ?? null);
    if (minNum && endNum < minNum) return false;
    if (maxNum && endNum > maxNum) return false;
    return true;
  });

  const totalParticipants = events.reduce((a, e) => a + Number(e.participants || 0), 0);
  const avgRating =
    events.length === 0
      ? "0.0"
      : (
          events.reduce((a, e) => a + Number(e.rating || 0), 0) / events.length
        ).toFixed(1);

  const handleListScroll = (e) => {
    if (loading || loadingMore || !hasNext) return;
    const el = e.currentTarget;
    const remain = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remain <= 120) {
      fetchEvents(page + 1);
    }
  };

  return (
    <div className="cl-root">
      <style>{styles}</style>
      <PageHeader
        title=""
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

      <main className="cl-container">
        {loading ? (
          <div className="cl-stat-card">Loading...</div>
        ) : error ? (
          <div className="cl-stat-card">{error}</div>
        ) : null}

        <div className="cl-stat-grid">
          {[
            {
              label: "종료 행사 수",
              value: `${typeof totalCount === "number" ? totalCount : events.length}개`,
              icon: <Archive size={20} color="#6b7280" />,
              bg: "#f3f4f6",
            },
            {
              label: "누적 참가자",
              value: totalParticipants.toLocaleString() + "명",
              icon: <Users size={20} color="#1a4fd6" />,
              bg: "#eff4ff",
            },
            {
              label: "평균 만족도",
              value: `${avgRating}점`,
              icon: <Star size={20} color="#f59e0b" />,
              bg: "#fffbeb",
            },
          ].map((s) => (
            <div key={s.label} className="cl-stat-card">
              <div className="cl-stat-icon" style={{ background: s.bg }}>
                {s.icon}
              </div>
              <div>
                <div className="cl-stat-label">{s.label}</div>
                <div className="cl-stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="cl-card">
          <div className="cl-list-shell">
            <div className="cl-list-head">
              <div className="cl-card-header">
                <div className="cl-card-title">
                  <div className="cl-card-title-icon">
                    <Archive size={14} color="#6b7280" />
                  </div>
                  종료된 행사 목록
                </div>
                <span className="cl-count">
                  총 {typeof totalCount === "number" ? totalCount : filtered.length}건
                </span>
              </div>

              <div className="cl-toolbar">
                <div className="cl-search-wrap">
                  <Search size={15} className="cl-search-icon" />
                  <input
                    className="cl-search"
                    placeholder="행사명, 장소 검색"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="cl-date-range">
                  <div className="cl-date-wrap">
                    <input
                      type="date"
                      className="cl-date-input"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      aria-label="종료일 시작일"
                    />
                  </div>
                  <span className="cl-date-sep">~</span>
                  <div className="cl-date-wrap">
                    <input
                      type="date"
                      className="cl-date-input"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      aria-label="종료일 종료일"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="cl-list-scroll" onScroll={handleListScroll}>
              <div className="cl-table-wrap">
                <table className="cl-table">
                  <thead>
                    <tr>
                      <th>완료된 행사명</th>
                      <th>종료일자</th>
                      <th>장소</th>
                      <th>참가자</th>
                      <th>만족도</th>
                      <th className="cl-result-col">결과</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((ev) => {
                      const part = Number(ev.participants || 0);
                      return (
                        <tr key={ev.id}>
                          <td
                            style={{
                              fontWeight: 600,
                              color: "#111827",
                              maxWidth: 220,
                            }}
                          >
                            {ev.title}
                          </td>
                          <td style={{ color: "#6b7280", fontSize: 12 }}>
                            {ev.date}
                          </td>
                          <td style={{ color: "#6b7280", fontSize: 12 }}>
                            {ev.location}
                          </td>
                          <td>{part.toLocaleString()}명</td>
                          <td>
                            <StarRating val={ev.rating} />
                          </td>
                          <td className="cl-result-col">
                            <button className="cl-action-btn">
                              <BarChart2 size={11} />
                              결과
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!loading && filtered.length === 0 && (
                <div className="cl-stat-card" style={{ marginTop: 12 }}>
                  검색 결과가 없습니다.
                </div>
              )}
              {loadingMore && (
                <div className="cl-stat-card" style={{ marginTop: 12 }}>
                  행사 목록 불러오는 중...
                </div>
              )}
              {!loading && !loadingMore && !hasNext && events.length > 0 && (
                <div className="cl-stat-card" style={{ marginTop: 12 }}>
                  모든 종료 행사를 불러왔습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
