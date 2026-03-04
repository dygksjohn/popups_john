import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  CalendarCheck,
  Clock,
  MapPin,
  Tag,
  ChevronRight,
  Search,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { SERVICE_CATEGORIES, SUBTITLE_MAP } from "../constants/programConstants";
import { eventApi } from "../../../app/http/eventApi";
import { boothApi } from "../../../app/http/boothApi";

const styles = `
  .bt-root { background:#f8f9fc; min-height:100vh; }
  .bt-wrap { max-width:1400px; margin:0 auto; padding:32px 24px 64px; }

  .bt-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px; }
  .bt-stat { background:#fff; border:1px solid #e9ecef; border-radius:13px; padding:18px 20px; display:flex; align-items:center; gap:12px; }
  .bt-stat-ico { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .bt-stat-lb { font-size:12px; color:#6b7280; }
  .bt-stat-v { font-size:22px; font-weight:800; color:#111827; }

  .bt-filter { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:14px; }
  .bt-filter button {
    border:1px solid #e5e7eb; background:#fff; color:#6b7280;
    padding:7px 14px; border-radius:999px; font-size:12px; font-weight:700; cursor:pointer;
  }
  .bt-filter button.active { background:#1a4fd6; border-color:#1a4fd6; color:#fff; }
  .bt-search-wrap { position:relative; margin-left:auto; min-width:220px; flex:1 1 260px; max-width:340px; }
  .bt-search-ico { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#9ca3af; }
  .bt-search {
    width:100%; height:36px; padding:0 12px 0 34px;
    border:1px solid #e5e7eb; border-radius:999px; font-size:12.5px; color:#111827;
    outline:none; background:#fff;
  }
  .bt-search:focus { border-color:#1a4fd6; box-shadow:0 0 0 3px rgba(26,79,214,0.08); }
  .bt-date {
    height:36px; padding:0 12px; border:1px solid #e5e7eb; border-radius:999px;
    font-size:12.5px; color:#111827; outline:none; background:#fff;
  }
  .bt-date:focus { border-color:#1a4fd6; box-shadow:0 0 0 3px rgba(26,79,214,0.08); }

  .bt-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
  .bt-card {
    background:#fff; border:1px solid #e9ecef; border-radius:14px; padding:0;
    display:flex; flex-direction:column; gap:12px;
    overflow:hidden;
  }
  .bt-card.live { border-color:#10b981; background:#f0fdf9; }
  .bt-thumb {
    width:100%;
    aspect-ratio: 16/10;
    background: linear-gradient(135deg,#eef2ff 0%, #f8fafc 100%);
    position: relative;
    overflow: hidden;
  }
  .bt-thumb img {
    width:100%;
    height:100%;
    object-fit:cover;
    display:block;
  }
  .bt-thumb-ph {
    position:absolute;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#9ca3af;
  }
  .bt-body { padding:16px; display:flex; flex-direction:column; gap:12px; }
  .bt-card-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .bt-badge { padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
  .bt-badge.live { background:#ecfdf5; color:#059669; }
  .bt-badge.upcoming { background:#fff7ed; color:#d97706; }
  .bt-badge.done { background:#f3f4f6; color:#9ca3af; }

  .bt-title { font-size:16px; font-weight:800; color:#111827; line-height:1.35; }
  .bt-desc { font-size:12.5px; color:#6b7280; line-height:1.45; min-height:36px; }

  .bt-meta { display:flex; flex-direction:column; gap:7px; font-size:12px; color:#6b7280; }
  .bt-meta-row { display:flex; align-items:center; gap:6px; }

  .bt-foot { display:flex; align-items:center; justify-content:space-between; gap:8px; padding-top:8px; border-top:1px solid #f1f3f5; }
  .bt-cat { font-size:11px; font-weight:700; color:#1a4fd6; background:#eff4ff; border-radius:999px; padding:3px 9px; }
  .bt-host { font-size:12px; color:#6b7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .bt-detail { border:0; background:transparent; color:#1a4fd6; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; }

  .bt-empty { background:#fff; border:1px dashed #d1d5db; border-radius:14px; padding:28px; text-align:center; color:#9ca3af; }

  @media (max-width: 1100px) { .bt-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width: 700px) {
    .bt-wrap { padding:20px 16px 48px; }
    .bt-stats { grid-template-columns:repeat(2,1fr); }
    .bt-grid { grid-template-columns:1fr; }
  }
`;

const STATUS_LABEL = {
  live: "진행 중",
  upcoming: "예정",
  done: "완료",
};

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDate(v) {
  const d = toDate(v);
  if (!d) return "일정 미정";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function toDateOnlyNumber(v) {
  if (!v) return null;
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return Number(`${m[1]}${m[2]}${m[3]}`);
}

function toBoothStatus(rawStatus, startAt, endAt) {
  const raw = String(rawStatus ?? "").toUpperCase();
  if (raw.includes("CLOSE") || raw.includes("END") || raw.includes("DONE")) return "done";
  if (raw.includes("FULL") || raw.includes("WAIT") || raw.includes("PENDING")) return "upcoming";
  if (raw.includes("OPEN") || raw.includes("LIVE") || raw.includes("ONGOING")) return "live";

  const now = Date.now();
  const s = toDate(startAt)?.getTime();
  const e = toDate(endAt)?.getTime();
  if (s && now < s) return "upcoming";
  if (e && now > e) return "done";
  return "live";
}

function normalizeBooth(item, idx, eventMap) {
  const eventId = Number(item?.eventId);
  const event = eventMap.get(eventId) ?? null;
  const startAt = item?.startAt ?? event?.startAt ?? null;
  const endAt = item?.endAt ?? event?.endAt ?? null;

  return {
    id: item?.boothId ?? item?.id ?? `booth-${idx}`,
    eventId,
    title: item?.boothName ?? item?.placeName ?? `부스 ${idx + 1}`,
    description: item?.description ?? item?.boothDescription ?? "",
    schedule: `${fmtDate(startAt)} ~ ${fmtDate(endAt)}`,
    location: item?.zone ?? item?.location ?? item?.placeName ?? "장소 미정",
    category: "부스",
    host: event?.eventName ?? "주최 정보 없음",
    thumbnail: item?.imageUrl ?? item?.image_url ?? null,
    status: toBoothStatus(item?.status, startAt, endAt),
    startAt,
    endAt,
  };
}

export default function Booth() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const safeEventId = Number(eventId);

  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const categories = useMemo(() => {
    if (!Number.isFinite(safeEventId)) return SERVICE_CATEGORIES;
    return SERVICE_CATEGORIES.map((category) => {
      const basePath = String(category.path ?? "").replace(/\/\d+$/, "");
      if (!basePath.startsWith("/program/")) return category;
      return { ...category, path: `${basePath}/${safeEventId}` };
    });
  }, [safeEventId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (Number.isFinite(safeEventId)) {
          const [eventRes, boothRes] = await Promise.all([
            eventApi.getEventDetail(safeEventId),
            boothApi.getEventBooths({ eventId: safeEventId, page: 0, size: 200, sort: "boothId,asc" }),
          ]);
          if (!mounted) return;

          const eventMap = new Map([[safeEventId, eventRes?.data?.data ?? null]]);
          const list = Array.isArray(boothRes?.data?.data?.content) ? boothRes.data.data.content : [];
          setBooths(
            list
              .filter((b) => Number(b?.eventId ?? safeEventId) === safeEventId)
              .map((item, idx) => normalizeBooth({ ...item, eventId: safeEventId }, idx, eventMap)),
          );
        } else {
          const eventsRes = await eventApi.getEvents({ page: 0, size: 200, sort: "startAt,desc" });
          if (!mounted) return;

          const events = Array.isArray(eventsRes?.data?.data?.content) ? eventsRes.data.data.content : [];
          const eventMap = new Map(events.map((e) => [Number(e?.eventId), e]));

          const boothLists = await Promise.all(
            events.map(async (e) => {
              try {
                const res = await boothApi.getEventBooths({ eventId: e?.eventId, page: 0, size: 200, sort: "boothId,asc" });
                const content = Array.isArray(res?.data?.data?.content) ? res.data.data.content : [];
                return content.map((b) => ({ ...b, eventId: Number(e?.eventId) }));
              } catch {
                return [];
              }
            }),
          );
          if (!mounted) return;

          const allBooths = boothLists.flat().filter((b) => Number.isFinite(Number(b?.eventId)));
          setBooths(allBooths.map((item, idx) => normalizeBooth(item, idx, eventMap)));
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "부스 데이터를 불러오지 못했습니다.");
        setBooths([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [safeEventId]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const selectedNum = toDateOnlyNumber(selectedDate);
    return booths.filter((p) => {
      const matchStatus = filter === "all" || p.status === filter;
      if (!matchStatus) return false;

      const matchText = !q || [p.title, p.category, p.location, p.host, p.description]
        .some((v) => String(v || "").toLowerCase().includes(q));
      if (!matchText) return false;

      if (!selectedNum) return true;
      const startNum = toDateOnlyNumber(p.startAt);
      const endNum = toDateOnlyNumber(p.endAt);
      if (startNum && endNum) return selectedNum >= startNum && selectedNum <= endNum;
      if (startNum) return selectedNum >= startNum;
      if (endNum) return selectedNum <= endNum;
      return false;
    });
  }, [booths, filter, keyword, selectedDate]);

  const liveCount = booths.filter((p) => p.status === "live").length;
  const upcomingCount = booths.filter((p) => p.status === "upcoming").length;
  const doneCount = booths.filter((p) => p.status === "done").length;

  return (
    <div className="bt-root">
      <style>{styles}</style>
      <PageHeader
        title="부스 안내"
        subtitle={Number.isFinite(safeEventId) ? SUBTITLE_MAP["/program/booth"] : "전체 부스 정보를 확인하세요"}
        categories={categories}
        currentPath="/program/booth"
        onNavigate={(path) => navigate(path)}
      />

      <main className="bt-wrap">
        <div className="bt-stats">
          <div className="bt-stat"><div className="bt-stat-ico" style={{ background: "#eff4ff" }}><CalendarDays size={18} color="#1a4fd6" /></div><div><div className="bt-stat-lb">전체 부스</div><div className="bt-stat-v">{booths.length}개</div></div></div>
          <div className="bt-stat"><div className="bt-stat-ico" style={{ background: "#ecfdf5" }}><Clock size={18} color="#10b981" /></div><div><div className="bt-stat-lb">운영 중</div><div className="bt-stat-v">{liveCount}개</div></div></div>
          <div className="bt-stat"><div className="bt-stat-ico" style={{ background: "#fff7ed" }}><Tag size={18} color="#d97706" /></div><div><div className="bt-stat-lb">예정</div><div className="bt-stat-v">{upcomingCount}개</div></div></div>
          <div className="bt-stat"><div className="bt-stat-ico" style={{ background: "#f3f4f6" }}><CalendarCheck size={18} color="#6b7280" /></div><div><div className="bt-stat-lb">종료</div><div className="bt-stat-v">{doneCount}개</div></div></div>
        </div>

        <div className="bt-filter">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>전체</button>
          <button className={filter === "live" ? "active" : ""} onClick={() => setFilter("live")}>진행 중</button>
          <button className={filter === "upcoming" ? "active" : ""} onClick={() => setFilter("upcoming")}>예정</button>
          <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>완료</button>
          <div className="bt-search-wrap">
            <Search size={14} className="bt-search-ico" />
            <input
              className="bt-search"
              placeholder="부스 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <input
            type="date"
            className="bt-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            aria-label="부스 날짜 검색"
          />
        </div>

        {loading ? <div className="bt-empty">로딩 중...</div> : null}
        {!loading && error ? <div className="bt-empty">{error}</div> : null}

        {!loading && !error ? (
          filtered.length === 0 ? (
            <div className="bt-empty">표시할 부스가 없습니다.</div>
          ) : (
            <div className="bt-grid">
              {filtered.map((p) => (
                <div key={`${p.eventId}-${p.id}`} className={`bt-card ${p.status === "live" ? "live" : ""}`}>
                  <div className="bt-thumb">
                    {p.thumbnail ? <img src={p.thumbnail} alt={p.title} loading="lazy" /> : null}
                    <div className="bt-thumb-ph" style={{ display: p.thumbnail ? "none" : "flex" }}>
                      <CalendarDays size={20} />
                    </div>
                  </div>
                  <div className="bt-body">
                    <div className="bt-card-head">
                      <span className={`bt-badge ${p.status}`}>{STATUS_LABEL[p.status]}</span>
                      <span className="bt-cat">{p.category}</span>
                    </div>
                    <div className="bt-title">{p.title}</div>
                    <div className="bt-desc">{p.description || "설명이 없습니다."}</div>
                    <div className="bt-meta">
                      <div className="bt-meta-row"><CalendarDays size={12} /> {p.schedule}</div>
                      <div className="bt-meta-row"><MapPin size={12} /> {p.location}</div>
                    </div>
                    <div className="bt-foot">
                      <span className="bt-host">행사: {p.host}</span>
                      <button className="bt-detail" onClick={() => navigate("/guide/location")}>위치보기 <ChevronRight size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </main>
    </div>
  );
}
