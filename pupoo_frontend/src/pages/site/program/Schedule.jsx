import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, CalendarCheck, Clock, MapPin, Tag, ChevronRight } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { SERVICE_CATEGORIES, SUBTITLE_MAP } from "../constants/programConstants";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import { boothApi } from "../../../app/http/boothApi";

const styles = `
  .pg-root { background:#f8f9fc; min-height:100vh; }
  .pg-wrap { max-width:1400px; margin:0 auto; padding:32px 24px 64px; }

  .pg-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px; }
  .pg-stat { background:#fff; border:1px solid #e9ecef; border-radius:13px; padding:18px 20px; display:flex; align-items:center; gap:12px; }
  .pg-stat-ico { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .pg-stat-lb { font-size:12px; color:#6b7280; }
  .pg-stat-v { font-size:22px; font-weight:800; color:#111827; }

  .pg-filter { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
  .pg-filter button {
    border:1px solid #e5e7eb; background:#fff; color:#6b7280;
    padding:7px 14px; border-radius:999px; font-size:12px; font-weight:700; cursor:pointer;
  }
  .pg-filter button.active { background:#1a4fd6; border-color:#1a4fd6; color:#fff; }

  .pg-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
  .pg-card {
    background:#fff; border:1px solid #e9ecef; border-radius:14px; padding:0;
    display:flex; flex-direction:column; gap:12px;
    overflow:hidden;
  }
  .pg-card.live { border-color:#10b981; background:#f0fdf9; }
  .pg-thumb {
    width:100%;
    aspect-ratio: 16/10;
    background: linear-gradient(135deg,#eef2ff 0%, #f8fafc 100%);
    position: relative;
    overflow: hidden;
  }
  .pg-thumb img {
    width:100%;
    height:100%;
    object-fit:cover;
    display:block;
  }
  .pg-thumb-ph {
    position:absolute;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#9ca3af;
  }
  .pg-body { padding:16px; display:flex; flex-direction:column; gap:12px; }
  .pg-card-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .pg-badge { padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
  .pg-badge.live { background:#ecfdf5; color:#059669; }
  .pg-badge.upcoming { background:#fff7ed; color:#d97706; }
  .pg-badge.done { background:#f3f4f6; color:#9ca3af; }

  .pg-title { font-size:16px; font-weight:800; color:#111827; line-height:1.35; }
  .pg-desc { font-size:12.5px; color:#6b7280; line-height:1.45; min-height:36px; }

  .pg-meta { display:flex; flex-direction:column; gap:7px; font-size:12px; color:#6b7280; }
  .pg-meta-row { display:flex; align-items:center; gap:6px; }

  .pg-foot { display:flex; align-items:center; justify-content:space-between; gap:8px; padding-top:8px; border-top:1px solid #f1f3f5; }
  .pg-cat { font-size:11px; font-weight:700; color:#1a4fd6; background:#eff4ff; border-radius:999px; padding:3px 9px; }
  .pg-host { font-size:12px; color:#6b7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pg-detail { border:0; background:transparent; color:#1a4fd6; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; }

  .pg-card-empty { background:#fff; border:1px dashed #d1d5db; border-radius:14px; padding:28px; text-align:center; color:#9ca3af; }

  @media (max-width: 1100px) { .pg-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width: 700px) {
    .pg-wrap { padding:20px 16px 48px; }
    .pg-stats { grid-template-columns:repeat(2,1fr); }
    .pg-grid { grid-template-columns:1fr; }
  }
`;

const CATEGORY_LABEL = {
  SESSION: "세션",
  EXPERIENCE: "체험",
  CONTEST: "콘테스트",
};

/* ── 이미지 폴백 ── */
const DOG_IMGS = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=600&h=400&fit=crop",
];
const dogImg = (id) => DOG_IMGS[Math.abs(Number(id) || 0) % DOG_IMGS.length];

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

function fmtTime(v) {
  const m = String(v ?? "").match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

function toStatus(item) {
  const raw = String(item?.status ?? "").toUpperCase();
  if (raw.includes("LIVE") || raw.includes("ONGOING") || raw.includes("PROGRESS")) return "live";
  if (raw.includes("DONE") || raw.includes("END") || raw.includes("FINISH")) return "done";
  const s = toDate(item?.startAt ?? item?.startDateTime)?.getTime();
  const e = toDate(item?.endAt ?? item?.endDateTime)?.getTime();
  const now = Date.now();
  if (s && now < s) return "upcoming";
  if (e && now > e) return "done";
  return "live";
}

function normalizeProgram(item, idx, eventMap, boothMap) {
  const eventId = Number(item?.eventId);
  const boothId = Number(item?.boothId);
  const startAt = item?.startAt ?? item?.startDateTime;
  const endAt = item?.endAt ?? item?.endDateTime;
  const categoryRaw = String(item?.category ?? item?.programCategory ?? "").toUpperCase();

  return {
    id: item?.programId ?? item?.id ?? `p-${idx}`,
    eventId,
    title: item?.programTitle ?? item?.programName ?? item?.title ?? `프로그램 ${idx + 1}`,
    description: item?.description ?? "",
    schedule: `${fmtDate(startAt)} ${fmtTime(startAt)}~${fmtTime(endAt)}`,
    location: item?.location ?? item?.place ?? item?.zone ?? item?.boothName ?? boothMap.get(boothId) ?? "장소 미정",
    category: CATEGORY_LABEL[categoryRaw] ?? "미분류",
    host: eventMap.get(eventId)?.eventName ?? "주최 정보 없음",
    thumbnail: item?.imageUrl ?? item?.image_url ?? eventMap.get(eventId)?.imageUrl ?? dogImg(item?.programId ?? item?.id ?? idx),
    status: toStatus(item),
    detailPath: `/program/detail?programId=${item?.programId ?? item?.id}`,
  };
}

export default function Schedule() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const safeEventId = Number(eventId);

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

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
          const [eventRes, programRes, boothRes] = await Promise.all([
            eventApi.getEventDetail(safeEventId),
            programApi.getAllProgramsByEvent({ eventId: safeEventId, sort: "startAt,asc" }),
            boothApi.getEventBooths({ eventId: safeEventId, page: 0, size: 200, sort: "boothId,asc" }),
          ]);
          if (!mounted) return;
          const eventMap = new Map([[safeEventId, eventRes?.data?.data ?? null]]);
          const booths = Array.isArray(boothRes?.data?.data?.content) ? boothRes.data.data.content : [];
          const boothMap = new Map(booths.map((b) => [Number(b?.boothId), b?.placeName]).filter(([id, name]) => Number.isFinite(id) && !!name));
          const list = (Array.isArray(programRes) ? programRes : []).filter((p) => Number(p?.eventId) === safeEventId);
          setPrograms(list.map((item, idx) => normalizeProgram(item, idx, eventMap, boothMap)));
        } else {
          const eventsRes = await eventApi.getEvents({ page: 0, size: 200, sort: "startAt,desc" });
          if (!mounted) return;
          const events = Array.isArray(eventsRes?.data?.data?.content) ? eventsRes.data.data.content : [];
          const eventMap = new Map(events.map((e) => [Number(e?.eventId), e]));

          const [programLists, boothLists] = await Promise.all([
            Promise.all(events.map(async (e) => {
              try { return await programApi.getAllProgramsByEvent({ eventId: e?.eventId, sort: "startAt,asc" }); }
              catch { return []; }
            })),
            Promise.all(events.map(async (e) => {
              try {
                const res = await boothApi.getEventBooths({ eventId: e?.eventId, page: 0, size: 200, sort: "boothId,asc" });
                return Array.isArray(res?.data?.data?.content) ? res.data.data.content : [];
              } catch { return []; }
            })),
          ]);
          if (!mounted) return;

          const boothMap = new Map();
          boothLists.flat().forEach((b) => {
            const id = Number(b?.boothId);
            if (Number.isFinite(id) && b?.placeName) boothMap.set(id, b.placeName);
          });

          const allPrograms = programLists.flat().filter((p) => Number.isFinite(Number(p?.eventId)));
          setPrograms(allPrograms.map((item, idx) => normalizeProgram(item, idx, eventMap, boothMap)));
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "프로그램 데이터를 불러오지 못했습니다.");
        setPrograms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [safeEventId]);

  const filtered = useMemo(() => {
    if (filter === "all") return programs;
    return programs.filter((p) => p.status === filter);
  }, [programs, filter]);

  const liveCount = programs.filter((p) => p.status === "live").length;
  const upcomingCount = programs.filter((p) => p.status === "upcoming").length;
  const doneCount = programs.filter((p) => p.status === "done").length;

  return (
    <div className="pg-root">
      <style>{styles}</style>
      <PageHeader
        title="프로그램 일정"
        subtitle={Number.isFinite(safeEventId) ? SUBTITLE_MAP["/program/schedule"] : "전체 프로그램을 확인하세요"}
        categories={categories}
        currentPath="/program/schedule"
        onNavigate={(path) => navigate(path)}
      />

      <main className="pg-wrap">
        <div className="pg-stats">
          <div className="pg-stat"><div className="pg-stat-ico" style={{ background: "#eff4ff" }}><CalendarDays size={18} color="#1a4fd6" /></div><div><div className="pg-stat-lb">전체 프로그램</div><div className="pg-stat-v">{programs.length}개</div></div></div>
          <div className="pg-stat"><div className="pg-stat-ico" style={{ background: "#ecfdf5" }}><Clock size={18} color="#10b981" /></div><div><div className="pg-stat-lb">진행 중</div><div className="pg-stat-v">{liveCount}개</div></div></div>
          <div className="pg-stat"><div className="pg-stat-ico" style={{ background: "#fff7ed" }}><Tag size={18} color="#d97706" /></div><div><div className="pg-stat-lb">예정</div><div className="pg-stat-v">{upcomingCount}개</div></div></div>
          <div className="pg-stat"><div className="pg-stat-ico" style={{ background: "#f3f4f6" }}><CalendarCheck size={18} color="#6b7280" /></div><div><div className="pg-stat-lb">완료</div><div className="pg-stat-v">{doneCount}개</div></div></div>
        </div>

        <div className="pg-filter">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>전체</button>
          <button className={filter === "live" ? "active" : ""} onClick={() => setFilter("live")}>진행 중</button>
          <button className={filter === "upcoming" ? "active" : ""} onClick={() => setFilter("upcoming")}>예정</button>
          <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>완료</button>
        </div>

        {loading ? <div className="pg-card-empty">로딩 중...</div> : null}
        {!loading && error ? <div className="pg-card-empty">{error}</div> : null}

        {!loading && !error ? (
          filtered.length === 0 ? (
            <div className="pg-card-empty">표시할 프로그램이 없습니다.</div>
          ) : (
            <div className="pg-grid">
              {filtered.map((p) => (
                <div key={`${p.eventId}-${p.id}`} className={`pg-card ${p.status === "live" ? "live" : ""}`}>
                  <div className="pg-thumb">
                    <img src={p.thumbnail} alt={p.title} loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = dogImg(p.id); }} />
                  </div>
                  <div className="pg-body">
                    <div className="pg-card-head">
                      <span className={`pg-badge ${p.status}`}>{STATUS_LABEL[p.status]}</span>
                      <span className="pg-cat">{p.category}</span>
                    </div>
                    <div className="pg-title">{p.title}</div>
                    <div className="pg-desc">{p.description || "설명이 없습니다."}</div>
                    <div className="pg-meta">
                      <div className="pg-meta-row"><CalendarDays size={12} /> {p.schedule}</div>
                      <div className="pg-meta-row"><MapPin size={12} /> {p.location}</div>
                    </div>
                    <div className="pg-foot">
                      <span className="pg-host">주최: {p.host}</span>
                      <button className="pg-detail" onClick={() => navigate(p.detailPath)}>상세보기 <ChevronRight size={13} /></button>
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
