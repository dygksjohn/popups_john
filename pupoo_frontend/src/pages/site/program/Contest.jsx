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
  .ct-root { background:#f8f9fc; min-height:100vh; }
  .ct-wrap { max-width:1400px; margin:0 auto; padding:32px 24px 64px; }

  .ct-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px; }
  .ct-stat { background:#fff; border:1px solid #e9ecef; border-radius:13px; padding:18px 20px; display:flex; align-items:center; gap:12px; }
  .ct-stat-ico { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .ct-stat-lb { font-size:12px; color:#6b7280; }
  .ct-stat-v { font-size:22px; font-weight:800; color:#111827; }

  .ct-filter { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:14px; }
  .ct-filter button {
    border:1px solid #e5e7eb; background:#fff; color:#6b7280;
    padding:7px 14px; border-radius:999px; font-size:12px; font-weight:700; cursor:pointer;
  }
  .ct-filter button.active { background:#1a4fd6; border-color:#1a4fd6; color:#fff; }
  .ct-search-wrap { position:relative; margin-left:auto; min-width:220px; flex:1 1 260px; max-width:340px; }
  .ct-search-ico { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#9ca3af; }
  .ct-search {
    width:100%; height:36px; padding:0 12px 0 34px;
    border:1px solid #e5e7eb; border-radius:999px; font-size:12.5px; color:#111827;
    outline:none; background:#fff;
  }
  .ct-search:focus { border-color:#1a4fd6; box-shadow:0 0 0 3px rgba(26,79,214,0.08); }
  .ct-date {
    height:36px; padding:0 12px; border:1px solid #e5e7eb; border-radius:999px;
    font-size:12.5px; color:#111827; outline:none; background:#fff;
  }
  .ct-date:focus { border-color:#1a4fd6; box-shadow:0 0 0 3px rgba(26,79,214,0.08); }

  .ct-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
  .ct-card {
    background:#fff; border:1px solid #e9ecef; border-radius:14px; padding:0;
    display:flex; flex-direction:column; gap:12px;
    overflow:hidden;
  }
  .ct-card.live { border-color:#10b981; background:#f0fdf9; }
  .ct-thumb {
    width:100%;
    aspect-ratio: 16/10;
    background: linear-gradient(135deg,#eef2ff 0%, #f8fafc 100%);
    position: relative;
    overflow: hidden;
  }
  .ct-thumb img {
    width:100%;
    height:100%;
    object-fit:cover;
    display:block;
  }
  .ct-thumb-ph {
    position:absolute;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#9ca3af;
  }
  .ct-body { padding:16px; display:flex; flex-direction:column; gap:12px; }
  .ct-card-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .ct-badge { padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
  .ct-badge.live { background:#ecfdf5; color:#059669; }
  .ct-badge.upcoming { background:#fff7ed; color:#d97706; }
  .ct-badge.done { background:#f3f4f6; color:#9ca3af; }

  .ct-title { font-size:16px; font-weight:800; color:#111827; line-height:1.35; }
  .ct-desc { font-size:12.5px; color:#6b7280; line-height:1.45; min-height:36px; }

  .ct-meta { display:flex; flex-direction:column; gap:7px; font-size:12px; color:#6b7280; }
  .ct-meta-row { display:flex; align-items:center; gap:6px; }

  .ct-foot { display:flex; align-items:center; justify-content:space-between; gap:8px; padding-top:8px; border-top:1px solid #f1f3f5; }
  .ct-cat { font-size:11px; font-weight:700; color:#1a4fd6; background:#eff4ff; border-radius:999px; padding:3px 9px; }
  .ct-host { font-size:12px; color:#6b7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ct-detail { border:0; background:transparent; color:#1a4fd6; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; }

  .ct-empty { background:#fff; border:1px dashed #d1d5db; border-radius:14px; padding:28px; text-align:center; color:#9ca3af; }

  @media (max-width: 1100px) { .ct-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width: 700px) {
    .ct-wrap { padding:20px 16px 48px; }
    .ct-stats { grid-template-columns:repeat(2,1fr); }
    .ct-grid { grid-template-columns:1fr; }
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

function isContestCategory(item) {
  const categoryRaw = String(item?.category ?? item?.programCategory ?? "").toUpperCase();
  return categoryRaw.includes("CONTEST") || categoryRaw.includes("VOTE");
}

function normalizeProgram(item, idx, eventMap, boothMap) {
  const eventId = Number(item?.eventId);
  const boothId = Number(item?.boothId);
  const startAt = item?.startAt ?? item?.startDateTime;
  const endAt = item?.endAt ?? item?.endDateTime;
  const categoryRaw = String(item?.category ?? item?.programCategory ?? "").toUpperCase();
  const programId = item?.programId ?? item?.id;

  return {
    id: programId ?? `con-${idx}`,
    eventId,
    title: item?.programTitle ?? item?.programName ?? item?.title ?? `콘테스트 ${idx + 1}`,
    description: item?.description ?? "",
    schedule: `${fmtDate(startAt)} ${fmtTime(startAt)}~${fmtTime(endAt)}`,
    location: item?.location ?? item?.place ?? item?.zone ?? item?.boothName ?? boothMap.get(boothId) ?? "장소 미정",
    category: CATEGORY_LABEL[categoryRaw] ?? "콘테스트",
    host: eventMap.get(eventId)?.eventName ?? "주최 정보 없음",
    thumbnail: item?.imageUrl ?? item?.image_url ?? null,
    status: toStatus(item),
    startAt,
    endAt,
    detailPath: Number.isFinite(eventId)
      ? `/program/contest/${eventId}/detail/${programId}`
      : `/program/detail?programId=${programId}`,
  };
}

export default function Contest() {
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
            programApi.getAllProgramsByEvent({ eventId: safeEventId, category: "CONTEST", sort: "startAt,asc" }),
            boothApi.getEventBooths({ eventId: safeEventId, page: 0, size: 200, sort: "boothId,asc" }),
          ]);
          if (!mounted) return;

          const eventMap = new Map([[safeEventId, eventRes?.data?.data ?? null]]);
          const booths = Array.isArray(boothRes?.data?.data?.content) ? boothRes.data.data.content : [];
          const boothMap = new Map(booths.map((b) => [Number(b?.boothId), b?.placeName]).filter(([id, name]) => Number.isFinite(id) && !!name));

          const list = (Array.isArray(programRes) ? programRes : []).filter(
            (p) => Number(p?.eventId) === safeEventId && isContestCategory(p),
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
                    category: "CONTEST",
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

          const allPrograms = programLists.flat().filter((p) => Number.isFinite(Number(p?.eventId)) && isContestCategory(p));
          setPrograms(allPrograms.map((item, idx) => normalizeProgram(item, idx, eventMap, boothMap)));
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "콘테스트 데이터를 불러오지 못했습니다.");
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
    <div className="ct-root">
      <style>{styles}</style>
      <PageHeader
        title="콘테스트 및 투표"
        subtitle={Number.isFinite(safeEventId) ? SUBTITLE_MAP["/program/contest"] : "전체 콘테스트 프로그램을 확인하세요"}
        categories={categories}
        currentPath="/program/contest"
        onNavigate={(path) => navigate(path)}
      />

      <main className="ct-wrap">
        <div className="ct-stats">
          <div className="ct-stat"><div className="ct-stat-ico" style={{ background: "#eff4ff" }}><CalendarDays size={18} color="#1a4fd6" /></div><div><div className="ct-stat-lb">전체 프로그램</div><div className="ct-stat-v">{programs.length}개</div></div></div>
          <div className="ct-stat"><div className="ct-stat-ico" style={{ background: "#ecfdf5" }}><Clock size={18} color="#10b981" /></div><div><div className="ct-stat-lb">진행 중</div><div className="ct-stat-v">{liveCount}개</div></div></div>
          <div className="ct-stat"><div className="ct-stat-ico" style={{ background: "#fff7ed" }}><Tag size={18} color="#d97706" /></div><div><div className="ct-stat-lb">예정</div><div className="ct-stat-v">{upcomingCount}개</div></div></div>
          <div className="ct-stat"><div className="ct-stat-ico" style={{ background: "#f3f4f6" }}><CalendarCheck size={18} color="#6b7280" /></div><div><div className="ct-stat-lb">완료</div><div className="ct-stat-v">{doneCount}개</div></div></div>
        </div>

        <div className="ct-filter">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>전체</button>
          <button className={filter === "live" ? "active" : ""} onClick={() => setFilter("live")}>진행 중</button>
          <button className={filter === "upcoming" ? "active" : ""} onClick={() => setFilter("upcoming")}>예정</button>
          <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>완료</button>
          <div className="ct-search-wrap">
            <Search size={14} className="ct-search-ico" />
            <input
              className="ct-search"
              placeholder="콘테스트 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <input
            type="date"
            className="ct-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            aria-label="콘테스트 날짜 검색"
          />
        </div>

        {loading ? <div className="ct-empty">로딩 중...</div> : null}
        {!loading && error ? <div className="ct-empty">{error}</div> : null}

        {!loading && !error ? (
          filtered.length === 0 ? (
            <div className="ct-empty">표시할 콘테스트가 없습니다.</div>
          ) : (
            <div className="ct-grid">
              {filtered.map((p) => (
                <div key={`${p.eventId}-${p.id}`} className={`ct-card ${p.status === "live" ? "live" : ""}`}>
                  <div className="ct-thumb">
                    {p.thumbnail ? <img src={p.thumbnail} alt={p.title} loading="lazy" /> : null}
                    <div className="ct-thumb-ph" style={{ display: p.thumbnail ? "none" : "flex" }}>
                      <CalendarDays size={20} />
                    </div>
                  </div>
                  <div className="ct-body">
                    <div className="ct-card-head">
                      <span className={`ct-badge ${p.status}`}>{STATUS_LABEL[p.status]}</span>
                      <span className="ct-cat">{p.category}</span>
                    </div>
                    <div className="ct-title">{p.title}</div>
                    <div className="ct-desc">{p.description || "설명이 없습니다."}</div>
                    <div className="ct-meta">
                      <div className="ct-meta-row"><CalendarDays size={12} /> {p.schedule}</div>
                      <div className="ct-meta-row"><MapPin size={12} /> {p.location}</div>
                    </div>
                    <div className="ct-foot">
                      <span className="ct-host">주최: {p.host}</span>
                      <button className="ct-detail" onClick={() => navigate(p.detailPath)}>상세보기 <ChevronRight size={13} /></button>
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
