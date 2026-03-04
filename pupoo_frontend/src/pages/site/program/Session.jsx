import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import EventSelectPage from "../components/EventSelectPage";
import { SERVICE_CATEGORIES, SUBTITLE_MAP } from "../constants/programConstants";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import { boothApi } from "../../../app/http/boothApi";
import {
  Mic,
  Users,
  MapPin,
  BookOpen,
  ChevronRight,
  PlayCircle,
  Star,
  UserCircle,
  Video,
} from "lucide-react";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .ss-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .ss-root *, .ss-root *::before, .ss-root *::after { box-sizing: border-box; font-family: inherit; }
  .ss-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .ss-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 20px;
  }
  .ss-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
    animation: ss-pulse 1.4s ease-in-out infinite;
  }
  @keyframes ss-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .ss-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .ss-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px 22px;
    display: flex; align-items: center; gap: 14px;
  }
  .ss-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ss-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .ss-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  .ss-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .ss-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .ss-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; margin: 0; }
  .ss-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #fffbeb; display: flex; align-items: center; justify-content: center; }
  .ss-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  .ss-filter-bar { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
  .ss-filter-btn {
    padding: 7px 16px; border: 1px solid #e9ecef; border-radius: 100px;
    background: #fff; font-size: 12px; font-weight: 600; color: #6b7280;
    cursor: pointer; transition: all 0.15s; font-family: inherit;
  }
  .ss-filter-btn:hover { border-color: #1a4fd6; color: #1a4fd6; }
  .ss-filter-btn.active { background: #1a4fd6; border-color: #1a4fd6; color: #fff; }

  .ss-session-list { display: flex; flex-direction: column; gap: 12px; }
  .ss-session-item {
    display: flex; gap: 18px; padding: 20px 22px; border: 1px solid #e9ecef;
    border-radius: 12px; background: #fff; transition: all 0.15s; cursor: pointer;
  }
  .ss-session-item:hover { border-color: #1a4fd6; background: #f8faff; }
  .ss-session-item.live { border-color: #10b981; background: #f0fdf9; }
  .ss-session-time {
    width: 80px; flex-shrink: 0; text-align: center; padding-top: 2px;
  }
  .ss-session-time-main { font-size: 16px; font-weight: 800; color: #111827; }
  .ss-session-time-end { font-size: 11px; color: #9ca3af; margin-top: 2px; }
  .ss-session-divider { width: 3px; border-radius: 2px; flex-shrink: 0; }
  .ss-session-body { flex: 1; }
  .ss-session-name { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .ss-session-desc { font-size: 12.5px; color: #6b7280; line-height: 1.5; margin-bottom: 10px; }
  .ss-session-speaker { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .ss-speaker-avatar {
    width: 28px; height: 28px; border-radius: 50%; background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
  }
  .ss-speaker-name { font-size: 12px; font-weight: 600; color: #111827; }
  .ss-speaker-role { font-size: 11px; color: #9ca3af; }
  .ss-session-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #9ca3af; }
  .ss-session-meta-item { display: flex; align-items: center; gap: 3px; }
  .ss-session-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
  .ss-session-badge {
    padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600;
  }
  .ss-session-badge.live { background: #ecfdf5; color: #059669; }
  .ss-session-badge.upcoming { background: #fff7ed; color: #d97706; }
  .ss-session-badge.done { background: #f3f4f6; color: #9ca3af; }
  .ss-session-rating { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #f59e0b; font-weight: 600; }
  .ss-tag-list { display: flex; gap: 5px; margin-top: 8px; }
  .ss-tag {
    font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 100px;
  }
  .ss-tag.session { background: #eff4ff; color: #1a4fd6; }

  @media (max-width: 640px) {
    .ss-container { padding: 20px 16px 48px; }
    .ss-stat-grid { grid-template-columns: 1fr 1fr; }
    .ss-session-item { flex-direction: column; gap: 10px; }
    .ss-session-time { width: auto; text-align: left; display: flex; gap: 6px; align-items: baseline; }
  }
`;

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "live", label: "진행 중" },
  { key: "upcoming", label: "예정" },
  { key: "done", label: "완료" },
];

const STATUS_LABEL = { live: "진행 중", upcoming: "예정", done: "완료" };
const DIVIDER_COLORS = ["#10b981", "#1a4fd6", "#f59e0b", "#8b5cf6", "#ec4899"];

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateRange(startAt, endAt) {
  const pick = (v) => {
    const m = String(v ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[1]}.${m[2]}.${m[3]}` : "";
  };
  const a = pick(startAt);
  const b = pick(endAt);
  if (a && b) return `${a} ~ ${b}`;
  return a || b || "일정 미정";
}

function formatTime(value) {
  const m = String(value ?? "").match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

function toEventStatus(rawStatus, startAt, endAt) {
  const raw = String(rawStatus ?? "").toUpperCase();
  if (raw.includes("ONGOING") || raw.includes("LIVE")) return "live";
  if (raw.includes("END")) return "ended";
  const now = Date.now();
  const s = parseDate(startAt)?.getTime();
  const e = parseDate(endAt)?.getTime();
  if (s && now < s) return "upcoming";
  if (e && now > e) return "ended";
  return "upcoming";
}

function toSessionStatus(item) {
  if (item?.ongoing) return "live";
  if (item?.ended) return "done";
  if (item?.upcoming) return "upcoming";
  const now = Date.now();
  const s = parseDate(item?.startAt)?.getTime();
  const e = parseDate(item?.endAt)?.getTime();
  if (s && now < s) return "upcoming";
  if (e && now > e) return "done";
  return "live";
}

function SessionContent({ sessions, loading, errorMsg, onClickItem }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return sessions;
    return sessions.filter((s) => s.status === filter);
  }, [filter, sessions]);

  const liveCount = sessions.filter((s) => s.status === "live").length;
  const totalPeople = sessions.reduce((sum, s) => sum + Number(s.people || 0), 0);

  return (
    <>
      <div className="ss-live-badge">
        <div className="ss-live-dot" />
        LIVE
      </div>

      <div className="ss-stat-grid">
        {[
          {
            label: "전체 세션",
            value: `${sessions.length}개`,
            icon: <Mic size={20} color="#1a4fd6" />,
            bg: "#eff4ff",
          },
          {
            label: "진행 중",
            value: `${liveCount}개`,
            icon: <PlayCircle size={20} color="#10b981" />,
            bg: "#ecfdf5",
          },
          {
            label: "총 참석자",
            value: `${totalPeople}명`,
            icon: <Users size={20} color="#f59e0b" />,
            bg: "#fffbeb",
          },
          {
            label: "평균 평점",
            value: "-",
            icon: <Star size={20} color="#ec4899" />,
            bg: "#fce7f3",
          },
        ].map((s) => (
          <div key={s.label} className="ss-stat-card">
            <div className="ss-stat-icon" style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div>
              <div className="ss-stat-label">{s.label}</div>
              <div className="ss-stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="ss-card">
        <div className="ss-card-header">
          <div className="ss-card-title">
            <div className="ss-card-title-icon">
              <BookOpen size={14} color="#f59e0b" />
            </div>
            세션 · 강연
          </div>
          <span className="ss-card-tag">총 {sessions.length}개</span>
        </div>

        <div className="ss-filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`ss-filter-btn${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? <div className="ss-card-tag">로딩 중...</div> : null}
        {!loading && errorMsg ? <div className="ss-card-tag">{errorMsg}</div> : null}
        {!loading && !errorMsg && filtered.length === 0 ? (
          <div className="ss-card-tag">표시할 세션이 없습니다.</div>
        ) : null}

        {!loading && !errorMsg && filtered.length > 0 ? (
          <div className="ss-session-list">
            {filtered.map((s, idx) => (
              <div
                key={s.id}
                className={`ss-session-item${s.status === "live" ? " live" : ""}`}
                onClick={() => onClickItem(s)}
              >
                <div className="ss-session-time">
                  <div className="ss-session-time-main">{s.time}</div>
                  <div className="ss-session-time-end">~{s.endTime}</div>
                </div>
                <div
                  className="ss-session-divider"
                  style={{ background: DIVIDER_COLORS[idx % DIVIDER_COLORS.length] }}
                />
                <div className="ss-session-body">
                  <div className="ss-session-name">{s.name}</div>
                  <div className="ss-session-desc">{s.desc || "설명이 없습니다."}</div>
                  <div className="ss-session-speaker">
                    <div className="ss-speaker-avatar">
                      <UserCircle size={18} color="#9ca3af" />
                    </div>
                    <div>
                      <div className="ss-speaker-name">{s.speaker}</div>
                      <div className="ss-speaker-role">{s.role}</div>
                    </div>
                  </div>
                  <div className="ss-session-meta">
                    <span className="ss-session-meta-item">
                      <MapPin size={11} /> {s.zone}
                    </span>
                    <span className="ss-session-meta-item">
                      <Users size={11} /> {s.people}/{s.max}명
                    </span>
                    {s.status === "live" ? (
                      <span className="ss-session-meta-item">
                        <Video size={11} /> 실시간 진행
                      </span>
                    ) : null}
                  </div>
                  <div className="ss-tag-list">
                    <span className="ss-tag session">세션</span>
                  </div>
                </div>
                <div className="ss-session-right">
                  <span className={`ss-session-badge ${s.status}`}>{STATUS_LABEL[s.status]}</span>
                  {s.rating ? (
                    <div className="ss-session-rating">
                      <Star size={12} fill="#f59e0b" /> {s.rating}
                    </div>
                  ) : null}
                  <ChevronRight size={16} color="#d1d5db" />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

function SessionDetail({ eventId }) {
  const navigate = useNavigate();
  const currentPath = "/program/session";
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!eventId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const [list, boothRes] = await Promise.all([
          programApi.getAllProgramsByEvent({
            eventId: Number(eventId),
            category: "SESSION",
            sort: "startAt,asc",
          }),
          boothApi.getEventBooths({
            eventId: Number(eventId),
            page: 0,
            size: 200,
            sort: "boothId,asc",
          }),
        ]);
        if (!mounted) return;

        const booths = Array.isArray(boothRes?.data?.data?.content)
          ? boothRes.data.data.content
          : [];
        const boothMap = new Map(
          booths
            .map((b) => [Number(b?.boothId), b?.placeName])
            .filter(([id, name]) => Number.isFinite(id) && !!name),
        );

        const raw = Array.isArray(list) ? list : [];
        const speakerLists = await Promise.all(
          raw.map(async (item) => {
            try {
              const res = await programApi.getProgramSpeakers(item?.programId);
              return Array.isArray(res?.data?.data) ? res.data.data : [];
            } catch {
              return [];
            }
          }),
        );
        if (!mounted) return;

        const mapped = raw.map((item, idx) => {
          const speakers = speakerLists[idx] || [];
          const first = speakers[0] || {};
          return {
            id: Number(item?.programId ?? idx + 1),
            name: item?.programTitle ?? `세션 ${idx + 1}`,
            desc: item?.description ?? "",
            speaker: first?.speakerName ?? "연사 정보 없음",
            role: first?.speakerBio ?? "",
            time: formatTime(item?.startAt) || "시간 미정",
            endTime: formatTime(item?.endAt) || "시간 미정",
            zone:
              item?.boothName ??
              boothMap.get(Number(item?.boothId)) ??
              "장소 미정",
            people: Number(item?.participantCount ?? 0),
            max: Number(item?.capacity ?? 0),
            rating: null,
            status: toSessionStatus(item),
            detailPath: `/program/detail?programId=${item?.programId}`,
          };
        });

        setSessions(mapped);
      } catch (e) {
        if (!mounted) return;
        setSessions([]);
        setErrorMsg(
          e?.response?.data?.message ||
            e?.message ||
            "세션 데이터를 불러오지 못했습니다.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  return (
    <div className="ss-root">
      <style>{styles}</style>
      <PageHeader
        title="세션 · 강연"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={(path) => navigate(path)}
      />
      <main className="ss-container">
        <SessionContent
          sessions={sessions}
          loading={loading}
          errorMsg={errorMsg}
          onClickItem={(s) => navigate(s.detailPath)}
        />
      </main>
    </div>
  );
}

export default function Session() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const currentPath = "/program/session";
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    if (eventId) return;
    let mounted = true;
    const load = async () => {
      setEventsLoading(true);
      try {
        const res = await eventApi.getEvents({
          page: 0,
          size: 200,
          sort: "startAt,desc",
        });
        if (!mounted) return;
        const list = Array.isArray(res?.data?.data?.content)
          ? res.data.data.content
          : [];
        setEvents(
          list.map((evt) => ({
            id: evt?.eventId,
            name: evt?.eventName ?? "행사",
            description: evt?.description ?? "",
            date: formatDateRange(evt?.startAt, evt?.endAt),
            location: evt?.location ?? "장소 미정",
            organizer: evt?.eventName ?? "주최 정보 없음",
            status: toEventStatus(evt?.status, evt?.startAt, evt?.endAt),
            participants: 0,
            thumbnail: null,
            color: "#1a4fd6",
          })),
        );
      } catch {
        if (!mounted) return;
        setEvents([]);
      } finally {
        if (mounted) setEventsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  if (!eventId) {
    return (
      <div className="ss-root">
        <style>{styles}</style>
        <PageHeader
          title="세션 · 강연"
          subtitle="행사를 선택해 세션 프로그램을 확인하세요"
          categories={SERVICE_CATEGORIES}
          currentPath={currentPath}
          onNavigate={(path) => navigate(path)}
        />
        <EventSelectPage events={events} basePath="/program/session" />
        {eventsLoading ? (
          <main className="ss-container">
            <div className="ss-card-tag">행사 목록 불러오는 중...</div>
          </main>
        ) : null}
      </div>
    );
  }

  return <SessionDetail eventId={eventId} />;
}
