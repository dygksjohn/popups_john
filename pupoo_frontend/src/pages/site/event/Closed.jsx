import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  Calendar,
  Download,
  ImageOff,
  MapPin,
  MessageSquareText,
  Search,
  Star,
  Users,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import { toPublicAssetUrl } from "../../../shared/utils/publicAssetUrl";
import { extractEventYear, normalizeEventTitle } from "../../../shared/utils/eventDisplay";

const SERVICE_CATEGORIES = [
  { label: "현재 진행 행사", path: "/event/current" },
  { label: "예정 행사", path: "/event/upcoming" },
  { label: "종료 행사", path: "/event/closed" },
  { label: "행사 사전 등록", path: "/event/preregister" },
  { label: "행사 일정 안내", path: "/event/eventschedule" },
];

const METRIC_COLORS = {
  participants: "#2563eb",
  rate: "#10b981",
  rating: "#f59e0b",
};

function fmtDate(value) {
  if (!value) return "일정 미정";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "일정 미정";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function fmtRange(startAt, endAt) {
  const start = fmtDate(startAt);
  const end = fmtDate(endAt);
  return start === end ? start : `${start} ~ ${end}`;
}

function fmtTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function fmtProgramSchedule(startAt, endAt) {
  const dateLabel = fmtDate(startAt);
  const startTime = fmtTime(startAt);
  const endTime = fmtTime(endAt);
  if (!startTime) return dateLabel;
  return `${dateLabel} ${startTime}${endTime ? ` - ${endTime}` : ""}`;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function getProgramCategoryMeta(category) {
  const normalized = String(category || "").toUpperCase();
  if (normalized.includes("SESSION")) {
    return { label: "세션/강연", bg: "#eff6ff", color: "#2563eb" };
  }
  if (normalized.includes("EXPERIENCE")) {
    return { label: "체험존", bg: "#ecfdf5", color: "#059669" };
  }
  if (normalized.includes("CONTEST")) {
    return { label: "콘테스트", bg: "#fff7ed", color: "#ea580c" };
  }
  return { label: "프로그램", bg: "#f1f5f9", color: "#475569" };
}

function mapEvent(raw) {
  const participants = Number(raw?.participantCount ?? 0);
  const capacity = Number(raw?.capacity ?? 0);
  const participationRate = Number(raw?.participationRate ?? 0);
  const rating = Number(raw?.averageRating ?? 0);

  return {
    id: Number(raw?.eventId),
    title: normalizeEventTitle(raw?.eventName || raw?.title, raw),
    description: raw?.description || "",
    dateLabel: fmtRange(raw?.startAt, raw?.endAt),
    year: extractEventYear(raw),
    location: raw?.location || "장소 미정",
    image: raw?.imageUrl ? toPublicAssetUrl(raw.imageUrl) : "",
    participants,
    capacity,
    participationRate,
    rating,
    ratingText: rating.toFixed(1),
    reviewCount: Number(raw?.reviewCount ?? 0),
  };
}

function downloadResultImage(event) {
  if (!event) return;

  const canvas = document.createElement("canvas");
  canvas.width = 1480;
  canvas.height = 980;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 260);
  headerGradient.addColorStop(0, "#0f172a");
  headerGradient.addColorStop(1, "#1d4ed8");
  ctx.fillStyle = headerGradient;
  ctx.fillRect(54, 54, 1372, 220);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 26px sans-serif";
  ctx.fillText("종료 행사 결과 리포트", 96, 116);
  ctx.font = "800 50px sans-serif";
  ctx.fillText(event.title, 96, 186, 980);
  ctx.font = "500 20px sans-serif";
  ctx.fillText(`${event.dateLabel} | ${event.location}`, 96, 226, 1060);

  const cards = [
    ["참가자수", `${event.participants.toLocaleString()}명`, "#2563eb"],
    ["참가율", `${event.participationRate}%`, "#10b981"],
    ["별점", `${event.ratingText} / 5.0`, "#f59e0b"],
    ["후기 수", `${event.reviewCount.toLocaleString()}건`, "#7c3aed"],
  ];

  cards.forEach(([label, value, color], index) => {
    const x = 72 + index * 334;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, 320, 300, 156);
    ctx.strokeStyle = "#dbe4f0";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 320, 300, 156);
    ctx.fillStyle = color;
    ctx.fillRect(x, 320, 300, 12);
    ctx.fillStyle = "#64748b";
    ctx.font = "700 20px sans-serif";
    ctx.fillText(label, x + 20, 380);
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 36px sans-serif";
    ctx.fillText(value, x + 20, 434, 250);
  });

  const gaugeRows = [
    {
      label: "참가자수",
      percent: event.capacity > 0 ? clamp((event.participants / event.capacity) * 100) : 0,
      value: `${event.participants.toLocaleString()} / ${event.capacity.toLocaleString()}명`,
      color: "#2563eb",
    },
    {
      label: "참가율",
      percent: clamp(event.participationRate),
      value: `${event.participationRate}%`,
      color: "#10b981",
    },
    {
      label: "별점",
      percent: clamp((event.rating / 5) * 100),
      value: `${event.ratingText} / 5.0`,
      color: "#f59e0b",
    },
  ];

  gaugeRows.forEach((row, index) => {
    const top = 574 + index * 104;
    ctx.fillStyle = "#0f172a";
    ctx.font = "700 24px sans-serif";
    ctx.fillText(row.label, 92, top);
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(92, top + 22, 1080, 24);
    ctx.fillStyle = row.color;
    ctx.fillRect(92, top + 22, 1080 * (row.percent / 100), 24);
    ctx.fillStyle = "#334155";
    ctx.font = "600 20px sans-serif";
    ctx.fillText(row.value, 1200, top + 42, 180);
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${String(event.title).replace(/[\\/:*?"<>|]+/g, " ").trim()}-result.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function StatsCard({ icon, label, value, bg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 22px", borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff" }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: bg }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 24, color: "#0f172a", fontWeight: 900 }}>{value}</div>
      </div>
    </div>
  );
}

function GaugeCard({ label, valueLabel, percent, color, helper }) {
  const safePercent = clamp(percent);
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", padding: 22, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>{label}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>{helper}</div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{valueLabel}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: 168,
            height: 168,
            borderRadius: "50%",
            background: `conic-gradient(${color} 0deg ${safePercent * 3.6}deg, #e5e7eb ${safePercent * 3.6}deg 360deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6)",
          }}
        >
          <div
            style={{
              width: 122,
              height: 122,
              borderRadius: "50%",
              background: "#fff",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f172a",
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{Math.round(safePercent)}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: "#64748b", fontWeight: 700 }}>%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({ label, selectedValue, averageValue, color, format }) {
  const maxValue = Math.max(selectedValue, averageValue, 1);
  const selectedWidth = `${(selectedValue / maxValue) * 100}%`;
  const averageWidth = `${(averageValue / maxValue) * 100}%`;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{label}</span>
        <span style={{ fontSize: 13, color: "#64748b" }}>선택 행사 / 전체 평균</span>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: "#334155", fontWeight: 800 }}>선택 행사</span>
            <span style={{ color: "#334155" }}>{format(selectedValue)}</span>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
            <div style={{ width: selectedWidth, height: "100%", borderRadius: 999, background: color }} />
          </div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: "#64748b", fontWeight: 800 }}>전체 평균</span>
            <span style={{ color: "#64748b" }}>{format(averageValue)}</span>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
            <div style={{ width: averageWidth, height: "100%", borderRadius: 999, background: "#94a3b8" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Closed() {
  const navigate = useNavigate();
  const topSectionRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [programMap, setProgramMap] = useState({});
  const [programLoadingId, setProgramLoadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await eventApi.getClosedAnalytics();
        const rows = Array.isArray(res?.data?.data) ? res.data.data.map(mapEvent) : [];
        if (!mounted) return;
        setEvents(rows);
        setSelectedId(rows[0]?.id ?? null);
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || "종료 행사 결과를 불러오지 못했습니다.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const years = useMemo(
    () => ["all", ...Array.from(new Set(events.map((event) => event.year).filter(Boolean))).sort((a, b) => Number(b) - Number(a))],
    [events],
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesKeyword =
        !keyword ||
        event.title.toLowerCase().includes(keyword) ||
        event.location.toLowerCase().includes(keyword);
      return matchesKeyword && (year === "all" || event.year === year);
    });
  }, [events, query, year]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null);
      return;
    }
    if (!filtered.some((event) => event.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((event) => event.id === selectedId) ?? filtered[0] ?? null;
  const totalParticipants = filtered.reduce((sum, event) => sum + event.participants, 0);
  const avgRate = filtered.length ? filtered.reduce((sum, event) => sum + event.participationRate, 0) / filtered.length : 0;
  const avgRating = filtered.length ? filtered.reduce((sum, event) => sum + event.rating, 0) / filtered.length : 0;
  const avgReviewCount = filtered.length ? filtered.reduce((sum, event) => sum + event.reviewCount, 0) / filtered.length : 0;

  const selectedParticipantPercent = selected?.capacity
    ? clamp((selected.participants / selected.capacity) * 100)
    : 0;

  useEffect(() => {
    if (!selected?.id || programMap[selected.id]) return;

    let mounted = true;
    const loadPrograms = async () => {
      setProgramLoadingId(selected.id);
      try {
        const rows = await programApi.getAllProgramsByEvent({
          eventId: selected.id,
          sort: "startAt,asc",
          pageSize: 100,
        });
        if (!mounted) return;
        setProgramMap((prev) => ({
          ...prev,
          [selected.id]: Array.isArray(rows) ? rows : [],
        }));
      } catch (err) {
        if (!mounted) return;
        console.error("[Closed] program load failed:", err);
        setProgramMap((prev) => ({
          ...prev,
          [selected.id]: [],
        }));
      } finally {
        if (mounted) {
          setProgramLoadingId((prev) => (prev === selected.id ? null : prev));
        }
      }
    };

    loadPrograms();
    return () => {
      mounted = false;
    };
  }, [programMap, selected?.id]);

  const selectedPrograms = useMemo(() => {
    return Array.isArray(programMap[selected?.id]) ? programMap[selected.id] : [];
  }, [programMap, selected]);

  const selectedProgramSummary = useMemo(() => {
    return selectedPrograms.reduce((acc, program) => {
      const meta = getProgramCategoryMeta(program?.category);
      acc.total += 1;
      acc[meta.label] = (acc[meta.label] || 0) + 1;
      return acc;
    }, { total: 0 });
  }, [selectedPrograms]);

  const handleSelectEvent = useCallback((eventId, scrollToTop = false) => {
    setSelectedId(eventId);
    if (scrollToTop) {
      requestAnimationFrame(() => {
        if (topSectionRef.current) {
          topSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <PageHeader
        title="종료 행사"
        subtitle="종료된 행사 결과를 행사별 그래프로 확인하세요"
        categories={SERVICE_CATEGORIES}
        currentPath="/event/closed"
        onNavigate={(path) => navigate(path)}
      />

      <main
        style={{
          width: "min(1400px, calc(100% - 32px))",
          margin: "0 auto",
          padding: "32px 0 72px",
        }}
      >
        {loading ? <div style={{ padding: "100px 24px", textAlign: "center", color: "#64748b" }}>종료 행사 결과를 불러오는 중입니다.</div> : null}
        {!loading && error ? <div style={{ padding: "100px 24px", textAlign: "center", color: "#dc2626" }}>{error}</div> : null}
        {!loading && !error ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 22 }}>
              <StatsCard icon={<Archive size={20} color="#6b7280" />} label="종료 행사 수" value={`${filtered.length}개`} bg="#f3f4f6" />
              <StatsCard icon={<Users size={20} color="#2563eb" />} label="총 참가자수" value={`${totalParticipants.toLocaleString()}명`} bg="#eff6ff" />
              <StatsCard icon={<Calendar size={20} color="#10b981" />} label="평균 참가율" value={`${Math.round(avgRate)}%`} bg="#ecfdf5" />
              <StatsCard icon={<Star size={20} color="#f59e0b" />} label={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Star size={14} color="#f59e0b" fill="#f59e0b" /> 평균 별점</span>} value={avgRating.toFixed(1)} bg="#fffbeb" />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
              <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="행사명 또는 장소 검색" style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 14px 0 38px", fontSize: 14, color: "#0f172a", background: "#fff" }} />
              </div>
              {years.map((value) => (
                <button key={value} type="button" onClick={() => setYear(value)} style={{ height: 42, padding: "0 14px", borderRadius: 999, border: year === value ? "1px solid #1d4ed8" : "1px solid #dbe2ea", background: year === value ? "#eff6ff" : "#fff", color: year === value ? "#1d4ed8" : "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {value === "all" ? "전체 연도" : `${value}년`}
                </button>
              ))}
              <button type="button" onClick={() => downloadResultImage(selected)} disabled={!selected} style={{ height: 42, padding: "0 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "#fff", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, cursor: !selected ? "not-allowed" : "pointer", opacity: !selected ? 0.6 : 1 }}>
                <Download size={14} /> 결과 이미지 다운로드
              </button>
            </div>

            {selected ? (
              <>
                <section ref={topSectionRef} style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.82fr) minmax(0, 1.18fr)", gap: 18, marginBottom: 18 }}>
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, overflow: "hidden", boxShadow: "0 18px 36px rgba(15,23,42,0.05)", minHeight: 420 }}>
                    {selected.image ? (
                      <img src={selected.image} alt={selected.title} style={{ width: "100%", height: "100%", minHeight: 420, objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ minHeight: 420, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#94a3b8", background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)" }}>
                        <ImageOff size={36} />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>행사 이미지가 없습니다.</span>
                      </div>
                    )}
                  </div>

                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, overflow: "hidden", boxShadow: "0 18px 36px rgba(15,23,42,0.05)" }}>
                    <div style={{ padding: "26px 28px", borderBottom: "1px solid #eef2f7", background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800 }}>
                        <Archive size={12} /> 선택된 종료 행사
                      </div>
                      <h2 style={{ margin: "14px 0 10px", fontSize: 34, lineHeight: 1.2, fontWeight: 900, color: "#0f172a" }}>{selected.title}</h2>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#64748b", fontSize: 13 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Calendar size={14} /> {selected.dateLabel}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MapPin size={14} /> {selected.location}</span>
                      </div>
                    </div>
                    <div style={{ padding: 28 }}>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: "#475569" }}>
                        {selected.description || "등록된 행사 설명이 없습니다."}
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginTop: 22 }}>
                        <StatsCard icon={<Users size={18} color="#2563eb" />} label="참가자수" value={`${selected.participants.toLocaleString()}명`} bg="#eff6ff" />
                        <StatsCard icon={<Calendar size={18} color="#10b981" />} label="참가율" value={`${selected.participationRate}%`} bg="#ecfdf5" />
                        <StatsCard icon={<Star size={18} color="#f59e0b" />} label="별점" value={selected.ratingText} bg="#fffbeb" />
                        <StatsCard icon={<MessageSquareText size={18} color="#7c3aed" />} label="후기 수" value={`${selected.reviewCount.toLocaleString()}건`} bg="#f5f3ff" />
                      </div>
                      <div style={{ marginTop: 24, paddingTop: 22, borderTop: "1px solid #eef2f7" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>이 행사에 포함된 프로그램</div>
                            <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>행사와 함께 운영된 프로그램을 카테고리별로 확인할 수 있습니다.</div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ padding: "6px 10px", borderRadius: 999, background: "#f8fafc", color: "#334155", fontSize: 12, fontWeight: 800 }}>
                              전체 {selectedProgramSummary.total || 0}개
                            </span>
                            {Object.entries(selectedProgramSummary)
                              .filter(([key]) => key !== "total")
                              .map(([key, value]) => (
                                <span key={key} style={{ padding: "6px 10px", borderRadius: 999, background: "#eef2ff", color: "#334155", fontSize: 12, fontWeight: 800 }}>
                                  {key} {value}개
                                </span>
                              ))}
                          </div>
                        </div>

                        {programLoadingId === selected.id ? (
                          <div style={{ padding: "28px 0 10px", fontSize: 13, color: "#94a3b8" }}>프로그램 목록을 불러오는 중입니다.</div>
                        ) : selectedPrograms.length === 0 ? (
                          <div style={{ padding: "28px 0 10px", fontSize: 13, color: "#94a3b8" }}>연결된 프로그램이 없습니다.</div>
                        ) : (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 18 }}>
                            {selectedPrograms.map((program, index) => {
                              const categoryMeta = getProgramCategoryMeta(program?.category);
                              return (
                                <div
                                  key={program?.programId || `${selected.id}-${index}`}
                                  style={{
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 18,
                                    padding: "16px 18px",
                                    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                                    display: "grid",
                                    gap: 10,
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                    <div style={{ display: "grid", gap: 8 }}>
                                      <span style={{ display: "inline-flex", width: "fit-content", padding: "5px 10px", borderRadius: 999, background: categoryMeta.bg, color: categoryMeta.color, fontSize: 12, fontWeight: 800 }}>
                                        {categoryMeta.label}
                                      </span>
                                      <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", lineHeight: 1.45 }}>
                                        {program?.programTitle || "프로그램"}
                                      </div>
                                    </div>
                                    <div style={{ minWidth: 34, height: 34, borderRadius: 999, background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>
                                      {String(index + 1).padStart(2, "0")}
                                    </div>
                                  </div>
                                  <div style={{ display: "grid", gap: 6, fontSize: 12, color: "#64748b" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                      <Calendar size={13} />
                                      {fmtProgramSchedule(program?.startAt, program?.endAt)}
                                    </span>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                      <MapPin size={13} />
                                      {program?.location || program?.boothName || "프로그램 공간"}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      lineHeight: 1.7,
                                      color: "#475569",
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {program?.description || "상세 설명이 없습니다."}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginBottom: 18 }}>
                  <GaugeCard label="참가자수 달성률" valueLabel={`${selected.participants.toLocaleString()} / ${selected.capacity.toLocaleString()}명`} percent={selectedParticipantPercent} color={METRIC_COLORS.participants} helper="행사 정원 대비 참가자수" />
                  <GaugeCard label="참가율" valueLabel={`${selected.participationRate}%`} percent={selected.participationRate} color={METRIC_COLORS.rate} helper="행사 운영 결과 참여 비율" />
                  <GaugeCard label="별점" valueLabel={`${selected.ratingText} / 5.0`} percent={(selected.rating / 5) * 100} color={METRIC_COLORS.rating} helper="후기 기준 평균 만족도" />
                </section>

                <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 24, marginBottom: 18, boxShadow: "0 18px 36px rgba(15,23,42,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{selected.title} 결과 비교</div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>선택한 행사와 전체 종료 행사 평균을 비교합니다.</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    <ComparisonRow label="참가율" selectedValue={selected.participationRate} averageValue={avgRate} color={METRIC_COLORS.rate} format={(value) => `${value.toFixed(1)}%`} />
                    <ComparisonRow label="별점" selectedValue={selected.rating} averageValue={avgRating} color={METRIC_COLORS.rating} format={(value) => `${value.toFixed(1)} / 5.0`} />
                    <ComparisonRow label="참가자수" selectedValue={selected.participants} averageValue={filtered.length ? totalParticipants / filtered.length : 0} color={METRIC_COLORS.participants} format={(value) => `${Math.round(value).toLocaleString()}명`} />
                    <ComparisonRow label="후기 수" selectedValue={selected.reviewCount} averageValue={avgReviewCount} color="#7c3aed" format={(value) => `${Math.round(value).toLocaleString()}건`} />
                  </div>
                </section>
              </>
            ) : null}

            <section style={{ borderRadius: 24, border: "1px solid #e2e8f0", background: "#fff", overflow: "hidden", boxShadow: "0 18px 36px rgba(15,23,42,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>종료 행사 목록</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length}개 행사</div>
              </div>
              {filtered.length === 0 ? (
                <div style={{ padding: "80px 24px", textAlign: "center", color: "#94a3b8" }}>조건에 맞는 종료 행사가 없습니다.</div>
              ) : (
                <div style={{ display: "grid", gap: 0 }}>
                  {filtered.map((event) => {
                    const active = event.id === selected?.id;
                    return (
                      <div key={event.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) 140px 110px 110px 130px", alignItems: "center", gap: 12, padding: "16px 24px", borderTop: "1px solid #f1f5f9", background: active ? "#eff6ff" : "#fff" }}>
                        <button type="button" onClick={() => handleSelectEvent(event.id, true)} style={{ border: "none", background: "none", padding: 0, textAlign: "left", cursor: "pointer", display: "grid", gap: 6 }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>{event.title}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{event.dateLabel} · {event.location}</div>
                        </button>
                        <div style={{ fontSize: 13, color: "#334155", fontWeight: 700 }}>{event.participants.toLocaleString()}명</div>
                        <div style={{ fontSize: 13, color: "#334155", fontWeight: 700 }}>{event.participationRate}%</div>
                        <div style={{ fontSize: 13, color: "#334155", fontWeight: 700 }}>{event.ratingText}</div>
                        <button type="button" onClick={() => handleSelectEvent(event.id, true)} style={{ justifySelf: "end", height: 38, padding: "0 14px", borderRadius: 10, border: active ? "1px solid #1d4ed8" : "1px solid #dbe2ea", background: active ? "#dbeafe" : "#fff", color: active ? "#1d4ed8" : "#334155", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                          결과 보기
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
