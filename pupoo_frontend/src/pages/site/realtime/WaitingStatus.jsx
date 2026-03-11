import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import RealtimeEventSelector from "./RealtimeEventSelector";

import {
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  ListOrdered,
  Timer,
  RefreshCw,
} from "lucide-react";
import {
  useCountUp,
  useRefresh,
  useStaggerIn,
  useAutoRefresh,
  useBarAnimate,
  SHARED_ANIM_STYLES,
} from "./useRealtimeAnimations";
import { eventApi } from "../../../app/http/eventApi";
import { boothApi } from "../../../app/http/boothApi";
import { programApi } from "../../../app/http/programApi";
import { aiApi } from "../../../app/http/aiApi";
import {
  formatKoreanTime,
  normalizePrediction,
  normalizeRecommendation,
} from "./aiCongestionViewModel";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .wt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .wt-root *, .wt-root *::before, .wt-root *::after { box-sizing: border-box; font-family: inherit; }
  .wt-container { max-width: 1400px; margin: 0 auto; padding: 32px 25px 64px; }
  .wt-container.selector-mode { padding-top: 104px; }

  .rt-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 20px;
  }
  .rt-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
    animation: wt-pulse 1.4s ease-in-out infinite;
  }
  @keyframes wt-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .wt-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .wt-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px 22px;
    display: flex; align-items: center; gap: 14px;
  }
  .wt-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .wt-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .wt-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  .wt-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .wt-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .wt-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; margin: 0; }
  .wt-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #fffbeb; display: flex; align-items: center; justify-content: center; }
  .wt-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  .wt-main-grid { display: grid; grid-template-columns: 380px 1fr; gap: 14px; }

  .wt-my-ticket {
    background: linear-gradient(135deg, #1a4fd6 0%, #3b82f6 100%);
    border-radius: 13px; padding: 28px 24px; color: #fff; margin-bottom: 14px;
    position: relative; overflow: hidden;
  }
  .wt-my-ticket::before {
    content: ''; position: absolute; top: -30px; right: -30px;
    width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%;
  }
  .wt-my-ticket::after {
    content: ''; position: absolute; bottom: -20px; left: 60px;
    width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%;
  }
  .wt-ticket-label { font-size: 12px; font-weight: 500; opacity: 0.75; margin-bottom: 4px; }
  .wt-ticket-num {
    font-size: 52px; font-weight: 900; line-height: 1; letter-spacing: -2px;
    margin-bottom: 12px;
  }
  .wt-ticket-info { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .wt-ticket-row { display: flex; align-items: center; gap: 8px; font-size: 13px; opacity: 0.85; }
  .wt-ticket-divider { height: 1px; background: rgba(255,255,255,0.2); margin: 14px 0; }
  .wt-ticket-status { display: flex; align-items: center; gap: 8px; }
  .wt-ticket-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; animation: wt-pulse 1.4s ease-in-out infinite; }
  .wt-ticket-status-text { font-size: 13px; font-weight: 600; }

  .wt-ahead {
    background: rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 16px;
    display: flex; align-items: center; justify-content: space-between; margin-top: 14px;
  }
  .wt-ahead-label { font-size: 12px; opacity: 0.8; }
  .wt-ahead-val { font-size: 18px; font-weight: 800; }

  .wt-queue-list { display: flex; flex-direction: column; gap: 8px; }
  .wt-queue-item {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px; border: 1px solid #e9ecef; border-radius: 10px;
    background: #fff; transition: all 0.15s;
  }
  .wt-queue-item.calling { border-color: #1a4fd6; background: #f5f8ff; box-shadow: 0 0 0 3px rgba(26,79,214,0.08); }
  .wt-queue-item.done { opacity: 0.7; }
  .wt-queue-num {
    width: 36px; height: 36px; border-radius: 9px; background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800; color: #6b7280; flex-shrink: 0;
  }
  .wt-queue-num.calling { background: #1a4fd6; color: #fff; }
  .wt-queue-num.done { background: #ecfdf5; color: #10b981; }
  .wt-queue-info { flex: 1; min-width: 0; }
  .wt-queue-name { font-size: 14px; font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wt-queue-sub { font-size: 12px; color: #9ca3af; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wt-queue-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600;
    flex-shrink: 0;
  }
  .wt-queue-badge.calling { background: #eff4ff; color: #1a4fd6; }
  .wt-queue-badge.waiting { background: #fff7ed; color: #d97706; }
  .wt-queue-badge.done { background: #ecfdf5; color: #059669; }
  .wt-queue-wait { font-size: 12px; color: #9ca3af; min-width: 56px; text-align: right; flex-shrink: 0; }

  .wt-zone-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 0; }
  .wt-zone-card { border: 1.5px solid #e9ecef; border-radius: 10px; padding: 16px 18px; text-align: center; }
  .wt-zone-card.busy { border-color: #fca5a5; background: #fff5f5; }
  .wt-zone-card.normal { border-color: #fde68a; background: #fffdf0; }
  .wt-zone-card.clear { border-color: #a7f3d0; background: #f0fdf9; }
  .wt-zone-name { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px; }
  .wt-zone-num { font-size: 24px; font-weight: 900; color: #111827; }
  .wt-zone-label { font-size: 11px; margin-top: 4px; font-weight: 600; }
  .wt-zone-card.busy .wt-zone-label { color: #ef4444; }
  .wt-zone-card.normal .wt-zone-label { color: #d97706; }
  .wt-zone-card.clear .wt-zone-label { color: #10b981; }

  .wt-notify-btn {
    width: 100%; padding: 11px; background: rgba(255,255,255,0.15);
    border: 1.5px solid rgba(255,255,255,0.3); border-radius: 8px;
    color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: background 0.15s; margin-top: 14px;
  }
  .wt-notify-btn:hover { background: rgba(255,255,255,0.25); }
  .wt-notify-btn.active { background: rgba(255,255,255,0.9); color: #1a4fd6; }

  .wt-wave-wrap { display: flex; align-items: flex-end; gap: 4px; height: 60px; padding: 0 4px; }
  .wt-wave-bar { flex: 1; border-radius: 4px 4px 0 0; background: #bfdbfe; cursor: default; position: relative; min-width: 0; }
  .wt-wave-bar.current { background: #1a4fd6; }
  .wt-wave-bar:hover .wt-wave-tooltip { display: block; }
  .wt-wave-tooltip {
    display: none; position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
    background: #1a4fd6; color: #fff; font-size: 10px; font-weight: 600;
    padding: 3px 7px; border-radius: 4px; white-space: nowrap;
  }

  /* Live header */
  .wt-live-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 16px; }
  .wt-live-header-left { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .wt-live-title { font-size: 28px; font-weight: 900; color: #111827; line-height: 1.05; letter-spacing: -0.03em; }
  .wt-live-sub { font-size: 13px; color: #6b7280; }
  .wt-live-header-right { display: flex; align-items: center; gap: 12px; }
  .wt-timestamp { font-size: 12px; color: #9ca3af; font-weight: 500; font-variant-numeric: tabular-nums; }

  .wt-status-banner {
    margin-bottom: 16px; padding: 12px 14px; border-radius: 10px;
    border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c;
    font-size: 13px; font-weight: 600;
  }
  .wt-empty-state {
    min-height: 144px; border: 1px dashed #dbe3f0; border-radius: 10px;
    background: #fafcff; color: #6b7280; font-size: 13px;
    display: flex; align-items: center; justify-content: center; text-align: center;
    padding: 20px;
  }
  .wt-chart-label-row {
    display: flex; justify-content: space-between; margin-top: 8px; padding-left: 4px; gap: 4px;
  }
  .wt-chart-label {
    flex: 1; text-align: center; font-size: 10px; color: #9ca3af;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .wt-card-note {
    margin-top: 12px; display: flex; gap: 16px; font-size: 12.5px; color: #6b7280;
  }
  .wt-card-note-item { display: flex; align-items: center; gap: 5px; }
  .wt-card-note-swatch { width: 10px; height: 10px; border-radius: 2px; }

  @media (max-width: 1000px) { .wt-main-grid { grid-template-columns: 1fr; } }
  @media (max-width: 640px) {
    .wt-container { padding: 20px 16px 48px; }
    .wt-container.selector-mode { padding-top: 88px; }
    .wt-stat-grid { grid-template-columns: 1fr 1fr; }
    .wt-zone-grid { grid-template-columns: 1fr; }
    .wt-live-title { font-size: 22px; }
    .wt-card { padding: 20px 18px; }
    .wt-ticket-num { font-size: 40px; }
  }
`;

export const SERVICE_CATEGORIES = [
  { label: "통합 현황", path: "/realtime/dashboard" },
  { label: "대기 현황", path: "/realtime/waitingstatus" },
  { label: "체크인 현황", path: "/realtime/checkinstatus" },
  { label: "투표 현황", path: "/realtime/votestatus" },
];
export const SUBTITLE_MAP = {
  "/realtime/dashboard": "행사 전체 현황을 실시간으로 모니터링합니다",
  "/realtime/waitingstatus": "대기열 현황을 실시간으로 확인합니다",
  "/realtime/checkinstatus": "참가자 체크인 현황을 실시간으로 확인합니다",
  "/realtime/votestatus": "진행 중인 투표의 실시간 결과를 확인합니다",
};

const ZONE_LABEL = { busy: "혼잡", normal: "보통", clear: "원활" };
const ZONE_NAME_MAP = {
  ZONE_A: "A 구역",
  ZONE_B: "B 구역",
  ZONE_C: "C 구역",
  OTHER: "기타",
};

const AI_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const unwrapData = (response, fallback) =>
  response?.data?.data ?? response?.data ?? fallback;

const toArray = (payload) =>
  Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.content)
      ? payload.content
      : [];

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatZoneName(value) {
  return ZONE_NAME_MAP[String(value ?? "").toUpperCase()] ?? "미분류";
}

function formatWaitText(waitMin, waitCount) {
  const normalizedWait = safeNumber(waitMin);
  const normalizedCount = safeNumber(waitCount);
  if (normalizedWait > 0) return `약 ${normalizedWait}분`;
  if (normalizedCount > 0) return `${normalizedCount}팀 대기`;
  return "즉시 입장";
}

function formatTimeValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeRange(startAt, endAt) {
  const start = formatTimeValue(startAt);
  const end = formatTimeValue(endAt);
  if (start && end) return `${start}~${end}`;
  return start || end || "시간 정보 없음";
}

function truncateLabel(value, max = 7) {
  const label = String(value ?? "").trim();
  if (label.length <= max) return label;
  return `${label.slice(0, max)}…`;
}

function resolveZoneTone(waitCount, waitMin) {
  const normalizedCount = safeNumber(waitCount);
  const normalizedWait = safeNumber(waitMin);
  if (normalizedCount >= 10 || normalizedWait >= 20) return "busy";
  if (normalizedCount > 0 || normalizedWait > 0) return "normal";
  return "clear";
}

async function getAllBoothsByEvent(eventId) {
  const all = [];
  let page = 0;
  let isLast = false;

  while (!isLast && page < 100) {
    const response = await boothApi.getEventBooths({
      eventId,
      page,
      size: 200,
      sort: "boothId,asc",
    });
    const payload = unwrapData(response, {});
    all.push(...toArray(payload));
    isLast = Boolean(payload?.last);
    page += 1;
  }

  return all;
}

function mapBoothWait(detail) {
  if (!detail?.wait) return null;

  return {
    id: `booth-${detail.boothId}`,
    name: detail.placeName || `부스 ${detail.boothId}`,
    kind: "booth",
    typeLabel: "부스",
    groupName: formatZoneName(detail.zone),
    subText: detail.company
      ? `${detail.company} · ${formatZoneName(detail.zone)}`
      : `${formatZoneName(detail.zone)} · 부스 대기`,
    waitCount: safeNumber(detail.wait?.waitCount),
    waitMin: safeNumber(detail.wait?.waitMin),
    updatedAt: detail.wait?.updatedAt || detail.createdAt || null,
  };
}

function mapExperienceWait(detail) {
  if (!detail?.experienceWait) return null;

  return {
    id: `program-${detail.programId}`,
    programId: detail.programId,
    name: detail.programTitle || `체험 프로그램 ${detail.programId}`,
    kind: "experience",
    typeLabel: "체험",
    groupName: "체험 프로그램",
    subText: `${formatTimeRange(detail.startAt, detail.endAt)} · 체험 프로그램`,
    waitCount: safeNumber(detail.experienceWait?.waitCount),
    waitMin: safeNumber(detail.experienceWait?.waitMin),
    updatedAt: detail.experienceWait?.updatedAt || detail.startAt || null,
  };
}

function compareWaitingRows(a, b) {
  return (
    safeNumber(b.waitMin) - safeNumber(a.waitMin) ||
    safeNumber(b.waitCount) - safeNumber(a.waitCount) ||
    String(a.name ?? "").localeCompare(String(b.name ?? ""), "ko-KR")
  );
}

/* ── Animated stat card ── */
function AnimStatCard({ item, index }) {
  const count = useCountUp(item.rawValue, 1000, index * 120);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 100 + 50);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div className={`wt-stat-card anim-pop ${visible ? "visible" : ""}`}>
      <div className="wt-stat-icon" style={{ background: item.bg }}>
        {item.icon}
      </div>
      <div>
        <div className="wt-stat-label">{item.label}</div>
        <div className="wt-stat-value">
          {count}
          {item.suffix}
        </div>
      </div>
    </div>
  );
}

/* ── Animated zone card ── */
function AnimZoneCard({ zone, index }) {
  const count = useCountUp(zone.count, 800, index * 150 + 300);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 150 + 200);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className={`wt-zone-card ${zone.status} anim-pop ${visible ? "visible" : ""}`}
    >
      <div className="wt-zone-name">{zone.name}</div>
      <div className="wt-zone-num">{count}</div>
      <div className="wt-zone-label">{ZONE_LABEL[zone.status]}</div>
    </div>
  );
}

function WaitingContent({ eventId }) {
  const numericEventId = Number(eventId);
  const { tick } = useAutoRefresh(15000);
  const [eventDetail, setEventDetail] = useState(null);
  const [waitingRows, setWaitingRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [flashKey, setFlashKey] = useState(0);
  const [lastLoadedAt, setLastLoadedAt] = useState(new Date());
  const [focusProgram, setFocusProgram] = useState(null);
  const [programPrediction, setProgramPrediction] = useState(null);
  const [programRecommendation, setProgramRecommendation] = useState(null);
  const [aiErrorMsg, setAiErrorMsg] = useState("");
  const aiCacheRef = useRef({ programId: null, loadedAt: 0 });

  const loadData = useCallback(
    async (options = {}) => {
      const { preserveLoading = false, forceAi = false } = options;

      if (!numericEventId || Number.isNaN(numericEventId)) {
        setErrorMsg("잘못된 행사 경로입니다.");
        setFocusProgram(null);
        setProgramPrediction(null);
        setProgramRecommendation(null);
        setAiErrorMsg("");
        aiCacheRef.current = { programId: null, loadedAt: 0 };
        setLoading(false);
        return;
      }

      if (!preserveLoading) setLoading(true);

      try {
        const [eventResponse, booths, programs] = await Promise.all([
          eventApi.getEventDetail(numericEventId),
          getAllBoothsByEvent(numericEventId),
          programApi.getAllProgramsByEvent({
            eventId: numericEventId,
            category: "EXPERIENCE",
            sort: "startAt,asc",
            pageSize: 200,
          }),
        ]);

        const [boothDetails, programDetails] = await Promise.all([
          Promise.allSettled(
            booths.map((booth) => boothApi.getBoothDetail(booth.boothId)),
          ),
          Promise.allSettled(
            programs.map((program) => programApi.getProgramDetail(program.programId)),
          ),
        ]);

        const boothWaitingRows = boothDetails
          .map((result) =>
            result.status === "fulfilled"
              ? mapBoothWait(unwrapData(result.value, null))
              : null,
          )
          .filter(Boolean);

        const experienceWaitingRows = programDetails
          .map((result) =>
            result.status === "fulfilled"
              ? mapExperienceWait(unwrapData(result.value, null))
              : null,
          )
          .filter(Boolean);

        const mergedWaitingRows = [...boothWaitingRows, ...experienceWaitingRows].sort(compareWaitingRows);
        const sortedExperienceRows = [...experienceWaitingRows].sort(compareWaitingRows);
        const nextFocusProgram = sortedExperienceRows[0] ?? null;
        const nextFocusProgramId = Number(nextFocusProgram?.programId);

        setEventDetail(unwrapData(eventResponse, null));
        setWaitingRows(mergedWaitingRows);
        setFocusProgram(nextFocusProgram);

        if (Number.isFinite(nextFocusProgramId)) {
          const now = Date.now();
          const shouldLoadAi =
            forceAi ||
            aiCacheRef.current.programId !== nextFocusProgramId ||
            now - aiCacheRef.current.loadedAt >= AI_REFRESH_INTERVAL_MS;

          if (shouldLoadAi) {
            const [predictionResult, recommendationResult] = await Promise.allSettled([
              aiApi.predictProgramCongestion(nextFocusProgramId),
              aiApi.getProgramRecommendations(nextFocusProgramId),
            ]);

            if (predictionResult.status === "fulfilled") {
              setProgramPrediction(
                normalizePrediction(unwrapData(predictionResult.value, null)),
              );
            } else {
              setProgramPrediction(null);
            }

            if (recommendationResult.status === "fulfilled") {
              setProgramRecommendation(
                normalizeRecommendation(unwrapData(recommendationResult.value, null)),
              );
            } else {
              setProgramRecommendation(null);
            }

            if (
              predictionResult.status === "rejected" ||
              recommendationResult.status === "rejected"
            ) {
              setAiErrorMsg("AI recommendation data is temporarily unavailable.");
            } else {
              setAiErrorMsg("");
            }

            aiCacheRef.current = {
              programId: nextFocusProgramId,
              loadedAt: now,
            };
          } else {
            setAiErrorMsg("");
          }
        } else {
          setProgramPrediction(null);
          setProgramRecommendation(null);
          setAiErrorMsg("");
          aiCacheRef.current = { programId: null, loadedAt: 0 };
        }

        setErrorMsg("");
        setLastLoadedAt(new Date());
      } catch (error) {
        console.error("[WaitingStatus] load failed:", error);
        setErrorMsg("대기 데이터를 불러오지 못했습니다.");
      } finally {
        if (!preserveLoading) setLoading(false);
      }
    },
    [numericEventId],
  );

  const { spinning, refresh } = useRefresh(() => {
    loadData({ preserveLoading: true, forceAi: true });
  }, 800);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading) {
      loadData({ preserveLoading: true });
    }
  }, [tick, loadData, loading]);

  useEffect(() => {
    setFlashKey((value) => value + 1);
  }, [lastLoadedAt]);

  const liveSummary = useMemo(() => {
    const activeRows = waitingRows.filter(
      (row) => safeNumber(row.waitCount) > 0 || safeNumber(row.waitMin) > 0,
    );
    const totalWaitCount = waitingRows.reduce(
      (sum, row) => sum + safeNumber(row.waitCount),
      0,
    );
    const averageWaitMin = activeRows.length
      ? Math.round(
          activeRows.reduce((sum, row) => sum + safeNumber(row.waitMin), 0) /
            activeRows.length,
        )
      : 0;
    const maxWaitMin = activeRows.length
      ? Math.max(...activeRows.map((row) => safeNumber(row.waitMin)))
      : 0;
    const busiest = activeRows[0] ?? waitingRows[0] ?? null;

    const stats = [
      {
        label: "집계 리소스",
        rawValue: waitingRows.length,
        suffix: "곳",
        icon: <ListOrdered size={20} color="#f59e0b" />,
        bg: "#fffbeb",
      },
      {
        label: "현재 대기",
        rawValue: totalWaitCount,
        suffix: "팀",
        icon: <Users size={20} color="#10b981" />,
        bg: "#ecfdf5",
      },
      {
        label: "평균 대기",
        rawValue: averageWaitMin,
        suffix: "분",
        icon: <Timer size={20} color="#1a4fd6" />,
        bg: "#eff4ff",
      },
      {
        label: "최장 대기",
        rawValue: maxWaitMin,
        suffix: "분",
        icon: <Clock size={20} color="#8b5cf6" />,
        bg: "#f5f3ff",
      },
    ];

    const grouped = new Map();
    waitingRows.forEach((row) => {
      const key = row.groupName;
      const current = grouped.get(key) ?? {
        name: key,
        count: 0,
        waitMin: 0,
      };
      current.count += safeNumber(row.waitCount);
      current.waitMin = Math.max(current.waitMin, safeNumber(row.waitMin));
      grouped.set(key, current);
    });

    const zoneItems = Array.from(grouped.values())
      .sort(
        (a, b) =>
          safeNumber(b.count) - safeNumber(a.count) ||
          safeNumber(b.waitMin) - safeNumber(a.waitMin),
      )
      .slice(0, 3)
      .map((item) => ({
        name: item.name,
        count: safeNumber(item.count),
        status: resolveZoneTone(item.count, item.waitMin),
      }));

    const chartItems = activeRows.slice(0, 8);

    return {
      totalWaitCount,
      averageWaitMin,
      maxWaitMin,
      busiest,
      stats,
      zoneItems,
      chartItems,
    };
  }, [waitingRows]);

  const queueVisible = useStaggerIn(waitingRows.length, 80);
  const chartMax = useMemo(
    () =>
      Math.max(1, ...liveSummary.chartItems.map((item) => safeNumber(item.waitMin))),
    [liveSummary.chartItems],
  );
  const barHeights = useBarAnimate(
    liveSummary.chartItems.map((item) =>
      chartMax > 0 ? (safeNumber(item.waitMin) / chartMax) * 100 : 0,
    ),
    70,
  );
  const lastLoadedLabel = lastLoadedAt.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const eventName =
    eventDetail?.eventName || eventDetail?.title || `행사 ${numericEventId}`;
  const summaryTitle = loading ? "집계 중" : `${liveSummary.totalWaitCount}팀`;
  const summaryStatus = liveSummary.busiest
    ? `${liveSummary.busiest.name} · ${formatWaitText(
        liveSummary.busiest.waitMin,
        liveSummary.busiest.waitCount,
      )}`
    : "현재 집계된 대기 리소스가 없습니다";
  const isEmpty = !loading && waitingRows.length === 0;
  const aiTimelinePreview = useMemo(
    () =>
      Array.isArray(programPrediction?.timeline)
        ? programPrediction.timeline.slice(0, 6)
        : [],
    [programPrediction],
  );
  const recommendationItems = useMemo(
    () =>
      Array.isArray(programRecommendation?.recommendations)
        ? programRecommendation.recommendations.slice(0, 3)
        : [],
    [programRecommendation],
  );

  return (
    <>
      <div className="wt-live-header">
        <div className="wt-live-header-left">
          <div className="rt-live-badge anim-glow">
            <div className="rt-live-dot" />
            LIVE
          </div>
          <div className="wt-live-title">{eventName}</div>
          <div className="wt-live-sub">
            부스 상세와 체험 프로그램 상세의 실시간 대기 집계를 반영합니다
          </div>
        </div>
        <div className="wt-live-header-right">
          <span key={flashKey} className="wt-timestamp anim-flash">
            마지막 갱신: {lastLoadedLabel}
          </span>
          <button
            className="rt-refresh-btn"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6b7280",
              transition: "all 0.15s",
            }}
            onClick={refresh}
            title="새로고침"
          >
            <RefreshCw
              size={14}
              style={{
                animation: spinning
                  ? "anim-spin 0.8s cubic-bezier(0.4,0,0.2,1)"
                  : "none",
              }}
            />
          </button>
        </div>
      </div>

      {errorMsg ? <div className="wt-status-banner">{errorMsg}</div> : null}

      <div className="wt-stat-grid">
        {liveSummary.stats.map((item, index) => (
          <AnimStatCard key={item.label} item={item} index={index} />
        ))}
      </div>

      <div className="wt-main-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="wt-my-ticket">
            <div className="wt-ticket-label">행사 대기 요약</div>
            <div className="wt-ticket-num">{summaryTitle}</div>
            <div className="wt-ticket-info">
              <div className="wt-ticket-row">
                <Users size={13} /> {eventName}
              </div>
              <div className="wt-ticket-row">
                <Clock size={13} /> 집계 리소스 {waitingRows.length}곳 · 평균 {liveSummary.averageWaitMin}분
              </div>
            </div>
            <div className="wt-ticket-divider" />
            <div className="wt-ticket-status">
              <div className="wt-ticket-status-dot" />
              <span className="wt-ticket-status-text">{summaryStatus}</span>
            </div>
            <div className="wt-ahead">
              <span className="wt-ahead-label">최장 예상 대기</span>
              <span className="wt-ahead-val">{liveSummary.maxWaitMin}분</span>
            </div>
            <button className="wt-notify-btn" onClick={refresh}>
              <RefreshCw
                size={14}
                style={{
                  animation: spinning
                    ? "anim-spin 0.8s cubic-bezier(0.4,0,0.2,1)"
                    : "none",
                }}
              />
              지금 다시 집계
            </button>
          </div>

          <div className="wt-card">
            <div className="wt-card-header">
              <div className="wt-card-title">
                <div className="wt-card-title-icon">
                  <ListOrdered size={14} color="#f59e0b" />
                </div>
                대기 구역 요약
              </div>
            </div>
            {loading && waitingRows.length === 0 ? (
              <div className="wt-empty-state">실시간 대기 구역 정보를 불러오는 중입니다.</div>
            ) : liveSummary.zoneItems.length === 0 ? (
              <div className="wt-empty-state">표시할 구역별 대기 데이터가 없습니다.</div>
            ) : (
              <div className="wt-zone-grid">
                {liveSummary.zoneItems.map((zone, index) => (
                  <AnimZoneCard key={zone.name} zone={zone} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="wt-card">
            <div className="wt-card-header">
              <div className="wt-card-title">
                <div className="wt-card-title-icon">
                  <Timer size={14} color="#f59e0b" />
                </div>
                AI 프로그램 예측
              </div>
              <span className="wt-card-tag">5분 주기</span>
            </div>

            {focusProgram && programPrediction ? (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: 10,
                  }}
                >
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>대상 프로그램</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginTop: 4 }}>
                      {focusProgram.name}
                    </div>
                  </div>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>예측 점수</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginTop: 2 }}>
                      {Math.round(programPrediction.peakScore)}
                    </div>
                  </div>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>예상 대기</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginTop: 2 }}>
                      {programPrediction.waitMinutes}
                      <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 4 }}>min</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      border: `1px solid ${programPrediction.levelTone.border}`,
                      color: programPrediction.levelTone.color,
                      background: programPrediction.levelTone.bg,
                    }}
                  >
                    Lv.{programPrediction.level} {programPrediction.levelLabel}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    기준 시각: {formatKoreanTime(programPrediction.baseTime)}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    모드: {programPrediction.fallbackUsed ? "Fallback" : "AI Inference"}
                  </span>
                </div>

                {aiTimelinePreview.length > 0 ? (
                  <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {aiTimelinePreview.map((point) => (
                      <span
                        key={`${point.time}-${point.score}`}
                        style={{
                          border: `1px solid ${point.tone.border}`,
                          background: point.tone.bg,
                          color: point.tone.color,
                          borderRadius: 999,
                          padding: "3px 9px",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {formatKoreanTime(point.time)} {Math.round(point.score)}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                    대체 추천
                  </div>
                  {recommendationItems.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {recommendationItems.map((item, index) => (
                        <div
                          key={`${item.programId ?? "rec"}-${index}`}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            padding: "10px 12px",
                            background: "#fff",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>
                              {Math.round(item.score)} / {item.waitMinutes}min
                            </div>
                          </div>
                          {item.reason ? (
                            <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                              {item.reason}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="wt-empty-state" style={{ minHeight: 88 }}>
                      {programRecommendation?.message ||
                        "추천 가능한 대체 프로그램이 없습니다. 예상 대기시간만 안내합니다."}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="wt-empty-state">
                체험 프로그램이 확인되면 AI 예측 카드가 표시됩니다.
              </div>
            )}

            {aiErrorMsg ? (
              <div style={{ marginTop: 10, fontSize: 12, color: "#b91c1c" }}>{aiErrorMsg}</div>
            ) : null}
          </div>

          <div className="wt-card">
            <div className="wt-card-header">
              <div className="wt-card-title">
                <div className="wt-card-title-icon">
                  <Users size={14} color="#f59e0b" />
                </div>
                현재 대기 리소스
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="wt-card-tag">실시간 집계</span>
                <button
                  style={{
                    width: 30,
                    height: 30,
                    border: "1px solid #e2e8f0",
                    borderRadius: 7,
                    background: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                    transition: "all 0.15s",
                  }}
                  onClick={refresh}
                >
                  <RefreshCw
                    size={13}
                    style={{
                      animation: spinning
                        ? "anim-spin 0.8s cubic-bezier(0.4,0,0.2,1)"
                        : "none",
                    }}
                  />
                </button>
              </div>
            </div>
            {loading && waitingRows.length === 0 ? (
              <div className="wt-empty-state">실시간 대기 리소스를 불러오는 중입니다.</div>
            ) : isEmpty ? (
              <div className="wt-empty-state">현재 연결된 대기 데이터가 없습니다.</div>
            ) : (
              <div className="wt-queue-list">
                {waitingRows.map((row, index) => {
                  const isActive =
                    safeNumber(row.waitCount) > 0 || safeNumber(row.waitMin) > 0;
                  const visualStatus = !isActive
                    ? "done"
                    : index === 0
                      ? "calling"
                      : "waiting";
                  const badgeLabel = !isActive
                    ? "즉시 입장"
                    : index === 0
                      ? "최장 대기"
                      : "대기 중";

                  return (
                    <div
                      key={row.id}
                      className={`wt-queue-item${visualStatus === "calling" ? " calling" : visualStatus === "done" ? " done" : ""} anim-slide-right ${queueVisible.includes(index) ? "visible" : ""}`}
                    >
                      <div
                        className={`wt-queue-num${visualStatus === "calling" ? " calling" : visualStatus === "done" ? " done" : ""}`}
                      >
                        {visualStatus === "done" ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          String(index + 1).padStart(2, "0")
                        )}
                      </div>
                      <div className="wt-queue-info">
                        <div className="wt-queue-name">{row.name}</div>
                        <div className="wt-queue-sub">
                          {row.typeLabel} · {row.subText} · {row.waitCount}팀
                        </div>
                      </div>
                      <span className={`wt-queue-badge ${visualStatus}`}>
                        {visualStatus === "calling" ? <ArrowRight size={11} /> : null}
                        {badgeLabel}
                      </span>
                      <span className="wt-queue-wait">
                        {formatWaitText(row.waitMin, row.waitCount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="wt-card">
            <div className="wt-card-header">
              <div className="wt-card-title">
                <div className="wt-card-title-icon">
                  <Timer size={14} color="#f59e0b" />
                </div>
                대기 리소스별 예상 대기 시간
              </div>
              <span className="wt-card-tag">단위: 분</span>
            </div>
            {loading && liveSummary.chartItems.length === 0 ? (
              <div className="wt-empty-state">대기 시간 차트를 준비하는 중입니다.</div>
            ) : liveSummary.chartItems.length === 0 ? (
              <div className="wt-empty-state">표시할 예상 대기 시간 데이터가 없습니다.</div>
            ) : (
              <>
                <div className="wt-wave-wrap">
                  {liveSummary.chartItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`wt-wave-bar${index === 0 ? " current" : ""} anim-bar-grow`}
                      style={{ height: `${barHeights[index] ?? 0}%` }}
                    >
                      <div className="wt-wave-tooltip">
                        {item.name} · {safeNumber(item.waitMin)}분
                      </div>
                    </div>
                  ))}
                </div>
                <div className="wt-chart-label-row">
                  {liveSummary.chartItems.map((item) => (
                    <div key={item.id} className="wt-chart-label">
                      {truncateLabel(item.name)}
                    </div>
                  ))}
                </div>
                <div className="wt-card-note">
                  <span className="wt-card-note-item">
                    <div
                      className="wt-card-note-swatch"
                      style={{ background: "#bfdbfe" }}
                    />
                    일반 대기
                  </span>
                  <span className="wt-card-note-item">
                    <div
                      className="wt-card-note-swatch"
                      style={{ background: "#1a4fd6" }}
                    />
                    최장 대기
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function WaitingStatus({ onNavigate: onNavigateProp }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const currentPath = "/realtime/waitingstatus";

  const handleSelectEvent = (id) => {
    navigate(`/realtime/waitingstatus/${id}`);
  };

  const handleNavigate = (path) => {
    if (eventId) {
      navigate(`${path}/${eventId}`);
    } else {
      navigate(path);
    }
    onNavigateProp?.(path);
  };

  return (
    <div className="wt-root">
      <style>{styles}</style>
      <style>{SHARED_ANIM_STYLES}</style>
      {eventId ? (
        <PageHeader
          title={null}
          subtitle={null}
          categories={SERVICE_CATEGORIES}
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
      ) : null}
      <main className={`wt-container${eventId ? "" : " selector-mode"}`}>
        {eventId ? (
          <WaitingContent eventId={eventId} />
        ) : (
          <RealtimeEventSelector
            onSelectEvent={handleSelectEvent}
            pageTitle="대기 현황"
          />
        )}
      </main>
    </div>
  );
}
