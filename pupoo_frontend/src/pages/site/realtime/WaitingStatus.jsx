import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  Clock,
  ListOrdered,
  RefreshCw,
  Timer,
  Users,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import RealtimeEventSelector from "./RealtimeEventSelector";
import {
  SHARED_ANIM_STYLES,
  useAutoRefresh,
  useBarAnimate,
  useCountUp,
  useRefresh,
  useStaggerIn,
} from "./useRealtimeAnimations";
import { formatKoreanTime } from "./aiCongestionViewModel";
import { boothApi } from "../../../app/http/boothApi";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";

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
  .wt-page-shell { max-width: 1120px; margin: 0 auto; }

  .wt-live-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
  .wt-live-header-left { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
  .wt-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 999px; margin-bottom: 0;
    font-size: 11px; font-weight: 700; color: #ef4444;
    border: 1px solid #fecaca; background: #fff0f0;
  }
  .wt-live-meta { display: none; }
  .wt-live-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: wt-pulse 1.4s ease-in-out infinite; }
  @keyframes wt-pulse { 0%,100% { opacity: 1; transform: scale(1);} 50% { opacity: 0.5; transform: scale(0.8);} }
  .wt-live-title { margin: 0; font-size: 28px; line-height: 1.05; letter-spacing: -0.03em; font-weight: 900; color: #111827; }
  .wt-live-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .wt-timestamp { font-size: 12px; color: #9ca3af; font-weight: 600; font-variant-numeric: tabular-nums; }
  .wt-refresh-btn {
    width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff;
    display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: #6b7280; transition: all 0.15s;
  }
  .wt-refresh-btn:hover { border-color: #1a4fd6; color: #1a4fd6; background: #f5f8ff; }
  .wt-refresh-btn:active { transform: scale(0.95); }
  .wt-status-banner {
    margin-bottom: 16px; padding: 12px 14px; border-radius: 10px; border: 1px solid #fecaca;
    background: #fef2f2; color: #b91c1c; font-size: 13px; font-weight: 600;
  }

  .wt-hero-card {
    border: 1px solid #dbe5f5; border-radius: 16px; margin-bottom: 16px; padding: 22px 24px;
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 52%, #60a5fa 100%);
    color: #fff; display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 16px;
  }
  .wt-hero-label { margin: 0 0 8px; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.86); }
  .wt-hero-status { margin: 0; font-size: 32px; line-height: 1.08; letter-spacing: -0.02em; font-weight: 900; }
  .wt-hero-desc { margin: 10px 0 0; font-size: 14px; line-height: 1.45; font-weight: 700; color: rgba(255,255,255,0.96); }
  .wt-hero-sub-desc { margin: 8px 0 0; font-size: 12px; line-height: 1.45; font-weight: 600; color: rgba(255,255,255,0.9); }
  .wt-hero-side {
    border: 1px solid rgba(255,255,255,0.36); border-radius: 12px; background: rgba(255,255,255,0.14);
    padding: 12px; display: flex; flex-direction: column; gap: 8px; justify-content: center;
  }
  .wt-hero-side-row { font-size: 12px; line-height: 1.3; font-weight: 700; color: rgba(255,255,255,0.94); }

  .wt-summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
  .wt-summary-card {
    min-height: 102px; border: 1px solid #e9ecef; border-radius: 13px; background: #fff;
    padding: 18px 18px 16px; display: flex; align-items: center; gap: 12px;
  }
  .wt-summary-icon {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .wt-summary-label { font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 6px; }
  .wt-summary-value { font-size: 28px; line-height: 1; font-weight: 900; letter-spacing: -0.02em; color: #111827; }
  .wt-summary-unit { margin-left: 3px; font-size: 14px; color: #4b5563; font-weight: 700; }
  .wt-summary-value-text { font-size: 16px; line-height: 1.28; letter-spacing: -0.01em; font-weight: 800; color: #111827; }
  .wt-summary-sub { margin-top: 6px; font-size: 11px; line-height: 1.35; color: #6b7280; font-weight: 600; }

  .wt-card { border: 1px solid #e9ecef; border-radius: 13px; background: #fff; padding: 22px 22px 20px; margin-bottom: 14px; }
  .wt-card-header {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
    margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #f1f3f5;
  }
  .wt-card-title { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 800; color: #111827; }
  .wt-card-title-icon {
    width: 24px; height: 24px; border-radius: 6px; background: #eff6ff;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .wt-card-tag { font-size: 11px; font-weight: 700; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }
  .wt-empty-state {
    min-height: 136px; border: 1px dashed #dbe3f0; border-radius: 10px; background: #fafcff;
    color: #6b7280; font-size: 13px; line-height: 1.5; text-align: center; padding: 20px;
    display: flex; align-items: center; justify-content: center;
  }

  .wt-program-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .wt-program-card {
    border: 1px solid #e5e7eb; border-left-width: 4px; border-radius: 12px;
    background: #fff; padding: 13px 14px 12px;
  }
  .wt-tone-relaxed { border-left-color: #22c55e; }
  .wt-tone-normal { border-left-color: #f59e0b; }
  .wt-tone-busy { border-left-color: #f97316; }
  .wt-tone-critical { border-left-color: #ef4444; }
  .wt-tone-pending { border-left-color: #9ca3af; }

  .wt-program-card-main { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: flex-start; }
  .wt-program-title { margin: 0; font-size: 15px; line-height: 1.3; color: #111827; font-weight: 800; }
  .wt-program-time { margin-top: 6px; font-size: 12px; color: #6b7280; line-height: 1.3; }
  .wt-program-wait-count { margin-top: 8px; font-size: 13px; color: #111827; font-weight: 700; }
  .wt-program-right { text-align: right; }
  .wt-program-wait-min { margin-top: 7px; font-size: 22px; line-height: 1; letter-spacing: -0.02em; color: #111827; font-weight: 900; }
  .wt-program-status {
    margin-top: 10px; padding-top: 8px; border-top: 1px solid #f1f3f5;
    font-size: 12px; color: #4b5563; font-weight: 700; line-height: 1.35;
  }

  .wt-badge {
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 999px; border: 1px solid #e5e7eb; padding: 4px 10px;
    font-size: 11px; font-weight: 800; white-space: nowrap;
  }
  .wt-badge-lg { width: fit-content; padding: 5px 12px; font-size: 12px; }
  .wt-badge-relaxed { color: #166534; background: #ecfdf3; border-color: #bbf7d0; }
  .wt-badge-normal { color: #854d0e; background: #fffbeb; border-color: #fde68a; }
  .wt-badge-busy { color: #9a3412; background: #fff7ed; border-color: #fdba74; }
  .wt-badge-critical { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
  .wt-badge-pending { color: #4b5563; background: #f3f4f6; border-color: #d1d5db; }

  .wt-chart-lead { margin: -2px 0 10px; font-size: 12px; color: #6b7280; line-height: 1.4; }
  .wt-chart-bars { display: flex; align-items: stretch; gap: 8px; }
  .wt-chart-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .wt-chart-bar-wrap { height: 176px; display: flex; align-items: flex-end; }
  .wt-chart-bar {
    width: 100%; min-height: 6px; border-radius: 8px 8px 4px 4px; background: #bfdbfe;
    position: relative; cursor: default; transition: filter 0.15s;
  }
  .wt-chart-bar.top { background: #2563eb; }
  .wt-chart-bar:hover { filter: brightness(0.95); }
  .wt-chart-bar:hover .wt-chart-tooltip { display: flex; }
  .wt-chart-tooltip {
    display: none; position: absolute; left: 50%; bottom: calc(100% + 8px); transform: translateX(-50%);
    z-index: 3; border-radius: 8px; background: #111827; color: #fff; min-width: 140px; max-width: 220px;
    padding: 8px 9px; font-size: 11px; line-height: 1.3; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
    flex-direction: column; gap: 3px;
  }
  .wt-chart-tooltip strong { font-size: 11.5px; font-weight: 800; }
  .wt-chart-label { text-align: center; font-size: 11px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .wt-support-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .wt-zone-list { display: flex; flex-direction: column; gap: 10px; }
  .wt-zone-item { border: 1px solid #edf0f5; border-radius: 10px; background: #fafcff; padding: 10px 11px; }
  .wt-zone-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px; font-weight: 700; color: #1f2937; }
  .wt-zone-track { width: 100%; height: 7px; border-radius: 99px; background: #e5e7eb; overflow: hidden; }
  .wt-zone-fill { height: 100%; border-radius: inherit; background: #60a5fa; }
  .wt-zone-meta { margin-top: 6px; font-size: 11px; color: #6b7280; line-height: 1.3; }

  .wt-booth-list { display: flex; flex-direction: column; gap: 8px; }
  .wt-booth-item {
    border: 1px solid #eef1f5; border-radius: 10px; background: #fafcff; padding: 9px 10px;
    display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px;
  }
  .wt-booth-title { margin: 0; font-size: 13px; line-height: 1.3; color: #111827; font-weight: 700; }
  .wt-booth-meta { margin-top: 4px; font-size: 11px; color: #6b7280; }
  .wt-booth-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
  .wt-booth-wait { font-size: 12px; color: #111827; font-weight: 800; }

  @media (max-width: 1200px) { .wt-program-list { grid-template-columns: 1fr; } }
  @media (max-width: 1040px) {
    .wt-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .wt-support-grid { grid-template-columns: 1fr; }
    .wt-hero-card { grid-template-columns: 1fr; }
  }
  @media (max-width: 700px) {
    .wt-container { padding: 20px 16px 48px; }
    .wt-container.selector-mode { padding-top: 88px; }
    .wt-live-header { flex-direction: column; align-items: flex-start; }
    .wt-live-title { font-size: 22px; }
    .wt-hero-status { font-size: 30px; }
    .wt-summary-grid { grid-template-columns: 1fr; }
    .wt-card { padding: 18px 16px; }
    .wt-chart-bars { gap: 6px; }
    .wt-chart-bar-wrap { height: 160px; }
    .wt-program-card-main { grid-template-columns: 1fr; }
    .wt-program-right { text-align: left; display: flex; align-items: center; gap: 8px; }
    .wt-program-wait-min { margin-top: 0; font-size: 18px; }
  }
`;

export const SERVICE_CATEGORIES = [
  { label: "통합 현황", path: "/realtime/dashboard" },
  { label: "대기 현황", path: "/realtime/waitingstatus" },
  { label: "체크인 현황", path: "/realtime/checkinstatus" },
  { label: "투표 현황", path: "/realtime/votestatus" },
];

const ZONE_NAME_MAP = {
  ZONE_A: "A 구역",
  ZONE_B: "B 구역",
  ZONE_C: "C 구역",
  OTHER: "기타",
};

const unwrapData = (response, fallback) =>
  response?.data?.data ?? response?.data ?? fallback;

const toArray = (payload) =>
  Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.content)
      ? payload.content
      : [];

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round(parsed));
}

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatZoneName(value) {
  return ZONE_NAME_MAP[String(value ?? "").toUpperCase()] ?? "미분류";
}

function formatTimeValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatTimeRange(startAt, endAt) {
  const start = formatTimeValue(startAt);
  const end = formatTimeValue(endAt);
  if (start && end) return `${start} ~ ${end}`;
  return start || end || "운영 시간 정보 없음";
}

function getCongestionStatus(waitCount, waitMin) {
  const count = toNumberOrNull(waitCount);
  const minutes = toNumberOrNull(waitMin);

  if (count === null || minutes === null) {
    return { label: "집계 중", tone: "pending" };
  }
  if (count === 0 && minutes === 0) {
    return { label: "여유", tone: "relaxed" };
  }
  if (minutes < 10) {
    return { label: "보통", tone: "normal" };
  }
  if (minutes < 20) {
    return { label: "혼잡", tone: "busy" };
  }
  return { label: "매우 혼잡", tone: "critical" };
}

function getStatusText(waitCount, waitMin) {
  const count = toNumberOrNull(waitCount);
  const minutes = toNumberOrNull(waitMin);

  if (count === null || minutes === null) return "집계 중";
  if (count === 0 && minutes === 0) return "즉시 참여 가능";
  if (minutes === 0) return "대기 거의 없음";
  if (count > 0 || minutes > 0) return "대기 발생";
  return "집계 중";
}

function getWaitCountDisplay(waitCount, waitMin) {
  const count = toNumberOrNull(waitCount);
  const minutes = toNumberOrNull(waitMin);
  if (count === null || minutes === null) return "집계 중";
  if (count === 0 && minutes === 0) return "즉시 참여 가능";
  return `대기 ${count}팀`;
}

function getWaitMinuteDisplay(waitMin, waitCount) {
  const minutes = toNumberOrNull(waitMin);
  const count = toNumberOrNull(waitCount);
  if (minutes === null || count === null) return "집계 중";
  if (minutes === 0) return "대기 없음";
  return `약 ${minutes}분`;
}

function getCongestionGuideText(tone) {
  if (tone === "relaxed") return "지금 참여하기 좋아요";
  if (tone === "normal") return "무난하게 이용 가능해요";
  if (tone === "busy") return "조금 기다려야 해요";
  if (tone === "critical") return "혼잡하니 잠시 후 방문 추천";
  return "대기 정보를 집계하고 있어요";
}

function truncateLabel(value, max = 9) {
  const label = String(value ?? "").trim();
  if (label.length <= max) return label;
  return `${label.slice(0, max)}…`;
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
  if (!detail) return null;

  const waitCount = toNumberOrNull(detail.wait?.waitCount);
  const waitMin = toNumberOrNull(detail.wait?.waitMin);
  const congestion = getCongestionStatus(waitCount, waitMin);

  return {
    id: `booth-${detail.boothId}`,
    boothId: detail.boothId,
    boothTitle: detail.placeName || `부스 ${detail.boothId}`,
    zone: String(detail.zone ?? "").toUpperCase(),
    zoneLabel: formatZoneName(detail.zone),
    subText: detail.company || "현장 부스",
    waitCount,
    waitMin,
    congestionLabel: congestion.label,
    congestionTone: congestion.tone,
    statusText: getStatusText(waitCount, waitMin),
    updatedAt: detail.wait?.updatedAt || detail.updatedAt || detail.createdAt || null,
  };
}

function mapProgramWait(detail) {
  if (!detail) return null;

  const waitCount = toNumberOrNull(detail.experienceWait?.waitCount);
  const waitMin = toNumberOrNull(detail.experienceWait?.waitMin);
  const congestion = getCongestionStatus(waitCount, waitMin);

  return {
    id: `program-${detail.programId}`,
    programId: detail.programId,
    programTitle: detail.programTitle || `프로그램 ${detail.programId}`,
    timeText: formatTimeRange(detail.startAt, detail.endAt),
    waitCount,
    waitMin,
    congestionLabel: congestion.label,
    congestionTone: congestion.tone,
    statusText: getStatusText(waitCount, waitMin),
    updatedAt:
      detail.experienceWait?.updatedAt || detail.updatedAt || detail.startAt || null,
  };
}

function compareProgramRows(a, b) {
  const aWaitMin = a.waitMin ?? -1;
  const bWaitMin = b.waitMin ?? -1;
  const aWaitCount = a.waitCount ?? -1;
  const bWaitCount = b.waitCount ?? -1;

  return (
    bWaitMin - aWaitMin ||
    bWaitCount - aWaitCount ||
    String(a.programTitle ?? "").localeCompare(String(b.programTitle ?? ""), "ko-KR")
  );
}

function compareBoothRows(a, b) {
  const aWaitMin = a.waitMin ?? -1;
  const bWaitMin = b.waitMin ?? -1;
  const aWaitCount = a.waitCount ?? -1;
  const bWaitCount = b.waitCount ?? -1;

  return (
    bWaitMin - aWaitMin ||
    bWaitCount - aWaitCount ||
    String(a.boothTitle ?? "").localeCompare(String(b.boothTitle ?? ""), "ko-KR")
  );
}

function SummaryCard({ item, index }) {
  const isNumericValue =
    item.rawValue !== null &&
    item.rawValue !== undefined &&
    Number.isFinite(Number(item.rawValue));
  const count = useCountUp(isNumericValue ? Number(item.rawValue) : 0, 900, index * 80);

  return (
    <div className="wt-summary-card">
      <div className="wt-summary-icon" style={{ background: item.bg }}>
        {item.icon}
      </div>
      <div>
        <div className="wt-summary-label">{item.label}</div>
        {isNumericValue ? (
          <div className="wt-summary-value">
            {count}
            <span className="wt-summary-unit">{item.unit}</span>
          </div>
        ) : (
          <div className="wt-summary-value-text">{item.textValue || "집계 중"}</div>
        )}
        {item.sub ? <div className="wt-summary-sub">{item.sub}</div> : null}
      </div>
    </div>
  );
}

function WaitingContent({ eventId }) {
  const numericEventId = Number(eventId);
  const { tick } = useAutoRefresh(15000);

  const [eventDetail, setEventDetail] = useState(null);
  const [programWaitingRows, setProgramWaitingRows] = useState([]);
  const [boothWaitingRows, setBoothWaitingRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [flashKey, setFlashKey] = useState(0);
  const [lastLoadedAt, setLastLoadedAt] = useState(new Date());

  const loadData = useCallback(
    async (options = {}) => {
      const { preserveLoading = false } = options;

      if (!numericEventId || Number.isNaN(numericEventId)) {
        setErrorMsg("잘못된 행사 경로입니다.");
        setProgramWaitingRows([]);
        setBoothWaitingRows([]);
        setLoading(false);
        return;
      }

      if (!preserveLoading) setLoading(true);

      try {
        const [eventResponse, booths, programListResponse] = await Promise.all([
          eventApi.getEventDetail(numericEventId),
          getAllBoothsByEvent(numericEventId),
          programApi.getAllProgramsByEvent({
            eventId: numericEventId,
            category: "EXPERIENCE",
            sort: "startAt,asc",
            pageSize: 200,
          }),
        ]);

        const programs = toArray(unwrapData(programListResponse, {}));

        const [boothDetails, programDetails] = await Promise.all([
          Promise.allSettled(
            booths.map((booth) => boothApi.getBoothDetail(booth.boothId)),
          ),
          Promise.allSettled(
            programs.map((program) => programApi.getProgramDetail(program.programId)),
          ),
        ]);

        const nextBoothRows = boothDetails
          .map((result) =>
            result.status === "fulfilled"
              ? mapBoothWait(unwrapData(result.value, null))
              : null,
          )
          .filter(Boolean)
          .sort(compareBoothRows);

        const nextProgramRows = programDetails
          .map((result) =>
            result.status === "fulfilled"
              ? mapProgramWait(unwrapData(result.value, null))
              : null,
          )
          .filter(Boolean)
          .sort(compareProgramRows);

        setEventDetail(unwrapData(eventResponse, null));
        setProgramWaitingRows(nextProgramRows);
        setBoothWaitingRows(nextBoothRows);
        setErrorMsg("");
        setLastLoadedAt(new Date());
      } catch (error) {
        console.error("[WaitingStatus] load failed:", error);
        setErrorMsg("대기 현황 데이터를 불러오지 못했습니다.");
      } finally {
        if (!preserveLoading) setLoading(false);
      }
    },
    [numericEventId],
  );

  const { spinning, refresh } = useRefresh(() => {
    loadData({ preserveLoading: true });
  }, 800);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading) loadData({ preserveLoading: true });
  }, [tick, loadData, loading]);

  useEffect(() => {
    setFlashKey((value) => value + 1);
  }, [lastLoadedAt]);

  const sortedProgramRows = useMemo(
    () => [...programWaitingRows].sort(compareProgramRows),
    [programWaitingRows],
  );
  const sortedBoothRows = useMemo(
    () => [...boothWaitingRows].sort(compareBoothRows),
    [boothWaitingRows],
  );
  const measuredProgramRows = useMemo(
    () =>
      sortedProgramRows.filter((row) => row.waitCount !== null && row.waitMin !== null),
    [sortedProgramRows],
  );

  const summary = useMemo(() => {
    const operatingProgramCount = sortedProgramRows.length;
    const waitingProgramRows = measuredProgramRows.filter(
      (row) => safeNumber(row.waitCount) > 0 || safeNumber(row.waitMin) > 0,
    );
    const waitingProgramCount = waitingProgramRows.length;
    const immediateProgramRows = measuredProgramRows.filter(
      (row) => safeNumber(row.waitCount) === 0 && safeNumber(row.waitMin) === 0,
    );
    const immediateProgramCount = immediateProgramRows.length;
    const busiestProgram = waitingProgramRows[0] ?? measuredProgramRows[0] ?? null;
    const maxWaitMin = waitingProgramRows.length
      ? Math.max(...waitingProgramRows.map((row) => safeNumber(row.waitMin)))
      : 0;

    const stats = [
      {
        label: "운영 프로그램 수",
        rawValue: operatingProgramCount,
        unit: "개",
        icon: <ListOrdered size={19} color="#1d4ed8" />,
        bg: "#eff6ff",
      },
      {
        label: "즉시 참여 가능",
        rawValue: immediateProgramCount,
        unit: "개",
        icon: <Users size={19} color="#0f766e" />,
        bg: "#ecfeff",
      },
      {
        label: "가장 혼잡한 프로그램",
        rawValue: null,
        textValue:
          waitingProgramCount > 0
            ? busiestProgram?.programTitle || "집계 중"
            : "현재 대기 없음",
        sub: busiestProgram
          ? waitingProgramCount > 0
            ? `${getWaitMinuteDisplay(busiestProgram.waitMin, busiestProgram.waitCount)} · ${getWaitCountDisplay(busiestProgram.waitCount, busiestProgram.waitMin)}`
            : "모든 프로그램 즉시 참여 가능"
          : "프로그램 대기 정보 집계 중",
        icon: <Timer size={19} color="#4338ca" />,
        bg: "#eef2ff",
      },
      {
        label: "대기 중 최대 예상시간",
        rawValue: waitingProgramCount > 0 ? maxWaitMin : null,
        unit: waitingProgramCount > 0 ? "분" : "",
        textValue: waitingProgramCount > 0 ? null : "대기 없음",
        sub:
          waitingProgramCount > 0
            ? `${waitingProgramCount}개 프로그램 대기 중`
            : "대기 발생 프로그램 없음",
        icon: <Clock size={19} color="#9333ea" />,
        bg: "#f3e8ff",
      },
    ];

    return {
      operatingProgramCount,
      waitingProgramRows,
      waitingProgramCount,
      immediateProgramRows,
      immediateProgramCount,
      maxWaitMin,
      busiestProgram,
      stats,
    };
  }, [measuredProgramRows, sortedProgramRows]);

  const topBusyPrograms = useMemo(
    () => measuredProgramRows.slice(0, 8),
    [measuredProgramRows],
  );
  const chartMax = useMemo(
    () => Math.max(1, ...topBusyPrograms.map((row) => safeNumber(row.waitMin))),
    [topBusyPrograms],
  );
  const barHeights = useBarAnimate(
    topBusyPrograms.map((row) =>
      chartMax > 0 ? (safeNumber(row.waitMin) / chartMax) * 100 : 0,
    ),
    70,
  );

  const zoneDistribution = useMemo(() => {
    const map = new Map();

    sortedBoothRows.forEach((row) => {
      const key = row.zoneLabel || "미분류";
      const current = map.get(key) || {
        zoneLabel: key,
        boothCount: 0,
        waitTeamTotal: 0,
        waitMinTotal: 0,
        measuredCount: 0,
      };
      current.boothCount += 1;
      if (row.waitCount !== null) current.waitTeamTotal += safeNumber(row.waitCount);
      if (row.waitMin !== null) {
        current.waitMinTotal += safeNumber(row.waitMin);
        current.measuredCount += 1;
      }
      map.set(key, current);
    });

    return [...map.values()]
      .map((item) => ({
        ...item,
        averageWaitMin: item.measuredCount
          ? Math.round(item.waitMinTotal / item.measuredCount)
          : 0,
      }))
      .sort(
        (a, b) =>
          b.waitTeamTotal - a.waitTeamTotal ||
          b.averageWaitMin - a.averageWaitMin ||
          a.zoneLabel.localeCompare(b.zoneLabel, "ko-KR"),
      );
  }, [sortedBoothRows]);

  const zoneMaxWaitTeam = useMemo(
    () => Math.max(1, ...zoneDistribution.map((item) => safeNumber(item.waitTeamTotal))),
    [zoneDistribution],
  );

  const programVisible = useStaggerIn(sortedProgramRows.length, 60);
  const boothVisible = useStaggerIn(sortedBoothRows.length, 40);
  const visibleBoothRows = useMemo(() => sortedBoothRows.slice(0, 12), [sortedBoothRows]);

  const lastLoadedLabel = lastLoadedAt.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const eventName =
    eventDetail?.eventName || eventDetail?.title || `행사 ${numericEventId}`;

  const heroProgram =
    summary.waitingProgramCount > 0 ? summary.busiestProgram : null;
  const heroProgramPreview = summary.immediateProgramRows
    .slice(0, 2)
    .map((row) => row.programTitle)
    .join(", ");
  const heroTone = heroProgram
    ? {
        tone: heroProgram.congestionTone,
        label: heroProgram.congestionLabel,
      }
    : summary.immediateProgramCount > 0
      ? { tone: "relaxed", label: "여유" }
      : { tone: "pending", label: "집계 중" };
  const heroLabel = heroProgram
    ? "현재 가장 혼잡한 프로그램"
    : summary.immediateProgramCount > 0
      ? "지금 바로 참여하기 좋은 프로그램"
      : "프로그램 대기 정보";
  const heroTitle = heroProgram
    ? heroProgram.programTitle
    : summary.immediateProgramCount > 0
      ? `${summary.immediateProgramCount}개 프로그램 즉시 참여 가능`
      : "대기 정보 집계 중";
  const heroDescription = heroProgram
    ? `${getWaitMinuteDisplay(heroProgram.waitMin, heroProgram.waitCount)} · ${getWaitCountDisplay(heroProgram.waitCount, heroProgram.waitMin)}`
    : summary.immediateProgramCount > 0
      ? `현재 대기 없이 참여 가능한 프로그램이 ${summary.immediateProgramCount}개 있어요.`
      : "운영 프로그램의 대기 정보를 집계 중입니다.";
  const heroSubDescription = heroProgram
    ? getCongestionGuideText(heroProgram.congestionTone)
    : summary.immediateProgramCount > 0
      ? heroProgramPreview
        ? `추천 프로그램: ${heroProgramPreview}`
        : "프로그램 목록에서 즉시 참여 가능한 항목을 확인해 보세요."
      : "잠시 후 다시 확인해 주세요.";

  const isProgramEmpty = !loading && sortedProgramRows.length === 0;
  const isBoothEmpty = !loading && sortedBoothRows.length === 0;

  return (
    <>
      <div className="wt-page-shell">
      <div className="wt-live-header">
        <div className="wt-live-header-left">
          <div className="wt-live-badge anim-glow">
            <div className="wt-live-dot" />
            LIVE
          </div>
          <div className="wt-live-meta">
            <span>{eventName}</span>
            <span>·</span>
            <span>프로그램 대기 안내</span>
          </div>
        </div>
        <div className="wt-live-header-right">
          <span key={flashKey} className="wt-timestamp anim-flash">
            마지막 갱신: {lastLoadedLabel}
          </span>
          <button className="wt-refresh-btn" onClick={refresh} title="새로고침">
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

      <div className="wt-hero-card">
        <div>
          <p className="wt-hero-label">{heroLabel}</p>
          <h2 className="wt-hero-status">{heroTitle}</h2>
          <p className="wt-hero-desc">{heroDescription}</p>
          <p className="wt-hero-sub-desc">{heroSubDescription}</p>
        </div>
        <div className="wt-hero-side">
          <span className={`wt-badge wt-badge-lg wt-badge-${heroTone.tone}`}>
            {heroTone.label}
          </span>
          <div className="wt-hero-side-row">운영 프로그램 수: {summary.operatingProgramCount}개</div>
          <div className="wt-hero-side-row">즉시 참여 가능: {summary.immediateProgramCount}개</div>
          <div className="wt-hero-side-row">대기 발생 프로그램: {summary.waitingProgramCount}개</div>
          <div className="wt-hero-side-row">
            대기 중 최대 예상시간: {summary.waitingProgramCount > 0 ? `${summary.maxWaitMin}분` : "대기 없음"}
          </div>
        </div>
      </div>

      <div className="wt-summary-grid">
        {summary.stats.map((item, index) => (
          <SummaryCard key={item.label} item={item} index={index} />
        ))}
      </div>

      <div className="wt-card">
        <div className="wt-card-header">
          <h3 className="wt-card-title">
            <span className="wt-card-title-icon">
              <Users size={14} color="#1d4ed8" />
            </span>
            프로그램 혼잡도
          </h3>
          <span className="wt-card-tag">실시간 집계</span>
        </div>

        {loading && sortedProgramRows.length === 0 ? (
          <div className="wt-empty-state">프로그램 대기 현황을 불러오는 중입니다.</div>
        ) : isProgramEmpty ? (
          <div className="wt-empty-state">현재 집계된 프로그램 대기 정보가 없습니다.</div>
        ) : (
          <div className="wt-program-list">
            {sortedProgramRows.map((row, index) => (
              <div
                key={row.id}
                className={`wt-program-card wt-tone-${row.congestionTone} anim-slide-right ${programVisible.includes(index) ? "visible" : ""}`}
              >
                <div className="wt-program-card-main">
                  <div>
                    <h4 className="wt-program-title">{row.programTitle}</h4>
                    <div className="wt-program-time">운영 시간: {row.timeText}</div>
                    <div className="wt-program-wait-count">
                      {getWaitCountDisplay(row.waitCount, row.waitMin)}
                    </div>
                  </div>
                  <div className="wt-program-right">
                    <span className={`wt-badge wt-badge-${row.congestionTone}`}>
                      {row.congestionLabel}
                    </span>
                    <div className="wt-program-wait-min">
                      {getWaitMinuteDisplay(row.waitMin, row.waitCount)}
                    </div>
                  </div>
                </div>
                <div className="wt-program-status">
                  {row.statusText}
                  {row.statusText === "집계 중"
                    ? ""
                    : ` · ${getCongestionGuideText(row.congestionTone)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="wt-card">
        <div className="wt-card-header">
          <h3 className="wt-card-title">
            <span className="wt-card-title-icon">
              <Activity size={14} color="#1d4ed8" />
            </span>
            프로그램 예상 대기시간 비교
          </h3>
          <span className="wt-card-tag">상위 8개 프로그램</span>
        </div>
        <div className="wt-chart-lead">
          프로그램별 예상 대기시간을 한눈에 비교할 수 있어요.
        </div>

        {loading && topBusyPrograms.length === 0 ? (
          <div className="wt-empty-state">프로그램 대기 현황을 불러오는 중입니다.</div>
        ) : topBusyPrograms.length === 0 ? (
          <div className="wt-empty-state">현재 집계된 프로그램 대기 정보가 없습니다.</div>
        ) : (
          <div className="wt-chart-bars">
            {topBusyPrograms.map((item, index) => (
              <div key={item.id} className="wt-chart-col">
                <div className="wt-chart-bar-wrap">
                  <div
                    className={`wt-chart-bar${index === 0 ? " top" : ""} anim-bar-grow`}
                    style={{ height: `${barHeights[index] ?? 0}%` }}
                  >
                    <div className="wt-chart-tooltip">
                      <strong>{item.programTitle}</strong>
                      <span>
                        예상 대기: {getWaitMinuteDisplay(item.waitMin, item.waitCount)}
                      </span>
                      <span>
                        대기 팀 수:{" "}
                        {item.waitCount === null ? "집계 중" : `${item.waitCount}팀`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="wt-chart-label" title={item.programTitle}>
                  {truncateLabel(item.programTitle)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="wt-support-grid">
        <div className="wt-card">
          <div className="wt-card-header">
            <h3 className="wt-card-title">
              <span className="wt-card-title-icon">
                <ListOrdered size={14} color="#0f766e" />
              </span>
              구역별 대기 분포
            </h3>
            <span className="wt-card-tag">보조 정보</span>
          </div>

          {zoneDistribution.length === 0 ? (
            <div className="wt-empty-state">현재 집계된 부스 대기 정보가 없습니다.</div>
          ) : (
            <div className="wt-zone-list">
              {zoneDistribution.map((item) => (
                <div key={item.zoneLabel} className="wt-zone-item">
                  <div className="wt-zone-head">
                    <span>{item.zoneLabel}</span>
                    <span>대기 {item.waitTeamTotal}팀</span>
                  </div>
                  <div className="wt-zone-track">
                    <div
                      className="wt-zone-fill"
                      style={{
                        width: `${Math.round(
                          (safeNumber(item.waitTeamTotal) / zoneMaxWaitTeam) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="wt-zone-meta">
                    부스 {item.boothCount}개 · 평균 예상 대기 {item.averageWaitMin}분
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="wt-card">
          <div className="wt-card-header">
            <h3 className="wt-card-title">
              <span className="wt-card-title-icon">
                <ListOrdered size={14} color="#0f766e" />
              </span>
              부스 대기 참고
            </h3>
            <span className="wt-card-tag">보조 섹션</span>
          </div>

          {loading && sortedBoothRows.length === 0 ? (
            <div className="wt-empty-state">부스 대기 현황을 불러오는 중입니다.</div>
          ) : isBoothEmpty ? (
            <div className="wt-empty-state">현재 집계된 부스 대기 정보가 없습니다.</div>
          ) : (
            <div className="wt-booth-list">
              {visibleBoothRows.map((row, index) => (
                <div
                  key={row.id}
                  className={`wt-booth-item anim-slide-right ${boothVisible.includes(index) ? "visible" : ""}`}
                >
                  <div>
                    <h4 className="wt-booth-title">{row.boothTitle}</h4>
                    <div className="wt-booth-meta">
                      {row.zoneLabel} · {row.subText}
                    </div>
                  </div>
                  <div className="wt-booth-right">
                    <span className={`wt-badge wt-badge-${row.congestionTone}`}>
                      {row.congestionLabel}
                    </span>
                    <div className="wt-booth-wait">
                      {getWaitMinuteDisplay(row.waitMin, row.waitCount)}
                    </div>
                    <div className="wt-chart-label">
                      {formatKoreanTime(row.updatedAt) || "집계 중"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
          stickyCategories
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
