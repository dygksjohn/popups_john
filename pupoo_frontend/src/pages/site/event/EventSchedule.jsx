import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  Clock3,
  MapPin,
  Users,
  ChevronRight,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { eventApi } from "../../../app/http/eventApi";
import {
  loadImageCache as loadEventImageCache,
  injectEventImages,
} from "../../admin/shared/eventImageStore";

const EVENT_CATEGORIES = [
  { label: "현재 진행 행사", path: "/event/current" },
  { label: "예정 행사", path: "/event/upcoming" },
  { label: "종료 행사", path: "/event/closed" },
  { label: "행사 사전 등록", path: "/event/preregister" },
  { label: "행사 일정 안내", path: "/event/eventschedule" },
];

const FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "ONGOING", label: "진행 중" },
  { key: "UPCOMING", label: "예정" },
  { key: "ENDED", label: "종료" },
];

const styles = `
  .es-root { background:#f8f9fc; min-height:100vh; }
  .es-wrap { max-width:1400px; margin:0 auto; padding:32px 24px 64px; }
  .es-filter { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }
  .es-filter button {
    border:1px solid #dbe2ea; background:#fff; color:#6b7280; padding:8px 14px;
    border-radius:999px; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s ease;
  }
  .es-filter button.active { background:#1a4fd6; border-color:#1a4fd6; color:#fff; }
  .es-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px; }
  .es-stat {
    background:#fff; border:1px solid #e9ecef; border-radius:14px; padding:18px 20px;
    display:flex; align-items:center; gap:12px;
  }
  .es-stat-ico {
    width:42px; height:42px; border-radius:11px; display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
  }
  .es-stat-lb { font-size:12px; color:#6b7280; }
  .es-stat-v { font-size:22px; font-weight:800; color:#111827; }
  .es-list { display:flex; flex-direction:column; gap:14px; }
  .es-card {
    background:#fff; border:1px solid #e9ecef; border-radius:18px; overflow:hidden;
    display:grid; grid-template-columns:280px 1fr; transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  }
  .es-card:hover { transform:translateY(-3px); box-shadow:0 12px 30px rgba(15,23,42,0.08); border-color:#bfdbfe; }
  .es-thumb {
    background:linear-gradient(135deg,#eff6ff 0%,#f8fafc 100%); position:relative; min-height:220px;
  }
  .es-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
  .es-thumb-ph {
    position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:#bfccdf;
  }
  .es-thumb-ph span { font-size:12px; font-weight:600; color:#b0bcce; }
  .es-status {
    position:absolute; top:14px; left:14px; display:inline-flex; align-items:center; gap:4px; padding:5px 11px;
    border-radius:999px; font-size:11px; font-weight:700; backdrop-filter:blur(6px);
  }
  .es-status.ONGOING { background:#ecfdf5; color:#059669; }
  .es-status.UPCOMING { background:#fff7ed; color:#d97706; }
  .es-status.ENDED { background:#f3f4f6; color:#6b7280; }
  .es-body { padding:20px 22px; display:flex; flex-direction:column; gap:14px; }
  .es-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .es-title { font-size:20px; font-weight:900; color:#111827; line-height:1.3; }
  .es-round { display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px; background:#eff4ff; color:#1a4fd6; font-size:11px; font-weight:700; }
  .es-desc { font-size:13px; color:#64748b; line-height:1.65; }
  .es-meta { display:flex; flex-wrap:wrap; gap:14px; font-size:12px; color:#64748b; }
  .es-meta-item { display:flex; align-items:center; gap:5px; }
  .es-bottom { margin-top:auto; display:flex; align-items:center; justify-content:space-between; gap:12px; padding-top:12px; border-top:1px solid #f1f5f9; }
  .es-organizer { font-size:12px; color:#475569; }
  .es-link {
    border:none; background:none; color:#1a4fd6; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;
  }
  .es-empty {
    background:#fff; border:1px solid #e9ecef; border-radius:18px; padding:72px 24px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; color:#94a3b8;
  }
  .es-empty strong { color:#475569; margin-bottom:6px; }
  @media (max-width:1000px) {
    .es-stats { grid-template-columns:repeat(2,1fr); }
    .es-card { grid-template-columns:1fr; }
    .es-thumb { min-height:220px; }
  }
  @media (max-width:700px) {
    .es-wrap { padding:20px 16px 48px; }
  }
`;

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatRange(startAt, endAt) {
  const toLabel = (value) => {
    const date = toDate(value);
    if (!date) return "일정 미정";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${y}.${m}.${d} ${hh}:${mm}`;
  };
  return `${toLabel(startAt)} ~ ${toLabel(endAt)}`;
}

function toStatus(rawStatus, startAt, endAt) {
  const raw = String(rawStatus ?? "").toUpperCase();
  if (raw.includes("ONGOING") || raw.includes("LIVE")) return "ONGOING";
  if (raw.includes("END")) return "ENDED";
  const now = Date.now();
  const startTs = toDate(startAt)?.getTime();
  const endTs = toDate(endAt)?.getTime();
  if (Number.isFinite(endTs) && now > endTs) return "ENDED";
  if (Number.isFinite(startTs) && now >= startTs) return "ONGOING";
  return "UPCOMING";
}

export default function EventSchedule() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("ALL");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await eventApi.getEvents({
          page: 0,
          size: 200,
          sort: "startAt,asc",
        });
        if (!mounted) return;
        const rows = Array.isArray(res?.data?.data?.content)
          ? res.data.data.content
          : [];
        await loadEventImageCache();
        const mapped = injectEventImages(
          rows.map((row) => ({
            ...row,
            imageUrl: row?.imageUrl ?? null,
          })),
        )
          .map((row) => ({
            ...row,
            statusLabel: toStatus(row?.status, row?.startAt, row?.endAt),
          }))
          .sort((a, b) => {
            const aTime = toDate(a?.startAt)?.getTime() ?? 0;
            const bTime = toDate(b?.startAt)?.getTime() ?? 0;
            return aTime - bTime;
          });
        setEvents(mapped);
      } catch (err) {
        if (!mounted) return;
        setEvents([]);
        setError(
          err?.response?.data?.message ??
            err?.message ??
            "행사 일정을 불러오지 못했습니다.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleEvents = useMemo(() => {
    if (filter === "ALL") return events;
    return events.filter((row) => row.statusLabel === filter);
  }, [events, filter]);

  const ongoingCount = events.filter((row) => row.statusLabel === "ONGOING").length;
  const upcomingCount = events.filter((row) => row.statusLabel === "UPCOMING").length;
  const endedCount = events.filter((row) => row.statusLabel === "ENDED").length;

  return (
    <div className="es-root">
      <style>{styles}</style>
      <PageHeader
        title="행사 일정 안내"
        subtitle="DB 기준 행사 일정과 운영 정보를 확인하세요"
        categories={EVENT_CATEGORIES}
      />

      <main className="es-wrap">
        <div className="es-filter">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={filter === item.key ? "active" : ""}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="es-stats">
          <div className="es-stat">
            <div className="es-stat-ico" style={{ background: "#eff4ff" }}>
              <CalendarDays size={18} color="#1a4fd6" />
            </div>
            <div>
              <div className="es-stat-lb">전체 행사</div>
              <div className="es-stat-v">{events.length}개</div>
            </div>
          </div>
          <div className="es-stat">
            <div className="es-stat-ico" style={{ background: "#ecfdf5" }}>
              <Clock3 size={18} color="#059669" />
            </div>
            <div>
              <div className="es-stat-lb">진행 중</div>
              <div className="es-stat-v">{ongoingCount}개</div>
            </div>
          </div>
          <div className="es-stat">
            <div className="es-stat-ico" style={{ background: "#fff7ed" }}>
              <CalendarCheck size={18} color="#d97706" />
            </div>
            <div>
              <div className="es-stat-lb">예정</div>
              <div className="es-stat-v">{upcomingCount}개</div>
            </div>
          </div>
          <div className="es-stat">
            <div className="es-stat-ico" style={{ background: "#f3f4f6" }}>
              <CalendarX size={18} color="#6b7280" />
            </div>
            <div>
              <div className="es-stat-lb">종료</div>
              <div className="es-stat-v">{endedCount}개</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="es-empty">
            <strong>불러오는 중입니다</strong>
            <span>행사 일정을 가져오고 있습니다.</span>
          </div>
        ) : error ? (
          <div className="es-empty">
            <strong>불러오기에 실패했습니다</strong>
            <span>{error}</span>
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="es-empty">
            <strong>표시할 행사가 없습니다</strong>
            <span>상태 필터를 바꿔 다시 확인해 주세요.</span>
          </div>
        ) : (
          <div className="es-list">
            {visibleEvents.map((event) => (
              <div key={event?.eventId} className="es-card">
                <div className="es-thumb">
                  {event?.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event?.eventName ?? "행사 이미지"}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="es-thumb-ph"
                    style={{ display: event?.imageUrl ? "none" : "flex" }}
                  >
                    <CalendarDays size={30} strokeWidth={1.3} />
                    <span>이미지 없음</span>
                  </div>
                  <span className={`es-status ${event.statusLabel}`}>
                    {event.statusLabel === "ONGOING"
                      ? "진행 중"
                      : event.statusLabel === "UPCOMING"
                        ? "예정"
                        : "종료"}
                  </span>
                </div>

                <div className="es-body">
                  <div className="es-top">
                    <div>
                      <div className="es-title">{event?.eventName ?? "행사"}</div>
                    </div>
                    {event?.roundNo ? (
                      <span className="es-round">{event.roundNo}회차</span>
                    ) : null}
                  </div>

                  <div className="es-desc">
                    {event?.description || "행사 설명이 등록되지 않았습니다."}
                  </div>

                  <div className="es-meta">
                    <span className="es-meta-item">
                      <CalendarDays size={12} /> {formatRange(event?.startAt, event?.endAt)}
                    </span>
                    <span className="es-meta-item">
                      <MapPin size={12} /> {event?.location || "장소 미정"}
                    </span>
                    <span className="es-meta-item">
                      <Users size={12} /> {event?.organizer || "주최 정보 없음"}
                    </span>
                  </div>

                  <div className="es-bottom">
                    <span className="es-organizer">행사 ID {event?.eventId}</span>
                    <button
                      type="button"
                      className="es-link"
                      onClick={() => navigate(`/program/current/${event?.eventId}`)}
                    >
                      프로그램 보기 <ChevronRight size={13} />
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
