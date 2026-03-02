import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import EventSelectPage from "../components/EventSelectPage";
import { SERVICE_CATEGORIES, SUBTITLE_MAP } from "../constants/programConstants";
import { eventApi } from "../../../app/http/eventApi";
import { boothApi } from "../../../app/http/boothApi";
import {
  Store,
  MapPin,
  Users,
  Star,
  Eye,
  ChevronRight,
  TrendingUp,
  Heart,
} from "lucide-react";
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .bt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .bt-root *, .bt-root *::before, .bt-root *::after { box-sizing: border-box; font-family: inherit; }
  .bt-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .bt-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 20px;
  }
  .bt-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
    animation: bt-pulse 1.4s ease-in-out infinite;
  }
  @keyframes bt-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  /* Stat grid */
  .bt-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .bt-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px 22px;
    display: flex; align-items: center; gap: 14px;
  }
  .bt-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .bt-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .bt-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  /* Card */
  .bt-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .bt-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .bt-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; margin: 0; }
  .bt-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #fffbeb; display: flex; align-items: center; justify-content: center; }
  .bt-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  /* Layout */
  .bt-main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  /* Booth card */
  .bt-booth-list { display: flex; flex-direction: column; gap: 10px; }
  .bt-booth-item {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 18px; border: 1px solid #e9ecef; border-radius: 10px;
    background: #fff; transition: all 0.15s; cursor: pointer;
  }
  .bt-booth-item:hover { border-color: #1a4fd6; background: #f8faff; }
  .bt-booth-item.popular { border-color: #fbbf24; background: #fffdf5; }
  .bt-booth-icon {
    width: 44px; height: 44px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .bt-booth-info { flex: 1; }
  .bt-booth-name { font-size: 14px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 6px; }
  .bt-booth-sub { font-size: 12px; color: #9ca3af; margin-top: 3px; display: flex; align-items: center; gap: 10px; }
  .bt-booth-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600;
  }
  .bt-booth-badge.open { background: #ecfdf5; color: #059669; }
  .bt-booth-badge.closed { background: #f3f4f6; color: #9ca3af; }
  .bt-booth-badge.full { background: #fff0f0; color: #ef4444; }
  .bt-booth-arrow { color: #d1d5db; flex-shrink: 0; }

  /* Floor map placeholder */
  .bt-floor-map {
    width: 100%; aspect-ratio: 16/10; background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
    border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; color: #6b7280; border: 2px dashed #d1d5db;
  }
  .bt-floor-map-text { font-size: 13px; font-weight: 600; }

  /* Popular ranking */
  .bt-rank-list { display: flex; flex-direction: column; gap: 8px; }
  .bt-rank-item {
    display: flex; align-items: center; gap: 12px; padding: 12px 14px;
    border-radius: 8px; background: #fafbfc;
  }
  .bt-rank-num {
    width: 28px; height: 28px; border-radius: 8px; background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800; color: #6b7280; flex-shrink: 0;
  }
  .bt-rank-num.top { background: #fef3c7; color: #d97706; }
  .bt-rank-name { flex: 1; font-size: 13px; font-weight: 600; color: #111827; }
  .bt-rank-visitors { font-size: 12px; color: #9ca3af; font-weight: 500; }
  .bt-rank-bar-bg { flex: 1; height: 6px; background: #f1f3f5; border-radius: 3px; overflow: hidden; margin-left: 8px; }
  .bt-rank-bar { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #1a4fd6, #3b82f6); }

  @media (max-width: 900px) {
    .bt-main-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .bt-container { padding: 20px 16px 48px; }
    .bt-stat-grid { grid-template-columns: 1fr 1fr; }
  }
`;
const STATUS_LABEL = {
  open: "운영 중",
  closed: "운영 종료",
  full: "혼잡",
};

const BOOTH_COLORS = [
  { bg: "#eff4ff", color: "#1a4fd6" },
  { bg: "#ecfdf5", color: "#10b981" },
  { bg: "#fef3c7", color: "#d97706" },
  { bg: "#fce7f3", color: "#ec4899" },
  { bg: "#f5f3ff", color: "#8b5cf6" },
  { bg: "#fff7ed", color: "#f59e0b" },
];

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

function toEventStatus(rawStatus, startAt, endAt) {
  const raw = String(rawStatus ?? "").toUpperCase();
  if (raw.includes("ONGOING") || raw.includes("LIVE")) return "live";
  if (raw.includes("END")) return "ended";
  const now = Date.now();
  const s = startAt ? new Date(startAt).getTime() : null;
  const e = endAt ? new Date(endAt).getTime() : null;
  if (s && now < s) return "upcoming";
  if (e && now > e) return "ended";
  return "upcoming";
}

function normalizeBoothStatus(raw) {
  const v = String(raw ?? "").toUpperCase();
  if (v.includes("CLOSE") || v.includes("END")) return "closed";
  if (v.includes("FULL") || v.includes("WAIT")) return "full";
  return "open";
}

function BoothContent({ booths, loading, errorMsg }) {
  const topBooths = useMemo(
    () => [...booths].sort((a, b) => (b.visitors || 0) - (a.visitors || 0)).slice(0, 5),
    [booths],
  );
  const maxVisitors = Math.max(1, ...topBooths.map((b) => b.visitors || 0));
  const openCount = booths.filter((b) => b.status === "open").length;
  const totalVisitors = booths.reduce((sum, b) => sum + (b.visitors || 0), 0);
  const popularCount = topBooths.slice(0, 3).length;

  return (
    <>
      <div className="bt-live-badge">
        <div className="bt-live-dot" />
        LIVE
      </div>

      <div className="bt-stat-grid">
        {[
          {
            label: "전체 부스",
            value: `${booths.length}개`,
            icon: <Store size={20} color="#1a4fd6" />,
            bg: "#eff4ff",
          },
          {
            label: "운영 중",
            value: `${openCount}개`,
            icon: <Eye size={20} color="#10b981" />,
            bg: "#ecfdf5",
          },
          {
            label: "총 방문자",
            value: `${totalVisitors}명`,
            icon: <Users size={20} color="#f59e0b" />,
            bg: "#fffbeb",
          },
          {
            label: "인기 부스",
            value: `${popularCount}개`,
            icon: <Star size={20} color="#ec4899" />,
            bg: "#fce7f3",
          },
        ].map((s) => (
          <div key={s.label} className="bt-stat-card">
            <div className="bt-stat-icon" style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div>
              <div className="bt-stat-label">{s.label}</div>
              <div className="bt-stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bt-main-grid">
        <div className="bt-card">
          <div className="bt-card-header">
            <div className="bt-card-title">
              <div className="bt-card-title-icon">
                <Store size={14} color="#f59e0b" />
              </div>
              부스 목록
            </div>
            <span className="bt-card-tag">총 {booths.length}개</span>
          </div>

          {loading ? <div className="bt-card-tag">로딩 중...</div> : null}
          {!loading && errorMsg ? <div className="bt-card-tag">{errorMsg}</div> : null}
          {!loading && !errorMsg && booths.length === 0 ? (
            <div className="bt-card-tag">표시할 부스가 없습니다.</div>
          ) : null}

          {!loading && !errorMsg && booths.length > 0 ? (
            <div className="bt-booth-list">
              {booths.map((b) => (
                <div key={b.zone + b.name} className={`bt-booth-item${b.popular ? " popular" : ""}`}>
                  <div className="bt-booth-icon" style={{ background: b.bg }}>
                    <Store size={20} color={b.color} />
                  </div>
                  <div className="bt-booth-info">
                    <div className="bt-booth-name">
                      {b.name}
                      {b.popular ? <Heart size={12} color="#ef4444" fill="#ef4444" /> : null}
                    </div>
                    <div className="bt-booth-sub">
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <MapPin size={11} /> {b.zone}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Users size={11} /> {b.visitors}명 방문
                      </span>
                    </div>
                  </div>
                  <span className={`bt-booth-badge ${b.status}`}>{STATUS_LABEL[b.status]}</span>
                  <ChevronRight size={16} className="bt-booth-arrow" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="bt-card">
            <div className="bt-card-header">
              <div className="bt-card-title">
                <div className="bt-card-title-icon">
                  <MapPin size={14} color="#f59e0b" />
                </div>
                부스 배치도
              </div>
              <span className="bt-card-tag">행사장</span>
            </div>
            <div className="bt-floor-map">
              <MapPin size={32} color="#9ca3af" />
              <span className="bt-floor-map-text">부스 배치도 영역</span>
            </div>
          </div>

          <div className="bt-card">
            <div className="bt-card-header">
              <div className="bt-card-title">
                <div className="bt-card-title-icon">
                  <TrendingUp size={14} color="#f59e0b" />
                </div>
                인기 부스 TOP 5
              </div>
              <span className="bt-card-tag">방문자 기준</span>
            </div>
            <div className="bt-rank-list">
              {topBooths.map((b, i) => (
                <div key={b.name + i} className="bt-rank-item">
                  <div className={`bt-rank-num${i < 3 ? " top" : ""}`}>{i + 1}</div>
                  <span className="bt-rank-name">{b.name}</span>
                  <div className="bt-rank-bar-bg">
                    <div className="bt-rank-bar" style={{ width: `${(b.visitors / maxVisitors) * 100}%` }} />
                  </div>
                  <span className="bt-rank-visitors">{b.visitors}명</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Booth() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const currentPath = "/program/booth";
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (eventId) return;
    let mounted = true;
    const load = async () => {
      setEventsLoading(true);
      try {
        const res = await eventApi.getEvents({ page: 0, size: 200, sort: "startAt,desc" });
        if (!mounted) return;
        const list = Array.isArray(res?.data?.data?.content) ? res.data.data.content : [];
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

  useEffect(() => {
    if (!eventId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await boothApi.getEventBooths({
          eventId: Number(eventId),
          page: 0,
          size: 200,
          sort: "boothId,asc",
        });
        if (!mounted) return;
        const content = Array.isArray(res?.data?.data?.content) ? res.data.data.content : [];
        const mapped = content.map((item, idx) => {
          const color = BOOTH_COLORS[idx % BOOTH_COLORS.length];
          const visitors = Number(item?.visitorCount ?? item?.visitCount ?? item?.waitCount ?? 0);
          return {
            name: item?.boothName ?? item?.placeName ?? `부스 ${item?.boothId ?? idx + 1}`,
            zone: item?.zone ?? item?.location ?? item?.placeName ?? `#${item?.boothId ?? idx + 1}`,
            visitors: Number.isFinite(visitors) ? visitors : 0,
            status: normalizeBoothStatus(item?.status),
            bg: color.bg,
            color: color.color,
          };
        });
        const popularNames = new Set(
          [...mapped].sort((a, b) => b.visitors - a.visitors).slice(0, 3).map((b) => b.name),
        );
        setBooths(mapped.map((b) => ({ ...b, popular: popularNames.has(b.name) })));
      } catch (e) {
        if (!mounted) return;
        setBooths([]);
        setErrorMsg(e?.response?.data?.message || e?.message || "부스 데이터를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  if (!eventId) {
    return (
      <div className="bt-root">
        <style>{styles}</style>
        <PageHeader
          title="부스 안내"
          subtitle="행사를 선택해 부스 운영 현황을 확인하세요"
          categories={SERVICE_CATEGORIES}
          currentPath={currentPath}
          onNavigate={(path) => navigate(path)}
        />
        <EventSelectPage events={events} basePath="/program/booth" />
        {eventsLoading ? (
          <main className="bt-container">
            <div className="bt-card-tag">행사 목록 불러오는 중...</div>
          </main>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bt-root">
      <style>{styles}</style>
      <PageHeader
        title="부스 안내"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={(path) => navigate(path)}
      />
      <main className="bt-container">
        <BoothContent booths={booths} loading={loading} errorMsg={errorMsg} />
      </main>
    </div>
  );
}