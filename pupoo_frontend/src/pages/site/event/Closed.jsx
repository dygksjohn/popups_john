import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  BarChart2,
  Calendar,
  Download,
  MapPin,
  Search,
  Star,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import { eventApi } from "../../../app/http/eventApi";
import { toPublicAssetUrl } from "../../../shared/utils/publicAssetUrl";

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
  "/event/closed": "종료된 행사 결과를 확인합니다",
  "/event/preregister": "행사 사전 등록을 진행합니다",
  "/event/eventschedule": "행사 일정을 안내합니다",
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
  .closed-root{min-height:100vh;background:#f8f9fc;font-family:'Pretendard Variable','Pretendard',sans-serif}
  .closed-root *{box-sizing:border-box;font-family:inherit}
  .closed-wrap{max-width:1400px;margin:0 auto;padding:32px 24px 64px}
  .closed-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
  .closed-stat{display:flex;gap:14px;align-items:center;padding:20px 22px;border:1px solid #e9ecef;border-radius:14px;background:#fff}
  .closed-icon{width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center}
  .closed-label{font-size:12px;color:#6b7280;font-weight:600}.closed-value{font-size:22px;color:#111827;font-weight:800}
  .closed-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:18px}
  .closed-search-wrap{position:relative;flex:1;min-width:220px}.closed-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#9ca3af}
  .closed-search{width:100%;height:40px;padding:0 12px 0 36px;border:1px solid #e2e8f0;border-radius:8px;background:#fff}
  .closed-chip,.closed-download,.closed-action{height:40px;padding:0 14px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer}
  .closed-chip{border:1px solid #e2e8f0;background:#fff;color:#374151}
  .closed-chip.active{border-color:#1a4fd6;background:#f5f8ff;color:#1a4fd6}
  .closed-download{border:none;background:linear-gradient(135deg,#1a4fd6,#2563eb);color:#fff;display:inline-flex;align-items:center;gap:6px}
  .closed-grid{display:grid;grid-template-columns:340px 1fr;gap:16px;margin-bottom:20px}
  .closed-panel,.closed-chart,.closed-card{background:#fff;border:1px solid #e9ecef;border-radius:14px}
  .closed-panel{padding:22px}.closed-badge{display:inline-flex;gap:6px;align-items:center;padding:5px 10px;border-radius:999px;background:#eff4ff;color:#1a4fd6;font-size:11px;font-weight:800;margin-bottom:12px}
  .closed-title{font-size:22px;font-weight:800;color:#111827;line-height:1.4;margin-bottom:10px}
  .closed-meta{display:flex;flex-direction:column;gap:8px;font-size:13px;color:#64748b;margin-bottom:16px}
  .closed-meta span{display:inline-flex;gap:6px;align-items:center}
  .closed-mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
  .closed-mini{padding:12px 13px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc}
  .closed-mini div:first-child{font-size:11px;color:#6b7280;font-weight:700;margin-bottom:5px}
  .closed-mini div:last-child{font-size:18px;color:#111827;font-weight:800}
  .closed-stars{display:flex;align-items:center;gap:3px;margin-bottom:14px}
  .closed-desc{font-size:13px;line-height:1.7;color:#475569}
  .closed-chart{padding:18px 20px 20px}.closed-chart-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;margin-bottom:14px;border-bottom:1px solid #f1f3f5}
  .closed-chart-title{font-size:15px;font-weight:800;color:#111827;display:flex;gap:8px;align-items:center}.closed-chart-sub{font-size:12px;color:#94a3b8}
  .closed-box{border:1px solid #eef2f7;border-radius:12px;padding:16px 16px 10px;background:#fbfdff}.closed-box+.closed-box{margin-top:14px}
  .closed-box h3{margin:0 0 4px;font-size:13px;font-weight:800;color:#111827}.closed-box p{margin:0 0 14px;font-size:11px;color:#94a3b8}
  .closed-card{padding:24px 28px}.closed-card-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;margin-bottom:18px;border-bottom:1px solid #f1f3f5}
  .closed-card-title{font-size:15px;font-weight:800;color:#111827;display:flex;gap:8px;align-items:center}.closed-count{font-size:12px;color:#9ca3af}
  .closed-table-wrap{overflow:auto}.closed-table{width:100%;border-collapse:collapse}.closed-table thead tr{background:#f9fafb}
  .closed-table th,.closed-table td{padding:12px 16px;border-bottom:1px solid #f1f3f5;text-align:left;font-size:13px;color:#374151;white-space:nowrap}
  .closed-table th{font-size:12px;color:#6b7280;font-weight:700}.closed-name{display:flex;align-items:center;gap:10px;min-width:230px;font-weight:700;color:#111827}
  .closed-thumb{width:56px;height:42px;border-radius:8px;overflow:hidden;background:#eef2ff;border:1px solid #dbe3ff;flex-shrink:0}.closed-thumb img{width:100%;height:100%;object-fit:cover;display:block}
  .closed-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:18px;background:linear-gradient(135deg,#1a4fd6,#6366f1)}
  .closed-status{display:inline-flex;gap:4px;align-items:center;padding:3px 10px;border-radius:999px;background:#f3f4f6;color:#6b7280;font-size:11px;font-weight:700}
  .closed-action{height:30px;padding:0 10px;border:1px solid #e2e8f0;background:#fff;color:#374151;font-size:11px;display:inline-flex;gap:4px;align-items:center;margin-right:6px}
  .closed-empty{display:flex;align-items:center;justify-content:center;padding:80px 24px;color:#94a3b8;font-size:14px}
  @media (max-width:1080px){.closed-grid{grid-template-columns:1fr}}@media (max-width:900px){.closed-stats{grid-template-columns:repeat(2,1fr)}}@media (max-width:640px){.closed-wrap{padding:24px 16px 48px}.closed-stats{grid-template-columns:1fr}.closed-mini-grid{grid-template-columns:1fr}}
`;

const PARTICIPANT_COLORS = ["#1a4fd6", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];
const RATING_COLORS = ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7"];

const fmtDate = (value) => {
  if (!value) return "일정 미정";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "일정 미정";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

const fmtRange = (startAt, endAt) => {
  const start = fmtDate(startAt);
  const end = fmtDate(endAt);
  return start === end ? start : `${start} ~ ${end}`;
};

const yearOf = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : String(date.getFullYear());
};

const shortName = (value, limit = 14) => (value.length > limit ? `${value.slice(0, limit)}…` : value);

const toEvent = (raw) => {
  const rating = Number(raw?.averageRating ?? 0);
  return {
    id: Number(raw?.eventId),
    title: raw?.eventName ?? "행사",
    description: raw?.description ?? "",
    dateLabel: fmtRange(raw?.startAt, raw?.endAt),
    year: yearOf(raw?.startAt),
    location: raw?.location ?? "장소 미정",
    image: raw?.imageUrl ? toPublicAssetUrl(raw.imageUrl) : "",
    participants: Number(raw?.participantCount ?? 0),
    capacity: Number(raw?.capacity ?? 500),
    participationRate: Number(raw?.participationRate ?? 0),
    rating,
    reviewCount: Number(raw?.reviewCount ?? 0),
    ratingText: rating.toFixed(1),
  };
};

function Stars({ value }) {
  return (
    <div className="closed-stars">
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          size={13}
          fill={index <= Math.round(value) ? "#f59e0b" : "none"}
          color={index <= Math.round(value) ? "#f59e0b" : "#d1d5db"}
        />
      ))}
      <span style={{ fontSize: 11.5, color: "#6b7280", marginLeft: 4 }}>{Number(value || 0).toFixed(1)}</span>
    </div>
  );
}

function Tip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", boxShadow: "0 12px 24px rgba(15,23,42,0.12)" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#111827", marginBottom: 6 }}>{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#475569" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, display: "inline-block" }} />
          <span>{item.name}</span>
          <strong style={{ color: "#111827" }}>{formatter ? formatter(item.value, item.dataKey) : item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function downloadImage(event) {
  if (!event) return;
  const canvas = document.createElement("canvas");
  canvas.width = 1440;
  canvas.height = 860;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 320);
  gradient.addColorStop(0, "#1a4fd6");
  gradient.addColorStop(1, "#2563eb");
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, 300);
  ctx.fillStyle = "#fff";
  ctx.font = "700 28px 'Pretendard Variable','Noto Sans KR',sans-serif";
  ctx.fillText("종료 행사 결과 리포트", 80, 84);
  ctx.font = "800 54px 'Pretendard Variable','Noto Sans KR',sans-serif";
  ctx.fillText(event.title, 80, 162, 980);
  ctx.font = "500 22px 'Pretendard Variable','Noto Sans KR',sans-serif";
  ctx.fillText(`${event.dateLabel}  |  ${event.location}`, 80, 210, 1120);
  ctx.fillStyle = "#fff";
  ctx.fillRect(60, 250, 1320, 540);
  ctx.strokeStyle = "#dbe3ff";
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 250, 1320, 540);
  [
    ["참가자수", `${event.participants.toLocaleString()}명`, "#1a4fd6"],
    ["참가율", `${event.participationRate}%`, "#10b981"],
    ["별점", `${event.ratingText} / 5.0`, "#f59e0b"],
    ["후기 수", `${event.reviewCount.toLocaleString()}건`, "#7c3aed"],
  ].forEach(([label, value, color], index) => {
    const x = 90 + index * 315;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x, 290, 285, 140);
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(x, 290, 285, 140);
    ctx.fillStyle = color;
    ctx.fillRect(x, 290, 285, 10);
    ctx.fillStyle = "#64748b";
    ctx.font = "700 20px 'Pretendard Variable','Noto Sans KR',sans-serif";
    ctx.fillText(label, x + 18, 342);
    ctx.fillStyle = "#111827";
    ctx.font = "800 34px 'Pretendard Variable','Noto Sans KR',sans-serif";
    ctx.fillText(value, x + 18, 392, 245);
  });
  [
    ["참가자수", event.capacity > 0 ? Math.min(event.participants / event.capacity, 1) : 0, `${event.participants.toLocaleString()} / ${event.capacity.toLocaleString()}명`, "#1a4fd6", 500],
    ["참가율", Math.min(event.participationRate / 100, 1), `${event.participationRate}%`, "#10b981", 610],
    ["별점", Math.min(event.rating / 5, 1), `${event.ratingText}점`, "#f59e0b", 720],
  ].forEach(([label, value, text, color, y]) => {
    ctx.fillStyle = "#111827";
    ctx.font = "700 24px 'Pretendard Variable','Noto Sans KR',sans-serif";
    ctx.fillText(label, 90, y);
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(90, y + 24, 1120, 22);
    ctx.fillStyle = color;
    ctx.fillRect(90, y + 24, 1120 * value, 22);
    ctx.fillStyle = "#334155";
    ctx.font = "600 20px 'Pretendard Variable','Noto Sans KR',sans-serif";
    ctx.fillText(text, 1230, y + 42, 120);
  });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${String(event.title).replace(/[\\\\/:*?\"<>|]+/g, " ").trim()}-결과.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

export default function Closed() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await eventApi.getClosedAnalytics();
        const list = Array.isArray(res?.data?.data) ? res.data.data.map(toEvent) : [];
        if (!mounted) return;
        setEvents(list);
        setSelectedId(list[0]?.id ?? null);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err?.message || "종료 행사 결과를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const years = useMemo(() => ["all", ...Array.from(new Set(events.map((event) => event.year).filter(Boolean))).sort((a, b) => Number(b) - Number(a))], [events]);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchKeyword = !keyword || event.title.toLowerCase().includes(keyword) || event.location.toLowerCase().includes(keyword);
      return matchKeyword && (year === "all" || event.year === year);
    });
  }, [events, query, year]);

  useEffect(() => {
    if (!filtered.length) return setSelectedId(null);
    if (!filtered.some((event) => event.id === selectedId)) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const selected = filtered.find((event) => event.id === selectedId) ?? filtered[0] ?? null;
  const totalParticipants = filtered.reduce((sum, event) => sum + event.participants, 0);
  const avgRate = filtered.length ? Math.round(filtered.reduce((sum, event) => sum + event.participationRate, 0) / filtered.length) : 0;
  const avgRating = filtered.length ? (filtered.reduce((sum, event) => sum + event.rating, 0) / filtered.length).toFixed(1) : "0.0";

  const participationChart = filtered.map((event) => ({
    name: shortName(event.title),
    fullName: event.title,
    participants: event.participants,
    participationRate: event.participationRate,
  }));
  const ratingChart = filtered.map((event) => ({
    name: shortName(event.title),
    fullName: event.title,
    rating: Number(event.ratingText),
  }));

  return (
    <div className="closed-root">
      <style>{styles}</style>
      <PageHeader
        title="종료 행사"
        subtitle={SUBTITLE_MAP["/event/closed"]}
        categories={SERVICE_CATEGORIES}
        currentPath="/event/closed"
        onNavigate={(path) => navigate(path)}
      />
      <main className="closed-wrap">
        {loading ? <div className="closed-empty">종료 행사 결과를 불러오는 중입니다.</div> : null}
        {!loading && error ? <div className="closed-empty">{error}</div> : null}
        {!loading && !error ? (
          <>
            <div className="closed-stats">
              {[
                ["종료 행사 수", `${filtered.length}개`, <Archive size={20} color="#6b7280" />, "#f3f4f6"],
                ["누적 참가자수", `${totalParticipants.toLocaleString()}명`, <Users size={20} color="#1a4fd6" />, "#eff4ff"],
                ["평균 참가율", `${avgRate}%`, <BarChart2 size={20} color="#10b981" />, "#ecfdf5"],
                ["평균 별점", `${avgRating}점`, <Star size={20} color="#f59e0b" />, "#fffbeb"],
              ].map(([label, value, icon, bg]) => (
                <div key={label} className="closed-stat">
                  <div className="closed-icon" style={{ background: bg }}>{icon}</div>
                  <div><div className="closed-label">{label}</div><div className="closed-value">{value}</div></div>
                </div>
              ))}
            </div>

            <div className="closed-tools">
              <div className="closed-search-wrap">
                <Search size={15} className="closed-search-icon" />
                <input className="closed-search" placeholder="행사명, 장소 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
              {years.map((value) => (
                <button key={value} type="button" className={`closed-chip${year === value ? " active" : ""}`} onClick={() => setYear(value)}>
                  {value === "all" ? "전체 연도" : `${value}년`}
                </button>
              ))}
              <button type="button" className="closed-download" disabled={!selected} onClick={() => downloadImage(selected)}>
                <Download size={14} /> 결과 이미지 다운로드
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="closed-empty">조건에 맞는 종료 행사가 없습니다.</div>
            ) : (
              <>
                <section className="closed-grid">
                  <article className="closed-panel">
                    <div className="closed-badge"><Archive size={12} /> 선택된 결과</div>
                    <div className="closed-title">{selected?.title}</div>
                    <div className="closed-meta">
                      <span><Calendar size={14} /> {selected?.dateLabel}</span>
                      <span><MapPin size={14} /> {selected?.location}</span>
                      <span><Users size={14} /> 후기 {selected?.reviewCount?.toLocaleString()}건</span>
                    </div>
                    <div className="closed-mini-grid">
                      <div className="closed-mini"><div>참가자수</div><div>{selected?.participants?.toLocaleString()}명</div></div>
                      <div className="closed-mini"><div>참가율</div><div>{selected?.participationRate}%</div></div>
                      <div className="closed-mini"><div>별점</div><div>{selected?.ratingText}점</div></div>
                      <div className="closed-mini"><div>수용 인원 기준</div><div>{selected?.capacity?.toLocaleString()}명</div></div>
                    </div>
                    <Stars value={selected?.rating} />
                    <div className="closed-desc">{selected?.description || "등록된 행사 설명이 없습니다."}</div>
                  </article>

                  <article className="closed-chart">
                    <div className="closed-chart-head">
                      <div>
                        <div className="closed-chart-title"><BarChart2 size={16} color="#1a4fd6" /> 행사별 결과 그래프</div>
                        <div className="closed-chart-sub">종료된 행사별 참가자수, 참가율, 별점을 비교합니다.</div>
                      </div>
                    </div>
                    <div className="closed-box">
                      <h3>참가자수 / 참가율</h3>
                      <p>왼쪽 축은 참가자수, 오른쪽 축은 참가율입니다.</p>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={participationChart} barGap={10}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                          <Tooltip content={<Tip formatter={(value, key) => key === "participants" ? `${Number(value).toLocaleString()}명` : `${Number(value)}%`} />} />
                          <Bar yAxisId="left" dataKey="participants" name="참가자수" radius={[8, 8, 0, 0]}>{participationChart.map((item, index) => <Cell key={`${item.fullName}-participants`} fill={PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length]} />)}</Bar>
                          <Bar yAxisId="right" dataKey="participationRate" name="참가율" radius={[8, 8, 0, 0]}>{participationChart.map((item, index) => <Cell key={`${item.fullName}-rate`} fill={index % 2 === 0 ? "#10b981" : "#34d399"} />)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="closed-box">
                      <h3>행사별 별점</h3>
                      <p>후기 평균 별점을 5점 기준으로 표시합니다.</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={ratingChart}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 5]} tickFormatter={(value) => `${value}점`} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                          <Tooltip content={<Tip formatter={(value) => `${Number(value).toFixed(1)}점`} />} />
                          <Bar dataKey="rating" name="별점" radius={[8, 8, 0, 0]}>{ratingChart.map((item, index) => <Cell key={`${item.fullName}-rating`} fill={RATING_COLORS[index % RATING_COLORS.length]} />)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </article>
                </section>

                <section className="closed-card">
                  <div className="closed-card-head">
                    <div className="closed-card-title"><Archive size={14} color="#6b7280" /> 종료 행사 결과 목록</div>
                    <span className="closed-count">총 {filtered.length}건</span>
                  </div>
                  <div className="closed-table-wrap">
                    <table className="closed-table">
                      <thead>
                        <tr>
                          <th>행사명</th><th>일자</th><th>장소</th><th>참가자수</th><th>참가율</th><th>별점</th><th>후기 수</th><th>상태</th><th>액션</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((event) => (
                          <tr key={event.id}>
                            <td><div className="closed-name"><div className="closed-thumb">{event.image ? <img src={event.image} alt={event.title} onError={(imageEvent) => { imageEvent.currentTarget.style.display = "none"; const fallback = imageEvent.currentTarget.nextElementSibling; if (fallback) fallback.style.display = "flex"; }} /> : null}<div className="closed-fallback" style={{ display: event.image ? "none" : "flex" }}>🐾</div></div><span>{event.title}</span></div></td>
                            <td>{event.dateLabel}</td>
                            <td>{event.location}</td>
                            <td>{event.participants.toLocaleString()}명</td>
                            <td><span style={{ fontWeight: 700, color: event.participationRate >= 80 ? "#059669" : event.participationRate >= 50 ? "#d97706" : "#6b7280" }}>{event.participationRate}%</span></td>
                            <td><Stars value={event.rating} /></td>
                            <td>{event.reviewCount.toLocaleString()}건</td>
                            <td><span className="closed-status"><Archive size={10} /> 종료</span></td>
                            <td>
                              <button type="button" className="closed-action" onClick={() => setSelectedId(event.id)}><BarChart2 size={11} /> 결과 보기</button>
                              <button type="button" className="closed-action" onClick={() => downloadImage(event)}><Download size={11} /> 이미지 저장</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
