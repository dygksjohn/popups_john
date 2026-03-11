import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import RealtimeEventSelector from "./RealtimeEventSelector";
import {
  Vote,
  Trophy,
  Users,
  ChevronUp,
  CheckCircle2,
  BarChart2,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";
import { programApi } from "../../../app/http/programApi";
import {
  useCountUp,
  useRefresh,
  useStaggerIn,
  useAutoRefresh,
  SHARED_ANIM_STYLES,
} from "./useRealtimeAnimations";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .vt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f6f7fb;
    min-height: 100vh;
  }
  .vt-root *, .vt-root *::before, .vt-root *::after { box-sizing: border-box; font-family: inherit; }
  .vt-container { max-width: 1400px; margin: 0 auto; padding: 32px 25px 64px; }
  .vt-container.selector-mode { padding-top: 104px; }

  .rt-live-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; background: #fff0f0; border: 1px solid #fecaca; border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444; letter-spacing: 0.5px; }
  .rt-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #ef4444; animation: vt-pulse 1.4s ease-in-out infinite; }
  @keyframes vt-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }

  .vt-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .vt-stat-card { background: #fff; border: 1px solid #eceef3; border-radius: 14px; padding: 22px 24px; display: flex; align-items: center; gap: 14px; transition: transform 0.2s, box-shadow 0.2s; }
  .vt-stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
  .vt-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .vt-stat-label { font-size: 12px; color: #868e9c; font-weight: 500; margin-bottom: 2px; }
  .vt-stat-value { font-size: 22px; font-weight: 800; color: #1a1d24; letter-spacing: -0.5px; }

  .vt-card { background: #fff; border: 1px solid #eceef3; border-radius: 14px; padding: 22px 24px; margin-bottom: 0; }
  .vt-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f6; }
  .vt-card-title { font-size: 15px; font-weight: 700; color: #1a1d24; display: flex; align-items: center; gap: 8px; margin: 0; }
  .vt-card-title-icon { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; }
  .vt-card-tag { font-size: 11px; font-weight: 600; color: #868e9c; background: #f3f4f7; padding: 4px 10px; border-radius: 100px; }

  .vt-tabs { display: flex; gap: 6px; margin-bottom: 20px; }
  .vt-tab { padding: 8px 18px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; font-size: 13px; font-weight: 500; color: #6b7280; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .vt-tab.active { border-color: #8b5cf6; background: #f5f0ff; color: #7c3aed; font-weight: 700; }
  .vt-tab:hover:not(.active) { border-color: #c4b5fd; color: #7c3aed; }
  .vt-tab-badge { display: inline-block; padding: 2px 8px; border-radius: 100px; font-size: 10px; font-weight: 700; background: #ede9fe; color: #7c3aed; margin-left: 6px; }
  .vt-tab.active .vt-tab-badge { background: #7c3aed; color: #fff; }

  .vt-vote-list { display: flex; flex-direction: column; gap: 10px; }
  .vt-vote-item { border: 1.5px solid #eceef3; border-radius: 12px; padding: 16px 18px; transition: all 0.15s; }
  .vt-vote-item.leading { border-color: #c4b5fd; background: #faf8ff; }
  .vt-vote-item.clickable { cursor: pointer; }
  .vt-vote-item.selected { border-color: #7c3aed; box-shadow: 0 0 0 2px rgba(124,58,237,0.1); }
  .vt-vote-item.clickable:hover { border-color: #c4b5fd; transform: translateY(-1px); }
  .vt-vote-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .vt-vote-rank { width: 28px; height: 28px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #6b7280; flex-shrink: 0; }
  .vt-vote-rank.first { background: #fef3c7; color: #d97706; }
  .vt-vote-rank.second { background: #f1f5f9; color: #64748b; }
  .vt-vote-rank.third { background: #fff7ed; color: #c2410c; }
  .vt-vote-name { font-size: 14px; font-weight: 700; color: #1a1d24; flex: 1; }
  .vt-vote-count { font-size: 13px; font-weight: 600; color: #7c3aed; display: flex; align-items: center; gap: 4px; }
  .vt-vote-pct { font-size: 13px; font-weight: 700; color: #374151; min-width: 36px; text-align: right; }
  .vt-bar-track { height: 7px; background: #f1f3f6; border-radius: 100px; overflow: hidden; }
  .vt-bar-fill { height: 100%; border-radius: 100px; }

  .vt-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .vt-history-list { display: flex; flex-direction: column; gap: 0; }
  .vt-history-item { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid #f9fafb; font-size: 13px; }
  .vt-history-item:last-child { border-bottom: none; }
  .vt-history-dot { width: 7px; height: 7px; border-radius: 50%; background: #8b5cf6; flex-shrink: 0; }
  .vt-history-time { font-size: 11.5px; color: #9ca3af; min-width: 44px; }
  .vt-history-name { color: #374151; }
  .vt-history-choice { font-weight: 600; color: #7c3aed; }

  .vt-pet-card { padding: 16px; border: 1px solid #eceef3; border-radius: 12px; background: #fff; }
  .vt-pet-media { width: 100%; aspect-ratio: 16 / 10; border-radius: 12px; overflow: hidden; border: 1px solid #eceef3; background: #f9fafb; margin-bottom: 12px; }
  .vt-pet-head { display: block; }
  .vt-pet-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
  .vt-pet-name { font-size: 16px; font-weight: 800; color: #111827; line-height: 1.2; }
  .vt-pet-owner { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .vt-pet-chip { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 999px; background: #f5f3ff; color: #6d28d9; font-size: 11px; font-weight: 700; margin-top: 8px; }
  .vt-pet-meta { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .vt-pet-meta-item { border: 1px solid #eceef3; border-radius: 9px; padding: 9px 10px; background: #fcfcfd; }
  .vt-pet-meta-label { font-size: 11px; color: #9ca3af; margin-bottom: 3px; }
  .vt-pet-meta-value { font-size: 13px; font-weight: 700; color: #374151; }

  .vt-live-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .vt-live-header-right { display: flex; align-items: center; gap: 12px; }
  .vt-timestamp { font-size: 12px; color: #9ca3af; font-weight: 500; font-variant-numeric: tabular-nums; }
  .vt-status-banner {
    margin-bottom: 12px; padding: 10px 12px; border-radius: 10px;
    border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c;
    font-size: 12px; font-weight: 600;
  }

  /* CTA to contest page */
  .vt-cta-banner {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(135deg, #f5f0ff 0%, #ede9fe 100%);
    border: 1px solid #ddd6fe; border-radius: 14px;
    padding: 18px 22px; margin-bottom: 20px; cursor: pointer;
    transition: all 0.2s;
  }
  .vt-cta-banner:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,58,237,0.1); }
  .vt-cta-left { display: flex; align-items: center; gap: 12px; }
  .vt-cta-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: #7c3aed; display: flex; align-items: center; justify-content: center;
  }
  .vt-cta-text { font-size: 14px; font-weight: 700; color: #4c1d95; }
  .vt-cta-sub { font-size: 12px; color: #7c3aed; margin-top: 2px; font-weight: 500; }
  .vt-cta-arrow { color: #7c3aed; }

  @media (max-width: 900px) { .vt-stat-grid { grid-template-columns: 1fr 1fr 1fr; } .vt-two-col { grid-template-columns: 1fr; } }
  @media (max-width: 640px) { .vt-container { padding: 20px 16px 48px; } .vt-container.selector-mode { padding-top: 88px; } .vt-stat-grid { grid-template-columns: 1fr 1fr; } }
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
  "/realtime/votestatus": "진행 중인 투표의 실시간 결과를 모니터링합니다",
};

const CANDIDATE_COLORS = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#c084fc"];
const PET_FALLBACK = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop",
];

function fallbackPetImage(id) {
  return PET_FALLBACK[Math.abs(Number(id) || 0) % PET_FALLBACK.length];
}

function toAbsUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
  return `${base}${url}`;
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toContestStatus(item) {
  if (item?.ongoing) return "진행 중";
  if (item?.ended) return "종료";
  if (item?.upcoming) return "예정";
  const now = Date.now();
  const s = parseDate(item?.startAt)?.getTime();
  const e = parseDate(item?.endAt)?.getTime();
  if (s && now < s) return "예정";
  if (e && now > e) return "종료";
  return "진행 중";
}

/* ── Animated stat card ── */
function AnimStatCard({ label, rawValue, suffix, icon, bg, index }) {
  const count = useCountUp(rawValue, 1000, index * 120);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 100 + 50);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <div className={`vt-stat-card anim-pop ${visible ? "visible" : ""}`}>
      <div className="vt-stat-icon" style={{ background: bg }}>
        {icon}
      </div>
      <div>
        <div className="vt-stat-label">{label}</div>
        <div className="vt-stat-value">
          {count}
          {suffix}
        </div>
      </div>
    </div>
  );
}

/* ── Animated vote item ── */
function AnimVoteItem({ item, index, total, maxVotes, isLeading, isSelected, onClick }) {
  const [barWidth, setBarWidth] = useState(0);
  const animVotes = useCountUp(item.votes, 900, index * 100 + 300);
  const pct = total > 0 ? Math.round((item.votes / total) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(
      () => setBarWidth(maxVotes > 0 ? (item.votes / maxVotes) * 100 : 0),
      index * 100 + 400,
    );
    return () => clearTimeout(t);
  }, [item.votes, maxVotes, index]);

  return (
    <div
      className={`vt-vote-item${isLeading ? " leading" : ""}${isSelected ? " selected" : ""}${onClick ? " clickable" : ""}`}
      onClick={onClick}
    >
      <div className="vt-vote-header">
        <div
          className={`vt-vote-rank${index === 0 ? " first" : index === 1 ? " second" : index === 2 ? " third" : ""}`}
        >
          {index + 1}
        </div>
        <span className="vt-vote-name">{item.name}</span>
        <span className="vt-vote-count">
          {index === 0 && <ChevronUp size={13} />}
          {animVotes.toLocaleString()}표
        </span>
        <span className="vt-vote-pct">{pct}%</span>
      </div>
      <div className="vt-bar-track">
        <div
          className="vt-bar-fill anim-progress-fill"
          style={{ width: `${barWidth}%`, background: item.color }}
        />
      </div>
    </div>
  );
}

function VoteContent({ onNavigate, eventId }) {
  const [activeVote, setActiveVote] = useState(null);
  const [contests, setContests] = useState([]);
  const [selectedCandidateByContest, setSelectedCandidateByContest] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const hasLoadedRef = useRef(false);
  const { tick, lastUpdated } = useAutoRefresh(5000);
  const { spinning, refresh } = useRefresh(() => {}, 800);
  const historyVisible = useStaggerIn(6, 80);
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => {
    setFlashKey((k) => k + 1);
  }, [tick]);

  const [tabKey, setTabKey] = useState(0);
  const handleTabSwitch = (key) => {
    setActiveVote(key);
    setTabKey((k) => k + 1);
  };

  useEffect(() => {
    hasLoadedRef.current = false;
    setContests([]);
    setSelectedCandidateByContest({});
    setActiveVote(null);
    setErrorMsg("");
    setLoading(true);
  }, [eventId]);

  useEffect(() => {
    let mounted = true;
    const loadVoteData = async () => {
      if (!eventId) {
        if (mounted) {
          setContests([]);
          setSelectedCandidateByContest({});
          setActiveVote(null);
          hasLoadedRef.current = false;
          setLoading(false);
        }
        return;
      }
      const showInitialLoading = !hasLoadedRef.current;
      if (showInitialLoading) setLoading(true);
      setErrorMsg("");
      try {
        const programs = await programApi.getAllProgramsByEvent({
          eventId: Number(eventId),
          category: "CONTEST",
          sort: "startAt,asc",
        });

        const mapped = await Promise.all(
          (Array.isArray(programs) ? programs : []).map(async (program, pIdx) => {
            const programId = Number(program?.programId);
            const [voteRes, candRes] = await Promise.allSettled([
              programApi.getContestVoteResult(programId),
              programApi.getCandidates(programId, { page: 0, size: 200 }),
            ]);

            const voteData =
              voteRes.status === "fulfilled" ? voteRes.value?.data?.data ?? {} : {};
            const candidateRows =
              candRes.status === "fulfilled"
                ? candRes.value?.data?.data?.content ?? []
                : [];

            const candidateByApplyId = new Map(
              candidateRows.map((row) => {
                const applyId = Number(row?.programApplyId);
                const name =
                  row?.petName || (row?.ticketNo ? `참가자 ${row.ticketNo}` : `참가자 #${row?.programApplyId}`);
                return [
                  applyId,
                  {
                    applyId,
                    petName: name,
                    ownerNickname:
                      row?.ownerNickname || (row?.userId ? `보호자 #${row?.userId}` : "보호자 정보 없음"),
                    imageUrl: row?.imageUrl || null,
                    ticketNo: row?.ticketNo ?? null,
                    userId: row?.userId ?? null,
                  },
                ];
              }),
            );

            const results = Array.isArray(voteData?.results) ? voteData.results : [];
            const sorted = [...results].sort(
              (a, b) => Number(b?.voteCount ?? 0) - Number(a?.voteCount ?? 0),
            );

            const items =
              sorted.length > 0
                ? sorted.map((r, idx) => ({
                    applyId: Number(r?.programApplyId),
                    name:
                      candidateByApplyId.get(Number(r?.programApplyId))?.petName ||
                      `참가자 #${r?.programApplyId}`,
                    pet:
                      candidateByApplyId.get(Number(r?.programApplyId)) || {
                        applyId: Number(r?.programApplyId),
                        petName: `참가자 #${r?.programApplyId}`,
                        ownerNickname: "보호자 정보 없음",
                        imageUrl: null,
                        ticketNo: null,
                        userId: null,
                      },
                    votes: Number(r?.voteCount ?? 0),
                    color: CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length],
                  }))
                : candidateRows.map((row, idx) => ({
                    applyId: Number(row?.programApplyId),
                    name:
                      row?.petName ||
                      (row?.ticketNo ? `참가자 ${row.ticketNo}` : `참가자 #${row?.programApplyId}`),
                    pet:
                      candidateByApplyId.get(Number(row?.programApplyId)) || {
                        applyId: Number(row?.programApplyId),
                        petName:
                          row?.petName ||
                          (row?.ticketNo ? `참가자 ${row.ticketNo}` : `참가자 #${row?.programApplyId}`),
                        ownerNickname: "보호자 정보 없음",
                        imageUrl: null,
                        ticketNo: row?.ticketNo ?? null,
                        userId: row?.userId ?? null,
                      },
                    votes: 0,
                    color: CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length],
                  }));

            return {
              key: `contest-${programId}`,
              title: program?.programTitle || `콘테스트 #${programId}`,
              status: toContestStatus(program),
              total: Number(voteData?.totalVotes ?? 0),
              participantCount: candidateRows.length,
              items,
              order: pIdx,
            };
          }),
        );

        if (!mounted) return;
        setContests(mapped);
        setSelectedCandidateByContest((prev) => {
          const next = {};
          mapped.forEach((contest) => {
            const keepId = prev?.[contest.key];
            if (keepId && contest.items.some((item) => item.applyId === keepId)) {
              next[contest.key] = keepId;
              return;
            }
            next[contest.key] = contest.items?.[0]?.applyId ?? null;
          });
          return next;
        });
        setActiveVote((prev) => {
          if (prev && mapped.some((contest) => contest.key === prev)) {
            return prev;
          }
          return mapped[0]?.key ?? null;
        });
        hasLoadedRef.current = true;
      } catch (e) {
        if (!mounted) return;
        setErrorMsg(e?.response?.data?.message || e?.message || "투표 데이터를 불러오지 못했습니다.");
      } finally {
        if (mounted && showInitialLoading) setLoading(false);
      }
    };
    loadVoteData();
    return () => {
      mounted = false;
    };
  }, [eventId, tick]);

  const data = contests.find((c) => c.key === activeVote) || null;
  const maxVotes = data?.items?.[0]?.votes ?? 0;
  const selectedCandidateId = data?.key ? selectedCandidateByContest?.[data.key] : null;
  const selectedCandidate =
    (data?.items || []).find((item) => item.applyId === selectedCandidateId) ||
    data?.items?.[0] ||
    null;
  const recentVotes = (data?.items || []).slice(0, 6).map((item, idx) => ({
    time: lastUpdated?.split(" ").pop() || "--:--:--",
    name: `집계 ${idx + 1}`,
    choice: item.name,
  }));
  const totalParticipants = contests.reduce((acc, c) => acc + (c.participantCount || 0), 0);
  const activeContestCount = contests.filter((c) => c.status === "진행 중").length;
  const endedContestCount = contests.filter((c) => c.status === "종료").length;

  if (loading && contests.length === 0) return <div className="vt-card-tag">투표 데이터를 불러오는 중...</div>;
  if (!loading && errorMsg && contests.length === 0) return <div className="vt-card-tag">{errorMsg}</div>;
  if (!loading && contests.length === 0) return <div className="vt-card-tag">표시할 콘테스트가 없습니다.</div>;

  return (
    <>
      {errorMsg ? <div className="vt-status-banner">{errorMsg}</div> : null}

      {/* Live header */}
      <div className="vt-live-header">
        <div className="rt-live-badge anim-glow">
          <div className="rt-live-dot" />
          LIVE 모니터링
        </div>
        <div className="vt-live-header-right">
          <span key={flashKey} className="vt-timestamp anim-flash">
            {lastUpdated}
          </span>
          <button
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
              fontFamily: "inherit",
            }}
            onClick={refresh}
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

      {/* CTA: 투표 참여하러 가기 */}
      <div
        className="vt-cta-banner"
        onClick={() => onNavigate?.("/program/contest")}
      >
        <div className="vt-cta-left">
          <div className="vt-cta-icon">
            <Vote size={18} color="#fff" />
          </div>
          <div>
            <div className="vt-cta-text">투표에 참여하고 싶으신가요?</div>
            <div className="vt-cta-sub">
              콘테스트 안내 페이지에서 바로 투표하세요
            </div>
          </div>
        </div>
        <ArrowRight size={18} className="vt-cta-arrow" />
      </div>

      {/* Stats */}
      <div className="vt-stat-grid">
        {[
          {
            label: "총 참여자",
            rawValue: totalParticipants,
            suffix: "명",
            icon: <Vote size={20} color="#8b5cf6" />,
            bg: "#f5f3ff",
          },
          {
            label: "진행 중 투표",
            rawValue: activeContestCount,
            suffix: "건",
            icon: <BarChart2 size={20} color="#4f46e5" />,
            bg: "#eef2ff",
          },
          {
            label: "완료된 투표",
            rawValue: endedContestCount,
            suffix: "건",
            icon: <CheckCircle2 size={20} color="#10b981" />,
            bg: "#ecfdf5",
          },
        ].map((s, i) => (
          <AnimStatCard key={s.label} {...s} index={i} />
        ))}
      </div>

      {/* Tabs */}
      <div className="vt-tabs">
        {contests.map((v) => (
          <button
            key={v.key}
            className={`vt-tab${activeVote === v.key ? " active" : ""}`}
            onClick={() => handleTabSwitch(v.key)}
          >
            {v.title}
            <span className="vt-tab-badge">{v.status}</span>
          </button>
        ))}
      </div>

      <div className="vt-two-col">
        {/* Vote results */}
        <div className="vt-card" key={`vote-${tabKey}`}>
          <div className="vt-card-header">
            <div className="vt-card-title">
              <div
                className="vt-card-title-icon"
                style={{ background: "#f5f0ff" }}
              >
                <Trophy size={14} color="#7c3aed" />
              </div>
              {data.title}
            </div>
            <span className="vt-card-tag">
              총 {data.total.toLocaleString()}표
            </span>
          </div>
          <div className="vt-vote-list">
              {(data?.items || []).map((item, i) => (
                <AnimVoteItem
                  key={`${item.applyId ?? item.name}-${i}`}
                  item={item}
                  index={i}
                  total={data?.total || 1}
                  maxVotes={maxVotes}
                  isLeading={i === 0}
                  isSelected={item.applyId === selectedCandidate?.applyId}
                  onClick={() =>
                    setSelectedCandidateByContest((prev) => ({
                      ...prev,
                      [data.key]: item.applyId,
                    }))
                  }
                />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="vt-card">
            <div className="vt-card-header">
              <div className="vt-card-title">
                <div
                  className="vt-card-title-icon"
                  style={{ background: "#f5f0ff" }}
                >
                  <Users size={14} color="#7c3aed" />
                </div>
                선택 펫 정보
              </div>
              {selectedCandidate ? (
                <span className="vt-card-tag">#{selectedCandidate.applyId}</span>
              ) : null}
            </div>

            {selectedCandidate ? (
              <div className="vt-pet-card">
                <div className="vt-pet-media">
                  <img
                    className="vt-pet-thumb"
                    src={toAbsUrl(selectedCandidate?.pet?.imageUrl) || fallbackPetImage(selectedCandidate.applyId)}
                    alt={selectedCandidate?.pet?.petName || selectedCandidate.name}
                    onError={(e) => {
                      e.currentTarget.src = fallbackPetImage(selectedCandidate.applyId);
                    }}
                  />
                </div>
                <div className="vt-pet-head">
                  <div style={{ minWidth: 0 }}>
                    <div className="vt-pet-name">{selectedCandidate?.pet?.petName || selectedCandidate.name}</div>
                    <div className="vt-pet-owner">{selectedCandidate?.pet?.ownerNickname || "보호자 정보 없음"}</div>
                    <div className="vt-pet-chip">
                      현재 득표 {selectedCandidate.votes.toLocaleString()}표
                    </div>
                  </div>
                </div>
                <div className="vt-pet-meta">
                  <div className="vt-pet-meta-item">
                    <div className="vt-pet-meta-label">후보 번호</div>
                    <div className="vt-pet-meta-value">
                      {selectedCandidate.applyId ?? "-"}
                    </div>
                  </div>
                  <div className="vt-pet-meta-item">
                    <div className="vt-pet-meta-label">티켓 번호</div>
                    <div className="vt-pet-meta-value">
                      {selectedCandidate?.pet?.ticketNo ?? "-"}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="vt-card-tag">선택된 후보가 없습니다.</div>
            )}
          </div>

          {/* Recent votes */}
          <div className="vt-card">
            <div className="vt-card-header">
              <div className="vt-card-title">
                <div
                  className="vt-card-title-icon"
                  style={{ background: "#f5f0ff" }}
                >
                  <Clock size={14} color="#7c3aed" />
                </div>
                최근 투표 로그
              </div>
            </div>
            <div className="vt-history-list">
              {recentVotes.map((v, i) => (
                <div
                  key={i}
                  className={`vt-history-item anim-slide-right ${historyVisible.includes(i) ? "visible" : ""}`}
                >
                  <div className="vt-history-dot" />
                  <span className="vt-history-time">{v.time}</span>
                    <span className="vt-history-name">{v.name}</span>
                  <span className="vt-history-choice">{v.choice}</span>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>선택</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function VoteStatus({ onNavigate: onNavigateProp }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const currentPath = "/realtime/votestatus";

  const handleSelectEvent = (id) => {
    navigate(`/realtime/votestatus/${id}`);
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
    <div className="vt-root">
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
      <main className={`vt-container${eventId ? "" : " selector-mode"}`}>
        {eventId ? (
          <VoteContent onNavigate={handleNavigate} eventId={eventId} />
        ) : (
          <RealtimeEventSelector
            onSelectEvent={handleSelectEvent}
            pageTitle="투표 현황"
            programCategory="CONTEST"
          />
        )}
      </main>
    </div>
  );
}
