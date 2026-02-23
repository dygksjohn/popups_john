import { useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  Vote,
  Trophy,
  Users,
  ChevronUp,
  CheckCircle2,
  BarChart2,
  PieChart,
} from "lucide-react";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .vt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .vt-root *, .vt-root *::before, .vt-root *::after { box-sizing: border-box; font-family: inherit; }
  .vt-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .rt-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 20px;
  }
  .rt-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
    animation: vt-pulse 1.4s ease-in-out infinite;
  }
  @keyframes vt-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  /* Stat row */
  .vt-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
  .vt-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 22px 24px; display: flex; align-items: center; gap: 14px;
  }
  .vt-stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .vt-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
  .vt-stat-value { font-size: 22px; font-weight: 800; color: #111827; }

  /* Card */
  .vt-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .vt-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5; }
  .vt-card-title { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 8px; margin: 0; }
  .vt-card-title-icon { width: 24px; height: 24px; border-radius: 6px; background: #f5f3ff; display: flex; align-items: center; justify-content: center; }
  .vt-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  /* Vote tabs */
  .vt-tabs { display: flex; gap: 6px; margin-bottom: 20px; }
  .vt-tab {
    padding: 7px 16px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff;
    font-size: 13px; font-weight: 500; color: #6b7280; cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .vt-tab.active { border-color: #8b5cf6; background: #f5f3ff; color: #7c3aed; font-weight: 600; }
  .vt-tab:hover:not(.active) { border-color: #c4b5fd; color: #7c3aed; }
  .vt-tab-badge {
    display: inline-block; padding: 1px 7px; border-radius: 100px;
    font-size: 10px; font-weight: 700; background: #ede9fe; color: #7c3aed; margin-left: 5px;
  }
  .vt-tab.active .vt-tab-badge { background: #7c3aed; color: #fff; }

  /* Vote item */
  .vt-vote-list { display: flex; flex-direction: column; gap: 12px; }
  .vt-vote-item {
    border: 1.5px solid #e9ecef; border-radius: 11px; padding: 18px 20px;
    transition: border-color 0.15s;
  }
  .vt-vote-item.leading { border-color: #c4b5fd; background: #faf9ff; }
  .vt-vote-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .vt-vote-rank {
    width: 28px; height: 28px; border-radius: 8px; background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800; color: #6b7280; flex-shrink: 0;
  }
  .vt-vote-rank.first { background: #fef3c7; color: #d97706; }
  .vt-vote-rank.second { background: #f1f5f9; color: #64748b; }
  .vt-vote-rank.third { background: #fff7ed; color: #c2410c; }
  .vt-vote-name { font-size: 14px; font-weight: 700; color: #111827; flex: 1; }
  .vt-vote-count { font-size: 13px; font-weight: 600; color: #7c3aed; display: flex; align-items: center; gap: 4px; }
  .vt-vote-pct { font-size: 13px; font-weight: 700; color: #374151; min-width: 36px; text-align: right; }
  .vt-bar-track { height: 8px; background: #f1f3f5; border-radius: 100px; overflow: hidden; }
  .vt-bar-fill { height: 100%; border-radius: 100px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }

  /* Two col */
  .vt-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  /* Opinion items */
  .vt-opinion-list { display: flex; flex-direction: column; gap: 8px; }
  .vt-opinion-item {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 16px; border-radius: 9px; border: 1px solid #e9ecef;
  }
  .vt-opinion-bar-wrap { flex: 1; }
  .vt-opinion-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 5px; }
  .vt-opinion-track { height: 6px; background: #f1f3f5; border-radius: 100px; overflow: hidden; }
  .vt-opinion-fill { height: 100%; border-radius: 100px; }
  .vt-opinion-val { font-size: 14px; font-weight: 800; color: #111827; min-width: 36px; text-align: right; }

  /* History */
  .vt-history-list { display: flex; flex-direction: column; gap: 0; }
  .vt-history-item {
    display: flex; align-items: center; gap: 12px; padding: 11px 0;
    border-bottom: 1px solid #f9fafb; font-size: 13px;
  }
  .vt-history-item:last-child { border-bottom: none; }
  .vt-history-dot { width: 7px; height: 7px; border-radius: 50%; background: #8b5cf6; flex-shrink: 0; }
  .vt-history-time { font-size: 11.5px; color: #9ca3af; min-width: 44px; }
  .vt-history-name { color: #374151; }
  .vt-history-choice { font-weight: 600; color: #7c3aed; }

  @media (max-width: 900px) {
    .vt-stat-grid { grid-template-columns: 1fr 1fr 1fr; }
    .vt-two-col { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .vt-container { padding: 20px 16px 48px; }
    .vt-stat-grid { grid-template-columns: 1fr 1fr; }
  }
`;

export const SERVICE_CATEGORIES = [
  { label: "대시보드", path: "/realtime/dashboard" },
  { label: "체크인 현황", path: "/realtime/checkinstatus" },
  { label: "투표 현황", path: "/realtime/votestatus" },
  { label: "대기 현황", path: "/realtime/waitingstatus" },
];

export const SUBTITLE_MAP = {
  "/realtime/dashboard": "행사 전체 현황을 실시간으로 모니터링합니다",
  "/realtime/checkinstatus": "참가자 체크인 현황을 실시간으로 확인합니다",
  "/realtime/votestatus": "진행 중인 투표의 실시간 결과를 확인합니다",
  "/realtime/waitingstatus": "대기열 현황을 실시간으로 확인합니다",
};

const VOTES = {
  best: {
    title: "올해의 반려견상",
    total: 512,
    status: "진행 중",
    items: [
      { name: "코코 (골든 리트리버)", votes: 184, color: "#8b5cf6" },
      { name: "초코 (말티즈)", votes: 147, color: "#a78bfa" },
      { name: "두부 (포메라니안)", votes: 98, color: "#c4b5fd" },
      { name: "하루 (시바이누)", votes: 53, color: "#ddd6fe" },
      { name: "별이 (비숑)", votes: 30, color: "#ede9fe" },
    ],
  },
  satisfaction: {
    title: "행사 만족도 조사",
    total: 389,
    status: "진행 중",
    items: [
      { name: "매우 만족", votes: 212, color: "#10b981" },
      { name: "만족", votes: 118, color: "#34d399" },
      { name: "보통", votes: 41, color: "#fbbf24" },
      { name: "불만족", votes: 18, color: "#f87171" },
    ],
  },
};

const RECENT_VOTES = [
  { time: "14:31", name: "홍*동", choice: "코코 (골든 리트리버)" },
  { time: "14:30", name: "이*연", choice: "초코 (말티즈)" },
  { time: "14:29", name: "김*수", choice: "두부 (포메라니안)" },
  { time: "14:27", name: "박*희", choice: "코코 (골든 리트리버)" },
  { time: "14:26", name: "최*혁", choice: "하루 (시바이누)" },
  { time: "14:24", name: "정*아", choice: "코코 (골든 리트리버)" },
];

const OPINION_DATA = [
  { label: "프로그램 구성", pct: 88, color: "#8b5cf6" },
  { label: "부스 운영", pct: 75, color: "#1a4fd6" },
  { label: "음식/간식", pct: 92, color: "#10b981" },
  { label: "시설 환경", pct: 68, color: "#f59e0b" },
  { label: "전반적 만족", pct: 84, color: "#ef4444" },
];

function VoteContent() {
  const [activeVote, setActiveVote] = useState("best");
  const data = VOTES[activeVote];
  const maxVotes = data.items[0].votes;

  return (
    <>
      <div className="rt-live-badge">
        <div className="rt-live-dot" />
        LIVE
      </div>

      {/* Stats */}
      <div className="vt-stat-grid">
        {[
          {
            label: "총 투표 참여",
            value: "512명",
            icon: <Vote size={20} color="#8b5cf6" />,
            bg: "#f5f3ff",
          },
          {
            label: "진행 중 투표",
            value: "2건",
            icon: <BarChart2 size={20} color="#1a4fd6" />,
            bg: "#eff4ff",
          },
          {
            label: "완료된 투표",
            value: "1건",
            icon: <CheckCircle2 size={20} color="#10b981" />,
            bg: "#ecfdf5",
          },
        ].map((s) => (
          <div key={s.label} className="vt-stat-card">
            <div className="vt-stat-icon" style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div>
              <div className="vt-stat-label">{s.label}</div>
              <div className="vt-stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Vote tabs */}
      <div className="vt-tabs">
        {Object.entries(VOTES).map(([key, v]) => (
          <button
            key={key}
            className={`vt-tab${activeVote === key ? " active" : ""}`}
            onClick={() => setActiveVote(key)}
          >
            {v.title}
            <span className="vt-tab-badge">{v.status}</span>
          </button>
        ))}
      </div>

      <div className="vt-two-col">
        {/* Vote results */}
        <div className="vt-card">
          <div className="vt-card-header">
            <div className="vt-card-title">
              <div className="vt-card-title-icon">
                <Trophy size={14} color="#7c3aed" />
              </div>
              {data.title}
            </div>
            <span className="vt-card-tag">
              총 {data.total.toLocaleString()}표
            </span>
          </div>
          <div className="vt-vote-list">
            {data.items.map((item, i) => {
              const pct = Math.round((item.votes / data.total) * 100);
              return (
                <div
                  key={item.name}
                  className={`vt-vote-item${i === 0 ? " leading" : ""}`}
                >
                  <div className="vt-vote-header">
                    <div
                      className={`vt-vote-rank${i === 0 ? " first" : i === 1 ? " second" : i === 2 ? " third" : ""}`}
                    >
                      {i + 1}
                    </div>
                    <span className="vt-vote-name">{item.name}</span>
                    <span className="vt-vote-count">
                      {i === 0 && <ChevronUp size={13} />}
                      {item.votes.toLocaleString()}표
                    </span>
                    <span className="vt-vote-pct">{pct}%</span>
                  </div>
                  <div className="vt-bar-track">
                    <div
                      className="vt-bar-fill"
                      style={{
                        width: `${(item.votes / maxVotes) * 100}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Opinion */}
          <div className="vt-card">
            <div className="vt-card-header">
              <div className="vt-card-title">
                <div className="vt-card-title-icon">
                  <PieChart size={14} color="#7c3aed" />
                </div>
                항목별 만족도
              </div>
              <span className="vt-card-tag">평균 점수</span>
            </div>
            <div className="vt-opinion-list">
              {OPINION_DATA.map((o) => (
                <div key={o.label} className="vt-opinion-item">
                  <div className="vt-opinion-bar-wrap">
                    <div className="vt-opinion-label">{o.label}</div>
                    <div className="vt-opinion-track">
                      <div
                        className="vt-opinion-fill"
                        style={{ width: `${o.pct}%`, background: o.color }}
                      />
                    </div>
                  </div>
                  <span className="vt-opinion-val">{o.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent votes */}
          <div className="vt-card">
            <div className="vt-card-header">
              <div className="vt-card-title">
                <div className="vt-card-title-icon">
                  <Users size={14} color="#7c3aed" />
                </div>
                최근 투표 현황
              </div>
            </div>
            <div className="vt-history-list">
              {RECENT_VOTES.map((v, i) => (
                <div key={i} className="vt-history-item">
                  <div className="vt-history-dot" />
                  <span className="vt-history-time">{v.time}</span>
                  <span className="vt-history-name">{v.name}님이</span>
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

export default function VoteStatus() {
  const [currentPath, setCurrentPath] = useState("/realtime/vote");

  return (
    <div className="vt-root">
      <style>{styles}</style>
      <PageHeader
        title="실시간 현황"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />
      <main className="vt-container">
        <VoteContent />
      </main>
    </div>
  );
}
