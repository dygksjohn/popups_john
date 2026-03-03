import PageHeader from "../components/PageHeader";
import { useEffect, useState } from "react";
import { eventApi } from "../../../app/http/eventApi";
import {
  Archive,
  MapPin,
  Users,
  Calendar,
  ChevronRight,
  Search,
  Star,
  Download,
  BarChart2,
  Filter,
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
  "/event/closed": "종료된 행사 목록을 확인합니다",
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

  .cl-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .cl-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 20px 22px; display: flex; align-items: center; gap: 14px;
  }
  .cl-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cl-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .cl-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

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
  .cl-year-btn {
    height: 40px; padding: 0 14px; border: 1px solid #e2e8f0; border-radius: 8px;
    background: #fff; font-size: 13px; font-weight: 500; color: #374151;
    cursor: pointer; font-family: inherit; transition: all 0.15s; white-space: nowrap;
  }
  .cl-year-btn:hover { border-color: #1a4fd6; color: #1a4fd6; }
  .cl-year-btn.active { border-color: #1a4fd6; background: #f5f8ff; color: #1a4fd6; font-weight: 600; }

  /* Table card */
  .cl-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; }
  .cl-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .cl-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; }
  .cl-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
  .cl-count { font-size: 12px; color: #9ca3af; }

  .cl-table-wrap { overflow-x: auto; }
  .cl-table { width: 100%; border-collapse: collapse; }
  .cl-table thead tr { background: #f9fafb; }
  .cl-table th { padding: 11px 16px; font-size: 12px; font-weight: 600; color: #6b7280; text-align: left; border-bottom: 1px solid #e9ecef; white-space: nowrap; }
  .cl-table td { padding: 14px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f1f3f5; }
  .cl-table tbody tr:hover { background: #fafbff; }
  .cl-table tbody tr:last-child td { border-bottom: none; }

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
  }
  .cl-action-btn:hover { border-color: #1a4fd6; color: #1a4fd6; }

  @media (max-width: 900px) {
    .cl-stat-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

const CATEGORY_COLORS = {
  컨퍼런스: { bg: "#eff4ff", color: "#1a4fd6" },
  워크샵: { bg: "#f5f3ff", color: "#7c3aed" },
  세미나: { bg: "#ecfdf5", color: "#059669" },
  포럼: { bg: "#fff7ed", color: "#d97706" },
  전시: { bg: "#fef2f2", color: "#dc2626" },
  데모데이: { bg: "#f0fdf4", color: "#16a34a" },
};

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

function extractYear(startAt) {
  if (!startAt) return "";
  const s = String(startAt);
  const m = s.match(/^(\d{4})-/);
  return m ? m[1] : "";
}

function mapEvent(raw) {
  const eventId = raw?.eventId ?? raw?.id ?? null;
  const title = raw?.eventName ?? raw?.title ?? "행사";
  const category = raw?.category ?? raw?.eventCategory ?? "행사";
  const location = raw?.location ?? raw?.place ?? "장소 미정";
  const startAt = raw?.startAt ?? raw?.startDateTime ?? raw?.startDate ?? null;
  const endAt = raw?.endAt ?? raw?.endDateTime ?? raw?.endDate ?? null;

  return {
    id: eventId,
    category,
    title,
    date: formatDate(startAt),
    location,
    time: startAt || endAt ? formatTime(startAt, endAt) : "시간 미정",
    participants: 0,
    capacity: 1,
    rating: 0,
    year: extractYear(startAt),
    fallback: "🐶",
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
        {val}
      </span>
    </div>
  );
}

export default function Closed() {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [currentPath, setCurrentPath] = useState("/event/closed");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await eventApi.getEvents({
          status: "ENDED",
          page: 0,
          size: 10,
        });
        const content = res.data.data.content;
        const list = Array.isArray(content) ? content : [];
        if (mounted) setEvents(list.map(mapEvent));
      } catch (e) {
        const msg =
          e?.response?.data?.message || e?.message || "Failed to load events.";
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchEvents();
    return () => {
      mounted = false;
    };
  }, []);

  const years = ["all", "2025", "2024"];
  const filtered = events.filter((e) => {
    const matchQ = e.title.includes(query) || e.category.includes(query);
    const matchY = year === "all" || String(e.year) === year;
    return matchQ && matchY;
  });

  const totalParticipants = events.reduce((a, e) => a + e.participants, 0);
  const avgRating =
    events.length === 0
      ? "0.0"
      : (events.reduce((a, e) => a + e.rating, 0) / events.length).toFixed(1);
  const avgRate =
    events.length === 0
      ? 0
      : Math.round(
          (events.reduce((a, e) => a + e.participants / e.capacity, 0) /
            events.length) *
            100,
        );

  return (
    <div className="cl-root">
      <style>{styles}</style>
      <PageHeader
        title="종료 행사"
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
              value: `${events.length}개`,
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
              label: "평균 참석률",
              value: `${avgRate}%`,
              icon: <BarChart2 size={20} color="#10b981" />,
              bg: "#ecfdf5",
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

        <div className="cl-toolbar">
          <div className="cl-search-wrap">
            <Search size={15} className="cl-search-icon" />
            <input
              className="cl-search"
              placeholder="행사명, 카테고리 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {years.map((y) => (
            <button
              key={y}
              className={`cl-year-btn${year === y ? " active" : ""}`}
              onClick={() => setYear(y)}
            >
              {y === "all" ? "전체 연도" : `${y}년`}
            </button>
          ))}
        </div>

        <div className="cl-card">
          <div className="cl-card-header">
            <div className="cl-card-title">
              <div className="cl-card-title-icon">
                <Archive size={14} color="#6b7280" />
              </div>
              종료된 행사 목록
            </div>
            <span className="cl-count">총 {filtered.length}건</span>
          </div>
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>행사명</th>
                  <th>카테고리</th>
                  <th>일자</th>
                  <th>장소</th>
                  <th>참가자</th>
                  <th>참석률</th>
                  <th>만족도</th>
                  <th>상태</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => {
                  const cc = CATEGORY_COLORS[ev.category] || {
                    bg: "#f3f4f6",
                    color: "#374151",
                  };
                  const rate = Math.round(
                    (ev.participants / ev.capacity) * 100,
                  );
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
                      <td>
                        <span
                          className="cl-category-chip"
                          style={{ background: cc.bg, color: cc.color }}
                        >
                          {ev.category}
                        </span>
                      </td>
                      <td style={{ color: "#6b7280", fontSize: 12 }}>
                        {ev.date}
                      </td>
                      <td style={{ color: "#6b7280", fontSize: 12 }}>
                        {ev.location}
                      </td>
                      <td>{ev.participants.toLocaleString()}명</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              rate >= 90
                                ? "#059669"
                                : rate >= 70
                                  ? "#d97706"
                                  : "#6b7280",
                          }}
                        >
                          {rate}%
                        </span>
                      </td>
                      <td>
                        <StarRating val={ev.rating} />
                      </td>
                      <td>
                        <span className="cl-closed-badge">
                          <Archive size={10} />
                          종료
                        </span>
                      </td>
                      <td>
                        <button className="cl-action-btn">
                          <BarChart2 size={11} />
                          결과
                        </button>
                        <button className="cl-action-btn">
                          <Download size={11} />
                          자료
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
