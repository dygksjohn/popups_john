import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ImageOff,
  MapPin,
  MessageSquareText,
  Search,
  Star,
  Users,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import PageLoading from "../components/PageLoading";
import EmptyState from "../components/EmptyState";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import { resolveImageUrl } from "../../../shared/utils/publicAssetUrl";
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
    startAt: raw?.startAt || null,
    endAt: raw?.endAt || null,
    dateLabel: fmtRange(raw?.startAt, raw?.endAt),
    year: extractEventYear(raw),
    month: raw?.startAt ? String(new Date(raw.startAt).getMonth() + 1) : null,
    location: raw?.location || "장소 미정",
    image: resolveImageUrl(raw?.imageUrl),
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

  const W = 1200;
  const H = 720;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  /* ── helpers ── */
  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };
  const drawDonut = (cx, cy, r, strokeW, percent, trackColor, fillColor) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = strokeW;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * percent) / 100);
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = strokeW;
    ctx.lineCap = "round";
    ctx.stroke();
  };
  const drawStar = (cx, cy, size, fillRatio, emptyColor, fillColor) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 2) * -1 + (Math.PI / 5) * i;
      const r = i % 2 === 0 ? size : size * 0.4;
      pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    }
    const starPath = () => { ctx.beginPath(); pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)); ctx.closePath(); };
    starPath(); ctx.fillStyle = emptyColor; ctx.fill();
    if (fillRatio > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - size, cy - size, size * 2 * fillRatio, size * 2);
      ctx.clip();
      starPath(); ctx.fillStyle = fillColor; ctx.fill();
      ctx.restore();
    }
  };

  /* ── background ── */
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, W, H);

  /* ── header bar ── */
  const hdrH = 130;
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(1, "#1e40af");
  ctx.fillStyle = grad;
  roundRect(0, 0, W, hdrH, 0);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, hdrH - 1, W, 1);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 14px sans-serif";
  ctx.fillText("종료 행사 결과 리포트", 48, 42);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 32px sans-serif";
  ctx.fillText(event.title, 48, 82, W - 96);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "500 15px sans-serif";
  ctx.fillText(`${event.dateLabel}  ·  ${event.location}`, 48, 112, W - 96);

  /* ── 4 metric cards ── */
  const metrics = [
    { label: "참가자", value: `${event.participants.toLocaleString()}명`, sub: `/ ${event.capacity.toLocaleString()}`, color: "#2563eb", bg: "#eff6ff" },
    { label: "참가율", value: `${event.participationRate}%`, sub: "", color: "#10b981", bg: "#ecfdf5" },
    { label: "별점", value: `${event.ratingText}`, sub: "/ 5.0", color: "#f59e0b", bg: "#fffbeb" },
    { label: "후기", value: `${event.reviewCount.toLocaleString()}건`, sub: "", color: "#7c3aed", bg: "#f5f3ff" },
  ];
  const cardY = hdrH + 28;
  const cardW = (W - 48 * 2 - 16 * 3) / 4;
  const cardH = 100;

  metrics.forEach((m, i) => {
    const x = 48 + i * (cardW + 16);
    ctx.fillStyle = "#ffffff";
    roundRect(x, cardY, cardW, cardH, 16);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    roundRect(x, cardY, cardW, cardH, 16);
    ctx.stroke();

    /* color dot */
    ctx.beginPath();
    ctx.arc(x + 20, cardY + 28, 5, 0, Math.PI * 2);
    ctx.fillStyle = m.color;
    ctx.fill();

    ctx.fillStyle = "#64748b";
    ctx.font = "700 13px sans-serif";
    ctx.fillText(m.label, x + 32, cardY + 33);

    ctx.fillStyle = m.color;
    ctx.font = "900 30px sans-serif";
    ctx.fillText(m.value, x + 20, cardY + 76);

    if (m.sub) {
      const vw = ctx.measureText(m.value).width;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 15px sans-serif";
      ctx.fillText(m.sub, x + 24 + vw, cardY + 76);
    }
  });

  /* ── bottom section: 3 visual charts ── */
  const btmY = cardY + cardH + 24;
  const btmH = H - btmY - 28;
  const colW = (W - 48 * 2 - 16 * 2) / 3;

  /* --- 참가자 달성률 donut --- */
  const d1x = 48;
  ctx.fillStyle = "#ffffff";
  roundRect(d1x, btmY, colW, btmH, 16);
  ctx.fill();
  ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1;
  roundRect(d1x, btmY, colW, btmH, 16); ctx.stroke();

  ctx.fillStyle = "#334155"; ctx.font = "800 14px sans-serif";
  ctx.fillText("참가자 달성률", d1x + 20, btmY + 30);

  const pct1 = event.capacity > 0 ? clamp((event.participants / event.capacity) * 100) : 0;
  const donutCx1 = d1x + colW / 2;
  const donutCy1 = btmY + btmH / 2 + 8;
  const donutR1 = Math.min(colW, btmH) * 0.28;
  drawDonut(donutCx1, donutCy1, donutR1, 14, pct1, "#e8f4fd", "#2563eb");

  ctx.fillStyle = "#2563eb"; ctx.font = "900 32px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(`${Math.round(pct1)}%`, donutCx1, donutCy1 + 12);
  ctx.textAlign = "left";

  ctx.fillStyle = "#64748b"; ctx.font = "600 13px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(`${event.participants.toLocaleString()} / ${event.capacity.toLocaleString()}명`, donutCx1, btmY + btmH - 20);
  ctx.textAlign = "left";

  /* --- 별점 stars --- */
  const d2x = 48 + colW + 16;
  ctx.fillStyle = "#ffffff";
  roundRect(d2x, btmY, colW, btmH, 16); ctx.fill();
  ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1;
  roundRect(d2x, btmY, colW, btmH, 16); ctx.stroke();

  ctx.fillStyle = "#334155"; ctx.font = "800 14px sans-serif";
  ctx.fillText("별점", d2x + 20, btmY + 30);

  const starCy = btmY + btmH / 2;
  const starSize = 20;
  const starGap = 48;
  const starsStartX = d2x + colW / 2 - (4 * starGap) / 2;
  for (let i = 0; i < 5; i++) {
    const fill = Math.min(1, Math.max(0, event.rating - i));
    drawStar(starsStartX + i * starGap, starCy - 8, starSize, fill, "#e5e7eb", "#f59e0b");
  }

  ctx.fillStyle = "#f59e0b"; ctx.font = "900 32px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(event.ratingText, d2x + colW / 2, starCy + 48);
  ctx.fillStyle = "#94a3b8"; ctx.font = "600 16px sans-serif";
  ctx.fillText("/ 5.0", d2x + colW / 2 + ctx.measureText(event.ratingText).width / 2 + 38, starCy + 48);
  ctx.textAlign = "left";

  /* --- 참가율 gauge --- */
  const d3x = 48 + (colW + 16) * 2;
  ctx.fillStyle = "#ffffff";
  roundRect(d3x, btmY, colW, btmH, 16); ctx.fill();
  ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1;
  roundRect(d3x, btmY, colW, btmH, 16); ctx.stroke();

  ctx.fillStyle = "#334155"; ctx.font = "800 14px sans-serif";
  ctx.fillText("참가율", d3x + 20, btmY + 30);

  const gaugeCx = d3x + colW / 2;
  const gaugeCy = btmY + btmH / 2 + 20;
  const gaugeR = Math.min(colW, btmH) * 0.3;
  const gaugeAngle = (clamp(event.participationRate) / 100) * Math.PI;

  ctx.beginPath();
  ctx.arc(gaugeCx, gaugeCy, gaugeR, Math.PI, 0);
  ctx.strokeStyle = "#f1f5f9"; ctx.lineWidth = 14; ctx.lineCap = "round"; ctx.stroke();

  ctx.beginPath();
  ctx.arc(gaugeCx, gaugeCy, gaugeR, Math.PI, Math.PI + gaugeAngle);
  ctx.strokeStyle = "#10b981"; ctx.lineWidth = 14; ctx.lineCap = "round"; ctx.stroke();

  ctx.fillStyle = "#10b981"; ctx.font = "900 32px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(`${event.participationRate}%`, gaugeCx, gaugeCy + 4);

  ctx.fillStyle = "#94a3b8"; ctx.font = "600 12px sans-serif";
  ctx.textAlign = "left"; ctx.fillText("0%", gaugeCx - gaugeR - 4, gaugeCy + 22);
  ctx.textAlign = "right"; ctx.fillText("100%", gaugeCx + gaugeR + 4, gaugeCy + 22);
  ctx.textAlign = "left";

  /* ── watermark ── */
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "600 11px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("POPUPS", W - 28, H - 14);
  ctx.textAlign = "left";

  /* ── download ── */
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

/* ── Animated value hook (resets to 0 on change) ── */
function useAnimatedValue(target, duration = 1800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = prevTarget.current !== target ? 0 : value;
    prevTarget.current = target;
    if (target === 0) { setValue(0); return; }
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return value;
}

/* ── SVG Donut Chart (rounded, animated) ── */
function DonutChart({ percent, color, label, valueLabel, helper }) {
  const animatedPercent = useAnimatedValue(clamp(percent));
  const size = 150;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", padding: 22, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>{label}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>{helper}</div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{valueLabel}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>
            {Math.round(animatedPercent)}%
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Infographic Cards ── */

/* 참가율: 반원 게이지 (오렌지) */
function RateGaugeCard({ rate, avgRate }) {
  const animatedRate = useAnimatedValue(clamp(rate));
  const angle = (animatedRate / 100) * 180;
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", padding: 24, display: "flex", flexDirection: "column", gap: 0, justifyContent: "space-between", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>참가율</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>평균 {avgRate.toFixed(1)}%</div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 180, height: 115 }}>
          <svg width={180} height={100} viewBox="0 0 180 100">
            <path d="M 10 95 A 80 80 0 0 1 170 95" fill="none" stroke="#f1f5f9" strokeWidth={14} strokeLinecap="round" />
            <path d="M 10 95 A 80 80 0 0 1 170 95" fill="none" stroke="#f97316" strokeWidth={14} strokeLinecap="round"
              strokeDasharray={`${(angle / 180) * 251.2} 251.2`}
            />
          </svg>
          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#f97316", lineHeight: 1 }}>{Math.round(animatedRate)}%</div>
          </div>
          <span style={{ position: "absolute", bottom: 0, left: 4, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>0%</span>
          <span style={{ position: "absolute", bottom: 0, right: 4, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>100%</span>
        </div>
      </div>
    </div>
  );
}

/* 별점: 5개 별 채우기 */
function StarRatingCard({ rating, avgRating }) {
  const animatedRating = useAnimatedValue(rating);
  const fullStars = Math.floor(animatedRating);
  const partialFill = animatedRating - fullStars;

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>별점</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>평균 {avgRating.toFixed(1)}</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const fill = i < fullStars ? 1 : i === fullStars ? partialFill : 0;
            return (
              <div key={i} style={{ position: "relative", width: 36, height: 36 }}>
                <svg width={36} height={36} viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#e5e7eb" />
                </svg>
                <div style={{ position: "absolute", inset: 0, overflow: "hidden", width: `${fill * 100}%` }}>
                  <svg width={36} height={36} viewBox="0 0 24 24" style={{ minWidth: 36 }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#f59e0b" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#f59e0b", lineHeight: 1 }}>
          {animatedRating.toFixed(1)}
          <span style={{ fontSize: 16, color: "#64748b", fontWeight: 600 }}> / 5.0</span>
        </div>
      </div>
    </div>
  );
}

/* 참가자: 도넛 링 안에 사람 아이콘 */
function ParticipantsCard({ participants, capacity, avgParticipants }) {
  const animatedCount = useAnimatedValue(participants);
  const fillRatio = capacity > 0 ? clamp((participants / capacity) * 100) : 0;
  const animatedRatio = useAnimatedValue(fillRatio);
  const pc = "#0ea5e9";
  const size = 130;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedRatio / 100) * circumference;

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>참가자</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>평균 {Math.round(avgParticipants).toLocaleString()}명</div>
      </div>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e8f4fd" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={pc} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Users size={32} color={pc} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: pc, lineHeight: 1 }}>{Math.round(animatedCount).toLocaleString()}</span>
        <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>/ {capacity.toLocaleString()}명</span>
      </div>
      <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
        달성률 <span style={{ color: pc, fontSize: 16, fontWeight: 900 }}>{Math.round(animatedRatio)}%</span>
      </div>
    </div>
  );
}

/* 후기: 말풍선 5개 채우기 인포그래픽 */
function ReviewsCard({ reviewCount, avgReviewCount }) {
  const animatedCount = useAnimatedValue(reviewCount);
  const maxVal = Math.max(reviewCount, avgReviewCount, 1);
  const ratio = clamp((reviewCount / maxVal) * 100);
  const animatedRatio = useAnimatedValue(ratio);
  const totalBubbles = 5;
  const filledBubbles = (animatedRatio / 100) * totalBubbles;
  const rc = "#7c3aed";
  const bubbleSizes = [28, 34, 40, 34, 28];
  const bubbleOffsets = [12, 2, -6, 2, 12];

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>후기</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>평균 {Math.round(avgReviewCount).toLocaleString()}건</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, padding: "0 8px" }}>
        {bubbleSizes.map((size, i) => {
          const fill = i < Math.floor(filledBubbles) ? 1 : i < filledBubbles ? filledBubbles - Math.floor(filledBubbles) : 0;
          return (
            <div key={i} style={{ position: "relative", width: size, height: size, marginBottom: bubbleOffsets[i] }}>
              <svg width={size} height={size} viewBox="0 0 40 40">
                <path d="M4 4h32a4 4 0 014 4v20a4 4 0 01-4 4H18l-8 8v-8H4a4 4 0 01-4-4V8a4 4 0 014-4z" fill="#f1f0f9" />
              </svg>
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: fill }}>
                <svg width={size} height={size} viewBox="0 0 40 40">
                  <path d="M4 4h32a4 4 0 014 4v20a4 4 0 01-4 4H18l-8 8v-8H4a4 4 0 01-4-4V8a4 4 0 014-4z" fill={rc} />
                </svg>
              </div>
              {fill > 0.5 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: size * 0.15 }}>
                  <svg width={size * 0.38} height={size * 0.38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 36, fontWeight: 900, color: rc, lineHeight: 1 }}>
        {Math.round(animatedCount).toLocaleString()}
        <span style={{ fontSize: 16, color: "#64748b", fontWeight: 600 }}>건</span>
      </div>
      <div style={{ textAlign: "center", fontSize: 12, color: "#64748b" }}>
        평균 대비 <span style={{ fontWeight: 800, color: rc }}>{Math.round(animatedRatio)}%</span>
      </div>
      </div>
    </div>
  );
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

const MONTH_LABELS = ["전체","1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function MonthDropdown({ month, setMonth }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const label = month === "all" ? "" : MONTH_LABELS[Number(month)];
  const hasValue = month !== "all";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", height: 52, padding: "0 16px",
          borderRadius: 14,
          border: open ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
          background: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
          transition: "border-color 0.25s, box-shadow 0.25s",
          boxShadow: open ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
          position: "relative",
        }}
      >
        <Calendar size={16} color={open ? "#2563eb" : "#94a3b8"} style={{ transition: "color 0.25s" }} />
        <span style={{
          position: "absolute", left: 42, top: open || hasValue ? 6 : "50%",
          transform: open || hasValue ? "none" : "translateY(-50%)",
          fontSize: open || hasValue ? 10 : 13,
          color: open ? "#2563eb" : "#94a3b8",
          fontWeight: 600, transition: "all 0.2s", pointerEvents: "none",
        }}>월 선택</span>
        <span style={{
          flex: 1, textAlign: "left",
          fontSize: 15, fontWeight: 800, color: "#0f172a",
          marginTop: hasValue ? 8 : 0,
          opacity: hasValue ? 1 : 0, transition: "opacity 0.2s",
        }}>{label}</span>
        <ChevronDown size={16} color={open ? "#2563eb" : "#94a3b8"}
          style={{ transition: "transform 0.25s, color 0.25s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0",
          boxShadow: "0 12px 32px rgba(15,23,42,0.12)",
          zIndex: 50, padding: "6px",
          maxHeight: 260, overflowY: "auto",
        }}>
          {MONTH_LABELS.map((ml, idx) => {
            const val = idx === 0 ? "all" : String(idx);
            return (
              <button key={val} type="button"
                onClick={() => { setMonth(val); setOpen(false); }}
                style={{
                  width: "100%", padding: "10px 14px",
                  borderRadius: 10, border: "none",
                  background: month === val ? "#eff6ff" : "transparent",
                  color: month === val ? "#2563eb" : "#334155",
                  fontSize: 14, fontWeight: month === val ? 800 : 600,
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.15s",
                }}
              >{ml}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Closed() {
  const navigate = useNavigate();
  const topSectionRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [programMap, setProgramMap] = useState({});
  const [programLoadingId, setProgramLoadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [searchFocused, setSearchFocused] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const yearDropRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (yearDropRef.current && !yearDropRef.current.contains(e.target)) {
        setYearOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      const matchesYear = year === "all" || event.year === year;
      const matchesMonth = month === "all" || event.month === month;
      return matchesKeyword && matchesYear && matchesMonth;
    });
  }, [events, query, year, month]);

  useEffect(() => {
    setVisibleCount(5);
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

  const handleDownload = useCallback(() => {
    if (!selected || downloading) return;
    setDownloading(true);
    setTimeout(() => {
      downloadResultImage(selected);
      setTimeout(() => setDownloading(false), 600);
    }, 400);
  }, [selected, downloading]);

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
          width: "min(1400px, calc(100% - 40px))",
          margin: "0 auto",
          padding: "32px 0 72px",
        }}
      >
        {loading ? <PageLoading /> : null}
        {!loading && error ? <EmptyState type="error" message="종료 행사를 불러오지 못했습니다" description={error} /> : null}
        {!loading && !error ? (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "stretch", marginBottom: 18 }}>
              {/* 연도 선택 드롭다운 */}
              <div ref={yearDropRef} style={{ position: "relative", minWidth: 180 }}>
                <button
                  type="button"
                  onClick={() => setYearOpen((v) => !v)}
                  style={{
                    width: "100%", height: 52, padding: "0 16px",
                    borderRadius: 14,
                    border: yearOpen ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                    background: "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "border-color 0.25s, box-shadow 0.25s",
                    boxShadow: yearOpen ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
                    position: "relative",
                  }}
                >
                  <Calendar size={16} color={yearOpen ? "#2563eb" : "#94a3b8"} style={{ transition: "color 0.25s" }} />
                  <span style={{
                    position: "absolute", left: 42, top: yearOpen || year !== "all" ? 6 : "50%",
                    transform: yearOpen || year !== "all" ? "none" : "translateY(-50%)",
                    fontSize: yearOpen || year !== "all" ? 10 : 13,
                    color: yearOpen ? "#2563eb" : "#94a3b8",
                    fontWeight: 600, transition: "all 0.2s",
                    pointerEvents: "none",
                  }}>연도 선택</span>
                  <span style={{
                    flex: 1, textAlign: "left",
                    fontSize: 15, fontWeight: 800, color: "#0f172a",
                    marginTop: year !== "all" ? 8 : 0,
                    opacity: year !== "all" ? 1 : 0,
                    transition: "opacity 0.2s",
                  }}>
                    {year === "all" ? "" : `${year}년`}
                  </span>
                  <ChevronDown
                    size={16} color={yearOpen ? "#2563eb" : "#94a3b8"}
                    style={{
                      transition: "transform 0.25s, color 0.25s",
                      transform: yearOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                {yearOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                    background: "#fff", borderRadius: 14,
                    border: "1.5px solid #e2e8f0",
                    boxShadow: "0 12px 32px rgba(15,23,42,0.12)",
                    zIndex: 50, padding: "6px",
                    maxHeight: 260, overflowY: "auto",
                  }}>
                    {years.map((value) => (
                      <button
                        key={value} type="button"
                        onClick={() => { setYear(value); setMonth("all"); setYearOpen(false); }}
                        style={{
                          width: "100%", padding: "10px 14px",
                          borderRadius: 10, border: "none",
                          background: year === value ? "#eff6ff" : "transparent",
                          color: year === value ? "#2563eb" : "#334155",
                          fontSize: 14, fontWeight: year === value ? 800 : 600,
                          cursor: "pointer", textAlign: "left",
                          transition: "background 0.15s",
                        }}
                      >
                        {value === "all" ? "전체 연도" : `${value}년`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 월 선택 드롭다운 - 연도 선택 시에만 */}
              {year !== "all" && (
                <div style={{ position: "relative", minWidth: 140 }}>
                  <MonthDropdown month={month} setMonth={setMonth} />
                </div>
              )}

              {/* 검색창 */}
              <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                <Search
                  size={16}
                  color={searchFocused ? "#2563eb" : "#94a3b8"}
                  style={{
                    position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                    transition: "color 0.25s", zIndex: 1,
                  }}
                />
                <span style={{
                  position: "absolute", left: 42,
                  top: searchFocused || query ? 6 : "50%",
                  transform: searchFocused || query ? "none" : "translateY(-50%)",
                  fontSize: searchFocused || query ? 10 : 13,
                  color: searchFocused ? "#2563eb" : "#94a3b8",
                  fontWeight: 600,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  pointerEvents: "none", zIndex: 1,
                  background: "#fff", padding: "0 4px",
                }}>행사 검색</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={{
                    width: "100%", height: 52,
                    borderRadius: 14,
                    border: searchFocused ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                    padding: query || searchFocused ? "14px 16px 0 42px" : "0 16px 0 42px",
                    fontSize: 15, fontWeight: 700, color: "#0f172a",
                    background: "#fff", outline: "none",
                    transition: "border-color 0.25s, box-shadow 0.25s, padding 0.2s",
                    boxShadow: searchFocused ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {selected ? (
              <>
                <section ref={topSectionRef} style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.82fr) minmax(0, 1.18fr)", gap: 18, marginBottom: 18 }}>
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, overflow: "hidden", boxShadow: "0 18px 36px rgba(15,23,42,0.05)", minHeight: 420 }}>
                    {selected.image ? (
                      <img src={resolveImageUrl(selected.image)} alt={selected.title} style={{ width: "100%", height: "100%", minHeight: 420, objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ minHeight: 420, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#94a3b8", background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)" }}>
                        <ImageOff size={36} />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>행사 이미지가 없습니다.</span>
                      </div>
                    )}
                  </div>

                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, overflow: "hidden", boxShadow: "0 18px 36px rgba(15,23,42,0.05)" }}>
                    <div style={{ padding: "26px 28px", borderBottom: "1px solid #eef2f7", background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800 }}>
                          <Archive size={12} /> 선택된 종료 행사
                        </div>
                        <button
                          type="button"
                          onClick={handleDownload}
                          disabled={downloading}
                          style={{
                            height: 38, padding: "0 16px", borderRadius: 12,
                            border: "none",
                            background: downloading ? "#94a3b8" : "linear-gradient(135deg, #0f172a, #334155)",
                            color: "#fff",
                            display: "inline-flex", alignItems: "center", gap: 8,
                            fontSize: 13, fontWeight: 700, cursor: downloading ? "default" : "pointer",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            transform: downloading ? "scale(0.95)" : "scale(1)",
                            opacity: downloading ? 0.8 : 1,
                            boxShadow: downloading ? "none" : "0 4px 12px rgba(15,23,42,0.15)",
                          }}
                        >
                          <Download
                            size={14}
                            style={{
                              transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                              transform: downloading ? "translateY(3px)" : "translateY(0)",
                            }}
                          />
                          {downloading ? "다운로드 중..." : "결과 이미지"}
                        </button>
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

                <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginBottom: 16 }}>
                  <DonutChart label="참가자수 달성률" valueLabel={`${selected.participants.toLocaleString()} / ${selected.capacity.toLocaleString()}명`} percent={selectedParticipantPercent} color={METRIC_COLORS.participants} helper="행사 정원 대비 참가자수" />
                  <RateGaugeCard rate={selected.participationRate} avgRate={avgRate} />
                  <ParticipantsCard participants={selected.participants} capacity={selected.capacity} avgParticipants={filtered.length ? totalParticipants / filtered.length : 0} />
                </section>

                <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, marginBottom: 18 }}>
                  <StarRatingCard rating={selected.rating} avgRating={avgRating} />
                  <ReviewsCard reviewCount={selected.reviewCount} avgReviewCount={avgReviewCount} />
                </section>
              </>
            ) : null}

            <section style={{ borderRadius: 24, border: "1px solid #e2e8f0", background: "#fff", overflow: "hidden", boxShadow: "0 18px 36px rgba(15,23,42,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>종료 행사 목록</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length}개 행사</div>
              </div>
              {filtered.length === 0 ? (
                <EmptyState message={query ? `"${query}" 검색 결과가 없습니다` : "조건에 맞는 종료 행사가 없습니다"} description={query ? "다른 검색어로 다시 시도해 보세요" : "연도 또는 월 필터를 변경해 보세요"} />
              ) : (
                <>
                  <div style={{ display: "grid", gap: 0 }}>
                    {filtered.slice(0, visibleCount).map((event) => {
                      const active = event.id === selected?.id;
                      return (
                        <div key={event.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 170px 110px 140px 110px", alignItems: "center", gap: 16, padding: "16px 24px", borderTop: "1px solid #f1f5f9", background: active ? "#eff6ff" : "#fff" }}>
                          <button type="button" onClick={() => handleSelectEvent(event.id, true)} style={{ border: "none", background: "none", padding: 0, textAlign: "left", cursor: "pointer", display: "grid", gap: 6 }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>{event.title}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{event.dateLabel} · {event.location}</div>
                          </button>
                          <div style={{ display: "grid", gap: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <Users size={13} color="#2563eb" />
                              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{event.participants.toLocaleString()}명</span>
                              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>/ {event.capacity.toLocaleString()}</span>
                            </div>
                            <div style={{ width: "100%", height: 4, borderRadius: 2, background: "#e5e7eb", overflow: "hidden" }}>
                              <div style={{ height: "100%", borderRadius: 2, background: "#2563eb", width: `${event.capacity > 0 ? clamp((event.participants / event.capacity) * 100) : 0}%`, transition: "width 0.3s" }} />
                            </div>
                          </div>
                          {(() => {
                            const r = event.participationRate;
                            const rateColor = r >= 70 ? "#10b981" : r >= 40 ? "#f59e0b" : "#ef4444";
                            const ratePercent = clamp(r);
                            const miniR = 10;
                            const miniC = 2 * Math.PI * miniR;
                            const miniOff = miniC - (ratePercent / 100) * miniC;
                            return (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <svg width={26} height={26} style={{ transform: "rotate(-90deg)" }}>
                                  <circle cx={13} cy={13} r={miniR} fill="none" stroke="#e5e7eb" strokeWidth={3} />
                                  <circle cx={13} cy={13} r={miniR} fill="none" stroke={rateColor} strokeWidth={3} strokeLinecap="round" strokeDasharray={miniC} strokeDashoffset={miniOff} />
                                </svg>
                                <span style={{ fontSize: 13, fontWeight: 800, color: rateColor }}>{r}%</span>
                              </div>
                            );
                          })()}
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {[0, 1, 2, 3, 4].map((i) => {
                              const fill = Math.min(1, Math.max(0, event.rating - i));
                              return (
                                <div key={i} style={{ position: "relative", width: 14, height: 14 }}>
                                  <svg width={14} height={14} viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#e5e7eb" />
                                  </svg>
                                  <div style={{ position: "absolute", inset: 0, overflow: "hidden", width: `${fill * 100}%` }}>
                                    <svg width={14} height={14} viewBox="0 0 24 24" style={{ minWidth: 14 }}>
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#f59e0b" />
                                    </svg>
                                  </div>
                                </div>
                              );
                            })}
                            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginLeft: 2 }}>{event.ratingText}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectEvent(event.id, true)}
                            style={{
                              justifySelf: "end", height: 36, padding: "0 14px", borderRadius: 999,
                              border: "none",
                              background: active ? "#2563eb" : "#f1f5f9",
                              color: active ? "#fff" : "#475569",
                              fontSize: 12, fontWeight: 800, cursor: "pointer",
                              display: "inline-flex", alignItems: "center", gap: 5,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "#e0e7ff"; e.currentTarget.style.color = "#2563eb"; } }}
                            onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; } }}
                          >
                            {active ? <ChevronRight size={13} /> : null}
                            {active ? "선택됨" : "결과 보기"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {visibleCount < filtered.length && (
                    <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9" }}>
                      <button
                        type="button"
                        onClick={() => setVisibleCount((v) => v + 5)}
                        style={{
                          width: "100%", height: 44, borderRadius: 12,
                          border: "1.5px solid #e2e8f0", background: "#f8fafc",
                          color: "#475569", fontSize: 14, fontWeight: 700,
                          cursor: "pointer", display: "flex", alignItems: "center",
                          justifyContent: "center", gap: 8,
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                      >
                        <ChevronDown size={16} />
                        더보기 ({Math.min(5, filtered.length - visibleCount)}개)
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
