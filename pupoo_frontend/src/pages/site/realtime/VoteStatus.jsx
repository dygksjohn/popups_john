import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Medal,
  RefreshCw,
  Trophy,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import RealtimeEventSelector from "./RealtimeEventSelector";
import {
  SHARED_ANIM_STYLES,
  useAutoRefresh,
  useRefresh,
} from "./useRealtimeAnimations";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import {
  createImageFallbackHandler,
  resolveImageUrl,
} from "../../../shared/utils/publicAssetUrl";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
  .vt-root { box-sizing: border-box; min-height: 100vh; background: #f8f9fc; font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif; }
  .vt-root *, .vt-root *::before, .vt-root *::after { box-sizing: border-box; font-family: inherit; }
  .vt-container { max-width: 1400px; margin: 0 auto; padding: 32px 25px 64px; }
  .vt-container.with-event { padding-top: 92px; }
  .vt-container.selector-mode { padding-top: 104px; }
  .vt-page-shell { max-width: 1120px; margin: 0 auto; }

  .vt-live-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 10px; margin-bottom: 10px; }
  .vt-live-header-left { min-width: 0; display: flex; flex-direction: column; gap: 0; }
  .vt-live-header-right { display: flex; align-items: center; gap: 12px; }
  .vt-live-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px; border: 1px solid #fecaca; background: #fff0f0; color: #ef4444; font-size: 11px; font-weight: 700; }
  .vt-live-badge.planned { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; justify-content: center; gap: 0; }
  .vt-live-badge.ended { background: #f3f4f6; border-color: #e5e7eb; color: #6b7280; justify-content: center; gap: 0; }
  .vt-live-badge.cancelled { background: #fef2f2; border-color: #fecaca; color: #b91c1c; justify-content: center; gap: 0; }
  .vt-live-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: vt-pulse 1.4s ease-in-out infinite; }
  .vt-live-dot.placeholder { visibility: hidden; animation: none; width: 0; margin: 0; }
  @keyframes vt-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.76); } }
  .vt-live-time { font-size: 12px; color: #6b7280; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .vt-refresh-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #6b7280; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
  .vt-refresh-btn:hover { border-color: #1a4fd6; color: #1a4fd6; background: #f5f8ff; }
  .vt-refresh-btn:active { transform: scale(0.95); }

  .vt-card { border: 1px solid #e9ecef; border-radius: 13px; background: #fff; padding: 18px; }
  .vt-card-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .vt-card-title { margin: 0; display: inline-flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 800; color: #111827; }
  .vt-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #eff6ff; color: #2563eb; display: inline-flex; align-items: center; justify-content: center; }
  .vt-card-tag { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; border: 1px solid #e5e7eb; background: #f8fafc; color: #4b5563; font-size: 11px; font-weight: 700; }
  .vt-detail-rank-badge {
    padding: 6px 14px;
    font-size: 14px;
    font-weight: 900;
    color: #7c2d12;
    background: #fff7ed;
    border-color: #fdba74;
    letter-spacing: -0.01em;
  }
  .vt-detail-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
  }
  .vt-detail-name-group {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    flex: 1;
  }
  .vt-detail-rank-badge-inline {
    flex-shrink: 0;
  }

  .vt-selector-wrap { margin-top: 8px; margin-bottom: 14px; }
  .vt-selector-head-left {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex-wrap: wrap;
  }
  .vt-selector-status-filters {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-left: 4px;
  }
  .vt-selector-status-btn {
    border: 1px solid #d1d5db;
    border-radius: 999px;
    background: #fff;
    color: #475569;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    padding: 6px 10px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .vt-selector-status-btn:hover { border-color: #94a3b8; background: #f8fafc; }
  .vt-selector-status-btn.active { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
  .vt-selector-list { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: thin; }
  .vt-selector-item { min-width: 200px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; padding: 11px; text-align: left; cursor: pointer; transition: all 0.15s; }
  .vt-selector-item:hover { border-color: #cbd5e1; transform: translateY(-1px); }
  .vt-selector-item.active { border-color: #2563eb; background: #f8fbff; box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.12); }
  .vt-selector-empty {
    min-width: 100%;
    border: 1px dashed #dbe3ef;
    border-radius: 10px;
    background: #fafcff;
    color: #6b7280;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    padding: 14px 12px;
  }
  .vt-selector-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; }
  .vt-selector-name { margin: 0; font-size: 13px; font-weight: 800; color: #111827; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vt-selector-votes { margin: 0; font-size: 12px; color: #4b5563; font-weight: 700; }
  .vt-selector-status { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 2px 8px; font-size: 10px; font-weight: 800; border: 1px solid transparent; flex-shrink: 0; }
  .vt-selector-status-live { color: #166534; background: #ecfdf3; border-color: #bbf7d0; }
  .vt-selector-status-wait { color: #854d0e; background: #fffbeb; border-color: #fde68a; }
  .vt-selector-status-end { color: #475569; background: #f1f5f9; border-color: #cbd5e1; }
  .vt-selector-link { border: 0; background: transparent; color: #2563eb; font-size: 12px; font-weight: 700; cursor: pointer; padding: 0; }
  .vt-selector-link:hover { text-decoration: underline; }

  .vt-main-grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 14px; align-items: stretch; }
  .vt-ranking-title { margin: 0; font-size: 19px; line-height: 1.2; letter-spacing: -0.01em; color: #111827; font-weight: 900; }
  .vt-ranking-meta { margin: 4px 0 0; font-size: 12px; color: #6b7280; font-weight: 600; }
  .vt-ranking-list { margin-top: 10px; border: 1px solid #eef1f5; border-radius: 12px; overflow-y: auto; max-height: 590px; background: #fff; }
  .vt-ranking-row { width: 100%; border: 0; border-bottom: 1px solid #eef1f5; background: #fff; text-align: left; padding: 11px 10px; display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 10px; align-items: center; cursor: pointer; }
  .vt-ranking-row:last-child { border-bottom: 0; }
  .vt-ranking-row:hover { background: #f8fafc; }
  .vt-ranking-row.selected { background: #eff6ff; }
  .vt-ranking-row.rank-1 { background: #fff8e8; }
  .vt-ranking-row.rank-1.selected { background: #fff2cc; }
  .vt-ranking-rank { width: 34px; height: 34px; border-radius: 10px; background: #f1f5f9; color: #475569; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; }
  .vt-ranking-row.rank-1 .vt-ranking-rank { background: #fbbf24; color: #7c2d12; }
  .vt-ranking-main { min-width: 0; display: flex; flex-direction: column; gap: 7px; }
  .vt-ranking-line { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .vt-ranking-name { margin: 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: 800; color: #111827; }
  .vt-ranking-votes { flex-shrink: 0; font-size: 12px; color: #4b5563; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; }
  .vt-ranking-votes strong { color: #111827; font-weight: 900; font-variant-numeric: tabular-nums; }
  .vt-ranking-track { width: 100%; height: 7px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
  .vt-ranking-fill { height: 100%; border-radius: inherit; background: #60a5fa; }
  .vt-ranking-row.rank-1 .vt-ranking-fill { background: #f59e0b; }
  .vt-ranking-toggle { margin-top: 10px; border: 1px solid #dbe3ef; border-radius: 999px; background: #fff; color: #334155; font-size: 12px; font-weight: 700; padding: 5px 11px; cursor: pointer; }
  .vt-ranking-toggle:hover { border-color: #c2d0e4; background: #f8fafc; }

  .vt-detail-name { margin: 0; font-size: 20px; line-height: 1.2; letter-spacing: -0.01em; color: #111827; font-weight: 900; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vt-detail-owner-inline { margin: 0; font-size: 12px; color: #6b7280; font-weight: 600; white-space: nowrap; }
  .vt-detail-sub { margin: 6px 0 0; font-size: 12px; color: #6b7280; font-weight: 600; }
  .vt-detail-media { width: 100%; aspect-ratio: 16 / 10; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; background: #f8fafc; display: flex; align-items: center; justify-content: center; margin: 12px 0; }
  .vt-detail-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .vt-detail-placeholder { font-size: 13px; color: #64748b; font-weight: 700; }
  .vt-detail-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .vt-detail-metric { border: 1px solid #e5e7eb; border-radius: 10px; background: #fafcff; padding: 10px 11px; }
  .vt-detail-metric-label { margin: 0 0 4px; font-size: 11px; color: #6b7280; font-weight: 600; }
  .vt-detail-metric-value { margin: 0; font-size: 15px; line-height: 1.2; letter-spacing: -0.01em; color: #111827; font-weight: 900; }

  .vt-state-card { border: 1px dashed #dbe3ef; border-radius: 12px; background: #fafcff; min-height: 220px; padding: 20px; display: flex; align-items: center; justify-content: center; text-align: center; color: #6b7280; font-size: 14px; line-height: 1.5; font-weight: 600; }
  .vt-inline-banner { margin-bottom: 12px; border-radius: 10px; border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; padding: 11px 12px; font-size: 13px; font-weight: 700; }

  @media (max-width: 1100px) {
    .vt-ranking-list { max-height: 520px; }
  }
  @media (max-width: 900px) {
    .vt-main-grid { grid-template-columns: 1fr; }
    .vt-ranking-list { max-height: 420px; }
  }
  @media (max-width: 680px) {
    .vt-container { padding: 20px 16px 48px; }
    .vt-container.with-event { padding-top: 80px; }
    .vt-container.selector-mode { padding-top: 88px; }
    .vt-card { padding: 16px; }
    .vt-selector-head-left { width: 100%; }
    .vt-detail-metrics { grid-template-columns: 1fr; }
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

const CONTEST_STATUS_FILTERS = [
  { key: "진행 중", label: "진행 중 콘테스트" },
  { key: "예정", label: "예정 콘테스트" },
  { key: "종료", label: "종료 콘테스트" },
];

const PET_FALLBACK = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=720&h=450&fit=crop",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=720&h=450&fit=crop",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=720&h=450&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=720&h=450&fit=crop",
];

function fallbackPetImage(id) {
  return PET_FALLBACK[Math.abs(Number(id) || 0) % PET_FALLBACK.length];
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toContestStatus(contest) {
  if (contest?.ongoing) return "진행 중";
  if (contest?.ended) return "종료";
  if (contest?.upcoming) return "예정";
  const now = Date.now();
  const start = parseDate(contest?.startAt)?.getTime();
  const end = parseDate(contest?.endAt)?.getTime();
  if (start && now < start) return "예정";
  if (end && now > end) return "종료";
  return "진행 중";
}

function statusClassName(status) {
  if (status === "진행 중") return "vt-selector-status-live";
  if (status === "예정") return "vt-selector-status-wait";
  return "vt-selector-status-end";
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCandidateRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
}

function toCandidateName(row) {
  if (row?.petName) return row.petName;
  if (row?.ticketNo) return `참가자 ${row.ticketNo}`;
  return `참가자 #${row?.programApplyId ?? "?"}`;
}

function formatCount(value) {
  return toNumber(value).toLocaleString("ko-KR");
}

function formatPct(value) {
  if (!Number.isFinite(value)) return "0%";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function buildContestItems(candidateRows, voteRows, totalVotesFromApi) {
  const candidateMap = new Map(
    candidateRows.map((row) => [
      Number(row?.programApplyId),
      {
        applyId: Number(row?.programApplyId),
        name: toCandidateName(row),
        imageUrl: row?.imageUrl || null,
        ownerNickname:
          row?.ownerNickname ||
          (row?.userId ? `보호자 #${row.userId}` : "보호자 정보 없음"),
      },
    ]),
  );

  const voteMap = new Map(
    (Array.isArray(voteRows) ? voteRows : []).map((row) => [
      Number(row?.programApplyId),
      toNumber(row?.voteCount),
    ]),
  );

  const mergedIds = new Set([...candidateMap.keys(), ...voteMap.keys()]);
  const merged = Array.from(mergedIds).map((applyId) => {
    const candidate = candidateMap.get(applyId);
    return {
      applyId,
      name: candidate?.name || `참가자 #${applyId}`,
      imageUrl: candidate?.imageUrl || null,
      ownerNickname: candidate?.ownerNickname || "보호자 정보 없음",
      votes: voteMap.get(applyId) ?? 0,
    };
  });

  merged.sort((a, b) => {
    const diff = b.votes - a.votes;
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name, "ko");
  });

  const leaderVotes = merged[0]?.votes ?? 0;
  const totalVotes = Number.isFinite(totalVotesFromApi) && totalVotesFromApi > 0
    ? totalVotesFromApi
    : merged.reduce((sum, item) => sum + item.votes, 0);

  const items = merged.map((item, index) => ({
    ...item,
    rank: index + 1,
    pct: totalVotes > 0 ? (item.votes / totalVotes) * 100 : 0,
    gapFromLeader: Math.max(0, leaderVotes - item.votes),
    gapFromPrevious:
      index === 0 ? 0 : Math.max(0, merged[index - 1].votes - item.votes),
  }));

  return { totalVotes, items };
}

function VoteContent({ eventId, onNavigate }) {
  const [contests, setContests] = useState([]);
  const [activeContestKey, setActiveContestKey] = useState(null);
  const [contestStatusFilter, setContestStatusFilter] = useState("진행 중");
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [eventStatus, setEventStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const loadedRef = useRef(false);
  const activeKeyRef = useRef(null);
  const candidateCacheRef = useRef(new Map());
  const [manualRefreshSeed, setManualRefreshSeed] = useState(0);
  const { tick, lastUpdated } = useAutoRefresh(5000);
  const { spinning, refresh } = useRefresh(
    () => setManualRefreshSeed((value) => value + 1),
    850,
  );

  useEffect(() => {
    setContests([]);
    setActiveContestKey(null);
    setContestStatusFilter("진행 중");
    setSelectedCandidateId(null);
    setShowAllCandidates(false);
    setEventStatus("");
    setLoading(true);
    setErrorMsg("");
    loadedRef.current = false;
    activeKeyRef.current = null;
    candidateCacheRef.current = new Map();
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;
    const fetchVoteBoard = async () => {
      if (!eventId) {
        if (!cancelled) {
          setContests([]);
          setLoading(false);
        }
        return;
      }

      const firstLoad = !loadedRef.current;
      if (firstLoad) setLoading(true);
      setErrorMsg("");

      try {
        try {
          const eventResponse = await eventApi.getEventDetail(Number(eventId));
          const resolvedStatus = String(
            eventResponse?.data?.data?.status ?? eventResponse?.data?.status ?? "",
          ).toUpperCase();
          if (!cancelled && resolvedStatus) {
            setEventStatus(resolvedStatus);
          }
        } catch {
          if (!cancelled) setEventStatus("");
        }

        const programs = await programApi.getAllProgramsByEvent({
          eventId: Number(eventId),
          category: "CONTEST",
          sort: "startAt,asc",
        });

        const programRows = Array.isArray(programs) ? programs : [];
        const votePayloadMap = new Map();

        const voteResults = await Promise.allSettled(
          programRows.map((program) => {
            const programId = Number(program?.programId);
            if (!Number.isFinite(programId)) return Promise.resolve(null);
            return programApi.getContestVoteResult(programId);
          }),
        );

        const mapped = programRows.map((program, index) => {
          const programId = Number(program?.programId);
          const voteResult = voteResults[index];
          const votePayload =
            voteResult?.status === "fulfilled"
              ? voteResult.value?.data?.data ?? voteResult.value?.data ?? {}
              : {};
          votePayloadMap.set(programId, votePayload);

          const candidateRows = candidateCacheRef.current.get(programId) ?? [];
          const voteRows = Array.isArray(votePayload?.results) ? votePayload.results : [];
          const { totalVotes, items } = buildContestItems(
            candidateRows,
            voteRows,
            toNumber(votePayload?.totalVotes),
          );

          return {
            key: `contest-${programId}`,
            programId,
            title: program?.programTitle || `콘테스트 #${programId}`,
            status: toContestStatus(program),
            totalVotes,
            participantCount: items.length,
            items,
          };
        });

        if (cancelled) return;
        setContests(mapped);
        setActiveContestKey((prev) => {
          if (prev && mapped.some((contest) => contest.key === prev)) {
            return prev;
          }
          return mapped[0]?.key ?? null;
        });
        loadedRef.current = true;

        const missingCandidatePrograms = programRows.filter((program) => {
          const programId = Number(program?.programId);
          return Number.isFinite(programId) && !candidateCacheRef.current.has(programId);
        });

        if (missingCandidatePrograms.length > 0) {
          const candidateResults = await Promise.allSettled(
            missingCandidatePrograms.map((program) =>
              programApi.getCandidates(Number(program?.programId), { page: 0, size: 200 }),
            ),
          );

          let candidateCacheUpdated = false;
          missingCandidatePrograms.forEach((program, index) => {
            const result = candidateResults[index];
            if (result?.status !== "fulfilled") return;
            const payload = result.value?.data?.data ?? result.value?.data ?? {};
            const candidateRows = toCandidateRows(payload);
            candidateCacheRef.current.set(Number(program?.programId), candidateRows);
            candidateCacheUpdated = true;
          });

          if (!cancelled && candidateCacheUpdated) {
            const enriched = programRows.map((program) => {
              const programId = Number(program?.programId);
              const votePayload = votePayloadMap.get(programId) ?? {};
              const candidateRows = candidateCacheRef.current.get(programId) ?? [];
              const voteRows = Array.isArray(votePayload?.results) ? votePayload.results : [];
              const { totalVotes, items } = buildContestItems(
                candidateRows,
                voteRows,
                toNumber(votePayload?.totalVotes),
              );

              return {
                key: `contest-${programId}`,
                programId,
                title: program?.programTitle || `콘테스트 #${programId}`,
                status: toContestStatus(program),
                totalVotes,
                participantCount: items.length,
                items,
              };
            });
            setContests(enriched);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMsg(
            error?.response?.data?.message ||
              "투표 데이터를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled && firstLoad) setLoading(false);
      }
    };

    fetchVoteBoard();
    return () => {
      cancelled = true;
    };
  }, [eventId, tick, manualRefreshSeed]);

  const filteredContests = useMemo(
    () => contests.filter((contest) => contest.status === contestStatusFilter),
    [contests, contestStatusFilter],
  );
  const canNavigateToVotePage =
    contestStatusFilter === "진행 중" && filteredContests.length > 0;

  useEffect(() => {
    setActiveContestKey((prev) => {
      if (prev && filteredContests.some((contest) => contest.key === prev)) {
        return prev;
      }
      return filteredContests[0]?.key ?? null;
    });
  }, [filteredContests]);

  const activeContest = useMemo(
    () => filteredContests.find((contest) => contest.key === activeContestKey) || null,
    [filteredContests, activeContestKey],
  );

  useEffect(() => {
    if (!activeContest) {
      setSelectedCandidateId(null);
      activeKeyRef.current = null;
      return;
    }

    const changed = activeKeyRef.current !== activeContest.key;
    activeKeyRef.current = activeContest.key;

    if (changed) {
      setSelectedCandidateId(activeContest.items?.[0]?.applyId ?? null);
      setShowAllCandidates(false);
      return;
    }

    setSelectedCandidateId((prev) => {
      if (prev && activeContest.items.some((item) => item.applyId === prev)) {
        return prev;
      }
      return activeContest.items?.[0]?.applyId ?? null;
    });
  }, [activeContest]);

  const selectedCandidate = useMemo(() => {
    if (!activeContest) return null;
    return (
      activeContest.items.find((item) => item.applyId === selectedCandidateId) ||
      activeContest.items[0] ||
      null
    );
  }, [activeContest, selectedCandidateId]);

  const visibleCandidates = useMemo(() => {
    if (!activeContest?.items) return [];
    return showAllCandidates ? activeContest.items : activeContest.items.slice(0, 5);
  }, [activeContest, showAllCandidates]);

  const hasMoreThanFive = (activeContest?.items?.length ?? 0) > 5;
  const maxVotes = activeContest?.items?.[0]?.votes ?? 0;

  const summaryByStatus = useMemo(() => {
    return contests.reduce((acc, contest) => {
      const key = contest.status;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [contests]);
  const statusBadge = useMemo(() => {
    if (eventStatus === "PLANNED" || eventStatus === "PENDING" || eventStatus === "UPCOMING") {
      return { className: "planned", label: "예정", showDot: false };
    }
    if (eventStatus === "ENDED") {
      return { className: "ended", label: "종료", showDot: false };
    }
    if (eventStatus === "CANCELLED") {
      return { className: "cancelled", label: "취소", showDot: false };
    }
    return { className: "", label: "LIVE", showDot: true };
  }, [eventStatus]);

  if (loading && contests.length === 0) {
    return <div className="vt-state-card">실시간 투표 현황을 불러오는 중입니다.</div>;
  }

  if (!loading && contests.length === 0) {
    return <div className="vt-state-card">표시할 콘테스트가 없습니다.</div>;
  }

  return (
    <>
      {errorMsg ? <div className="vt-inline-banner">{errorMsg}</div> : null}

      <section className="vt-live-header">
        <div className="vt-live-header-left">
          <span
            className={`vt-live-badge ${statusBadge.className}`.trim()}
            style={{ lineHeight: 1, whiteSpace: "nowrap" }}
          >
            <span
              className={`vt-live-dot${statusBadge.showDot ? "" : " placeholder"}`}
            />
            {statusBadge.label}
          </span>
        </div>
        <div className="vt-live-header-right">
          <span
            className="vt-live-time"
            style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}
          >
            마지막 갱신 {lastUpdated}
          </span>
          <button className="vt-refresh-btn" onClick={refresh} aria-label="새로고침">
            <RefreshCw
              size={15}
              style={{
                animation: spinning
                  ? "anim-spin 0.8s cubic-bezier(0.4,0,0.2,1)"
                  : "none",
              }}
            />
          </button>
        </div>
      </section>

      <section className="vt-card vt-selector-wrap">
        <header className="vt-card-header">
          <div className="vt-selector-head-left">
            <h2 className="vt-card-title">
              <span className="vt-card-title-icon">
                <Trophy size={14} />
              </span>
              콘테스트 선택
            </h2>
            <div className="vt-selector-status-filters">
              {CONTEST_STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`vt-selector-status-btn${contestStatusFilter === filter.key ? " active" : ""}`}
                  onClick={() => setContestStatusFilter(filter.key)}
                >
                  {filter.key} : {formatCount(summaryByStatus[filter.key] ?? 0)}건
                </button>
              ))}
            </div>
          </div>
          {canNavigateToVotePage ? (
            <button
              className="vt-selector-link"
              onClick={() => onNavigate("/program/contest")}
            >
              투표참여 페이지로 이동
            </button>
          ) : null}
        </header>
        <div className="vt-selector-list">
          {filteredContests.length > 0 ? (
            filteredContests.map((contest) => (
              <button
                key={contest.key}
                className={`vt-selector-item${activeContestKey === contest.key ? " active" : ""}`}
                onClick={() => setActiveContestKey(contest.key)}
              >
                <div className="vt-selector-top">
                  <p className="vt-selector-name">{contest.title}</p>
                  <span className={`vt-selector-status ${statusClassName(contest.status)}`}>
                    {contest.status}
                  </span>
                </div>
                <p className="vt-selector-votes">총 {formatCount(contest.totalVotes)}표</p>
              </button>
            ))
          ) : (
            <div className="vt-selector-empty">{contestStatusFilter} 상태의 콘테스트가 없습니다.</div>
          )}
        </div>
      </section>

      <section className="vt-main-grid">
        <article className="vt-card">
          <header className="vt-card-header">
            <h2 className="vt-card-title">
              <span className="vt-card-title-icon">
                <Medal size={14} />
              </span>
              후보 순위
            </h2>
            <span className="vt-card-tag">득표 기준</span>
          </header>
          {activeContest ? (
            <>
              <p className="vt-ranking-title">{activeContest.title}</p>
              <p className="vt-ranking-meta">
                총 {formatCount(activeContest.totalVotes)}표 · 참여 후보 {formatCount(activeContest.participantCount)}팀
              </p>
              {activeContest.items.length > 0 ? (
                <div className="vt-ranking-list">
                  {visibleCandidates.map((candidate) => {
                    const width = maxVotes > 0 ? (candidate.votes / maxVotes) * 100 : 0;
                    return (
                      <button
                        key={`${candidate.applyId}-${candidate.rank}`}
                        className={`vt-ranking-row rank-${candidate.rank}${selectedCandidate?.applyId === candidate.applyId ? " selected" : ""}`}
                        onClick={() => setSelectedCandidateId(candidate.applyId)}
                      >
                        <span className="vt-ranking-rank">{candidate.rank}</span>
                        <div className="vt-ranking-main">
                          <div className="vt-ranking-line">
                            <p className="vt-ranking-name">{candidate.name}</p>
                            <span className="vt-ranking-votes">
                              <strong>{formatCount(candidate.votes)}표</strong>
                              {formatPct(candidate.pct)}
                            </span>
                          </div>
                          <div className="vt-ranking-track">
                            <div className="vt-ranking-fill" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="vt-state-card">집계된 후보 데이터가 없습니다.</div>
              )}
              {hasMoreThanFive ? (
                <button
                  className="vt-ranking-toggle"
                  onClick={() => setShowAllCandidates((prev) => !prev)}
                >
                  {showAllCandidates ? "상위 5명만 보기" : "전체 후보 보기"}
                </button>
              ) : null}
            </>
          ) : (
            <div className="vt-state-card">콘테스트를 선택하면 순위가 표시됩니다.</div>
          )}
        </article>

        <aside className="vt-card">
          <header className="vt-card-header">
            <h2 className="vt-card-title">
              <span className="vt-card-title-icon">
                <Trophy size={14} />
              </span>
              후보 상세
            </h2>
          </header>
          {selectedCandidate ? (
            <>
              <div className="vt-detail-head">
                <div className="vt-detail-name-group">
                  <p className="vt-detail-name">{selectedCandidate.name}</p>
                  <p className="vt-detail-owner-inline">{selectedCandidate.ownerNickname}</p>
                </div>
                <span className="vt-card-tag vt-detail-rank-badge vt-detail-rank-badge-inline">
                  현재 {selectedCandidate.rank}위
                </span>
              </div>
              <div className="vt-detail-media">
                {selectedCandidate.imageUrl ? (
                  <img
                    src={resolveImageUrl(
                      selectedCandidate.imageUrl,
                      fallbackPetImage(selectedCandidate.applyId),
                    )}
                    alt={selectedCandidate.name}
                    onError={createImageFallbackHandler(
                      fallbackPetImage(selectedCandidate.applyId),
                    )}
                  />
                ) : (
                  <div className="vt-detail-placeholder">후보 이미지가 없습니다</div>
                )}
              </div>
              <div className="vt-detail-metrics">
                <div className="vt-detail-metric">
                  <p className="vt-detail-metric-label">득표수</p>
                  <p className="vt-detail-metric-value">{formatCount(selectedCandidate.votes)}표</p>
                </div>
                <div className="vt-detail-metric">
                  <p className="vt-detail-metric-label">점유율</p>
                  <p className="vt-detail-metric-value">{formatPct(selectedCandidate.pct)}</p>
                </div>
                <div className="vt-detail-metric">
                  <p className="vt-detail-metric-label">
                    {selectedCandidate.rank === 1 ? "선두 상태" : "선두와 차이"}
                  </p>
                  <p className="vt-detail-metric-value">
                    {selectedCandidate.rank === 1
                      ? "현재 선두"
                      : `${formatCount(selectedCandidate.gapFromLeader)}표`}
                  </p>
                </div>
                <div className="vt-detail-metric">
                  <p className="vt-detail-metric-label">
                    {selectedCandidate.rank <= 1 ? "직전 순위와 차이" : "바로 위 순위와 차이"}
                  </p>
                  <p className="vt-detail-metric-value">
                    {selectedCandidate.rank <= 1
                      ? "없음"
                      : `${formatCount(selectedCandidate.gapFromPrevious)}표`}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="vt-state-card">후보 정보가 없습니다.</div>
          )}
        </aside>
      </section>
    </>
  );
}

export default function VoteStatus({ onNavigate: onNavigateProp }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const currentPath = "/realtime/votestatus";

  const handleSelectEvent = useCallback(
    (selectedEventId) => {
      navigate(`/realtime/votestatus/${selectedEventId}`);
    },
    [navigate],
  );

  const handleNavigate = useCallback(
    (path) => {
      if (!eventId) {
        navigate(path);
        onNavigateProp?.(path);
        return;
      }

      const match = String(path || "").match(/^([^?#]*)(.*)$/);
      const pathname = (match?.[1] || "").replace(/\/+$/, "");
      const suffix = match?.[2] || "";
      const lastSegment = pathname.split("/").filter(Boolean).at(-1);

      if (lastSegment && /^\d+$/.test(lastSegment)) {
        navigate(`${pathname}${suffix}`);
        onNavigateProp?.(path);
        return;
      }

      navigate(`${pathname}/${eventId}${suffix}`);
      onNavigateProp?.(path);
    },
    [eventId, navigate, onNavigateProp],
  );

  return (
    <div className="vt-root">
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
      <main className={`vt-container${eventId ? " with-event" : " selector-mode"}`}>
        <div className="vt-page-shell">
          {eventId ? (
            <VoteContent eventId={eventId} onNavigate={handleNavigate} />
          ) : (
            <RealtimeEventSelector
              onSelectEvent={handleSelectEvent}
              pageTitle="투표 현황"
              programCategory="CONTEST"
            />
          )}
        </div>
      </main>
    </div>
  );
}
