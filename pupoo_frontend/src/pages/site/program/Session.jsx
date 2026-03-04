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
import { programApi } from "../../../app/http/programApi";
import { boothApi } from "../../../app/http/boothApi";

const styles = `
  .ss-root { background:#f8f9fc; min-height:100vh; }
  .ss-wrap { max-width:1400px; margin:0 auto; padding:32px 24px 64px; }

  .ss-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px; }
  .ss-stat { background:#fff; border:1px solid #e9ecef; border-radius:13px; padding:18px 20px; display:flex; align-items:center; gap:12px; }
  .ss-stat-ico { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .ss-stat-lb { font-size:12px; color:#6b7280; }
  .ss-stat-v { font-size:22px; font-weight:800; color:#111827; }

  .ss-filter { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:14px; }
  .ss-filter button {
    border:1px solid #e5e7eb; background:#fff; color:#6b7280;
    padding:7px 14px; border-radius:999px; font-size:12px; font-weight:700; cursor:pointer;
  }
  .ss-filter button.active { background:#1a4fd6; border-color:#1a4fd6; color:#fff; }
  .ss-search-wrap { position:relative; margin-left:auto; min-width:220px; flex:1 1 260px; max-width:340px; }
  .ss-search-ico { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#9ca3af; }
  .ss-search {
    width:100%; height:36px; padding:0 12px 0 34px;
    border:1px solid #e5e7eb; border-radius:999px; font-size:12.5px; color:#111827;
    outline:none; background:#fff;
  }
  .ss-search:focus { border-color:#1a4fd6; box-shadow:0 0 0 3px rgba(26,79,214,0.08); }
  .ss-date {
    height:36px; padding:0 12px; border:1px solid #e5e7eb; border-radius:999px;
    font-size:12.5px; color:#111827; outline:none; background:#fff;
  }
  .ss-date:focus { border-color:#1a4fd6; box-shadow:0 0 0 3px rgba(26,79,214,0.08); }

  .ss-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
  .ss-card {
    background:#fff; border:1px solid #e9ecef; border-radius:14px; padding:0;
    display:flex; flex-direction:column; gap:12px;
    overflow:hidden;
  }
  .ss-card.live { border-color:#10b981; background:#f0fdf9; }
  .ss-thumb {
    width:100%;
    aspect-ratio: 16/10;
    background: linear-gradient(135deg,#eef2ff 0%, #f8fafc 100%);
    position: relative;
    overflow: hidden;
  }
  .ss-thumb img {
    width:100%;
    height:100%;
    object-fit:cover;
    display:block;
  }
  .ss-thumb-ph {
    position:absolute;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#9ca3af;
  }
  .ss-body { padding:16px; display:flex; flex-direction:column; gap:12px; }
  .ss-card-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .ss-badge { padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
  .ss-badge.live { background:#ecfdf5; color:#059669; }
  .ss-badge.upcoming { background:#fff7ed; color:#d97706; }
  .ss-badge.done { background:#f3f4f6; color:#9ca3af; }

  .ss-title { font-size:16px; font-weight:800; color:#111827; line-height:1.35; }
  .ss-desc { font-size:12.5px; color:#6b7280; line-height:1.45; min-height:36px; }

  .ss-meta { display:flex; flex-direction:column; gap:7px; font-size:12px; color:#6b7280; }
  .ss-meta-row { display:flex; align-items:center; gap:6px; }

  .ss-foot { display:flex; align-items:center; justify-content:space-between; gap:8px; padding-top:8px; border-top:1px solid #f1f3f5; }
  .ss-cat { font-size:11px; font-weight:700; color:#1a4fd6; background:#eff4ff; border-radius:999px; padding:3px 9px; }
  .ss-host { font-size:12px; color:#6b7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ss-detail { border:0; background:transparent; color:#1a4fd6; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; }

  .ss-empty { background:#fff; border:1px dashed #d1d5db; border-radius:14px; padding:28px; text-align:center; color:#9ca3af; }

  @media (max-width: 1100px) { .ss-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width: 700px) {
    .ss-wrap { padding:20px 16px 48px; }
    .ss-stats { grid-template-columns:repeat(2,1fr); }
    .ss-grid { grid-template-columns:1fr; }
  }
`;

const CATEGORY_LABEL = {
  EXPERIENCE: "체험",
  SESSION: "세션",
  CONTEST: "콘테스트",
};

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

function toDateOnlyNumber(v) {
  if (!v) return null;
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return Number(`${m[1]}${m[2]}${m[3]}`);
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

function isSessionCategory(item) {
  const categoryRaw = String(item?.category ?? item?.programCategory ?? "").toUpperCase();
  return categoryRaw.includes("SESSION") || categoryRaw.includes("LECTURE") || categoryRaw.includes("TALK");
}

function normalizeProgram(item, idx, eventMap, boothMap) {
  const eventId = Number(item?.eventId);
  const boothId = Number(item?.boothId);
  const startAt = item?.startAt ?? item?.startDateTime;
  const endAt = item?.endAt ?? item?.endDateTime;
  const categoryRaw = String(item?.category ?? item?.programCategory ?? "").toUpperCase();

  return {
    id: item?.programId ?? item?.id ?? `ses-${idx}`,
    eventId,
    title: item?.programTitle ?? item?.programName ?? item?.title ?? `세션 ${idx + 1}`,
    description: item?.description ?? "",
    schedule: `${fmtDate(startAt)} ${fmtTime(startAt)}~${fmtTime(endAt)}`,
    location: item?.location ?? item?.place ?? item?.zone ?? item?.boothName ?? boothMap.get(boothId) ?? "장소 미정",
    category: CATEGORY_LABEL[categoryRaw] ?? "세션",
    host: eventMap.get(eventId)?.eventName ?? "주최 정보 없음",
    thumbnail: item?.imageUrl ?? item?.image_url ?? null,
    status: toStatus(item),
    startAt,
    endAt,
    detailPath: `/program/detail?programId=${item?.programId ?? item?.id}`,
  };
}

export default function Session() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const safeEventId = Number(eventId);

  const [programs, setPrograms] = useState([]);
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
          const [eventRes, programRes, boothRes] = await Promise.all([
            eventApi.getEventDetail(safeEventId),
            programApi.getAllProgramsByEvent({ eventId: safeEventId, category: "SESSION", sort: "startAt,asc" }),
            boothApi.getEventBooths({ eventId: safeEventId, page: 0, size: 200, sort: "boothId,asc" }),
          ]);
          if (!mounted) return;

          const eventMap = new Map([[safeEventId, eventRes?.data?.data ?? null]]);
          const booths = Array.isArray(boothRes?.data?.data?.content) ? boothRes.data.data.content : [];
          const boothMap = new Map(booths.map((b) => [Number(b?.boothId), b?.placeName]).filter(([id, name]) => Number.isFinite(id) && !!name));

          const list = (Array.isArray(programRes) ? programRes : []).filter(
            (p) => Number(p?.eventId) === safeEventId && isSessionCategory(p),
          );
          setPrograms(list.map((item, idx) => normalizeProgram(item, idx, eventMap, boothMap)));
        } else {
          const eventsRes = await eventApi.getEvents({ page: 0, size: 200, sort: "startAt,desc" });
          if (!mounted) return;

          const events = Array.isArray(eventsRes?.data?.data?.content) ? eventsRes.data.data.content : [];
          const eventMap = new Map(events.map((e) => [Number(e?.eventId), e]));

          const [programLists, boothLists] = await Promise.all([
            Promise.all(
              events.map(async (e) => {
                try {
                  return await programApi.getAllProgramsByEvent({
                    eventId: e?.eventId,
                    category: "SESSION",
                    sort: "startAt,asc",
                  });
                } catch {
                  return [];
                }
              }),
            ),
            Promise.all(
              events.map(async (e) => {
                try {
                  const res = await boothApi.getEventBooths({ eventId: e?.eventId, page: 0, size: 200, sort: "boothId,asc" });
                  return Array.isArray(res?.data?.data?.content) ? res.data.data.content : [];
                } catch {
                  return [];
                }
              }),
            ),
          ]);
          if (!mounted) return;

          const boothMap = new Map();
          boothLists.flat().forEach((b) => {
            const id = Number(b?.boothId);
            if (Number.isFinite(id) && b?.placeName) boothMap.set(id, b.placeName);
          });

          const allPrograms = programLists.flat().filter((p) => Number.isFinite(Number(p?.eventId)) && isSessionCategory(p));
          setPrograms(allPrograms.map((item, idx) => normalizeProgram(item, idx, eventMap, boothMap)));
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "세션 프로그램 데이터를 불러오지 못했습니다.");
        setPrograms([]);
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
    return programs.filter((p) => {
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
  }, [programs, filter, keyword, selectedDate]);

  const liveCount = programs.filter((p) => p.status === "live").length;
  const upcomingCount = programs.filter((p) => p.status === "upcoming").length;
  const doneCount = programs.filter((p) => p.status === "done").length;

  return (
    <div className="ss-root">
      <style>{styles}</style>
      <PageHeader
        title="세션 및 강연"
        subtitle={Number.isFinite(safeEventId) ? SUBTITLE_MAP["/program/session"] : "전체 세션 프로그램을 확인하세요"}
        categories={categories}
        currentPath="/program/session"
        onNavigate={(path) => navigate(path)}
      />

      <main className="ss-wrap">
        <div className="ss-stats">
          <div className="ss-stat"><div className="ss-stat-ico" style={{ background: "#eff4ff" }}><CalendarDays size={18} color="#1a4fd6" /></div><div><div className="ss-stat-lb">전체 프로그램</div><div className="ss-stat-v">{programs.length}개</div></div></div>
          <div className="ss-stat"><div className="ss-stat-ico" style={{ background: "#ecfdf5" }}><Clock size={18} color="#10b981" /></div><div><div className="ss-stat-lb">진행 중</div><div className="ss-stat-v">{liveCount}개</div></div></div>
          <div className="ss-stat"><div className="ss-stat-ico" style={{ background: "#fff7ed" }}><Tag size={18} color="#d97706" /></div><div><div className="ss-stat-lb">예정</div><div className="ss-stat-v">{upcomingCount}개</div></div></div>
          <div className="ss-stat"><div className="ss-stat-ico" style={{ background: "#f3f4f6" }}><CalendarCheck size={18} color="#6b7280" /></div><div><div className="ss-stat-lb">완료</div><div className="ss-stat-v">{doneCount}개</div></div></div>
        </div>

        <div className="ss-filter">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>전체</button>
          <button className={filter === "live" ? "active" : ""} onClick={() => setFilter("live")}>진행 중</button>
          <button className={filter === "upcoming" ? "active" : ""} onClick={() => setFilter("upcoming")}>예정</button>
          <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>완료</button>
          <div className="ss-search-wrap">
            <Search size={14} className="ss-search-ico" />
            <input
              className="ss-search"
              placeholder="세션 프로그램 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <input
            type="date"
            className="ss-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            aria-label="세션 프로그램 날짜 검색"
          />
        </div>

        {loading ? <div className="ss-empty">로딩 중...</div> : null}
        {!loading && error ? <div className="ss-empty">{error}</div> : null}

        {!loading && !error ? (
          filtered.length === 0 ? (
            <div className="ss-empty">표시할 세션 프로그램이 없습니다.</div>
          ) : (
            <div className="ss-grid">
              {filtered.map((p) => (
                <div key={`${p.eventId}-${p.id}`} className={`ss-card ${p.status === "live" ? "live" : ""}`}>
                  <div className="ss-thumb">
                    {p.thumbnail ? <img src={p.thumbnail} alt={p.title} loading="lazy" /> : null}
                    <div className="ss-thumb-ph" style={{ display: p.thumbnail ? "none" : "flex" }}>
                      <CalendarDays size={20} />
                    </div>
                  </div>
                  <div className="ss-body">
                    <div className="ss-card-head">
                      <span className={`ss-badge ${p.status}`}>{STATUS_LABEL[p.status]}</span>
                      <span className="ss-cat">{p.category}</span>
                    </div>
                    <div className="ss-title">{p.title}</div>
                    <div className="ss-desc">{p.description || "설명이 없습니다."}</div>
                    <div className="ss-meta">
                      <div className="ss-meta-row"><CalendarDays size={12} /> {p.schedule}</div>
                      <div className="ss-meta-row"><MapPin size={12} /> {p.location}</div>
                    </div>
                    <div className="ss-foot">
                      <span className="ss-host">주최: {p.host}</span>
                      <button className="ss-detail" onClick={() => navigate(p.detailPath)}>상세보기 <ChevronRight size={13} /></button>
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
