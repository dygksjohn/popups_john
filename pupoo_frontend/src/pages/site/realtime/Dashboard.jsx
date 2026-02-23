import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import {
  Users,
  CheckCircle2,
  Vote,
  Clock,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Radio,
} from "lucide-react";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .rt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .rt-root *, .rt-root *::before, .rt-root *::after { box-sizing: border-box; font-family: inherit; }
  .rt-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  /* Live badge */
  .rt-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 20px;
  }
  .rt-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ef4444;
    animation: rt-pulse 1.4s ease-in-out infinite;
  }
  @keyframes rt-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  /* Stat cards */
  .rt-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .rt-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 22px 22px 20px; position: relative; overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .rt-stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
  .rt-stat-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
  }
  .rt-stat-label { font-size: 12.5px; color: #6b7280; font-weight: 500; margin-bottom: 6px; }
  .rt-stat-value { font-size: 26px; font-weight: 800; color: #111827; line-height: 1; }
  .rt-stat-sub { font-size: 12px; color: #9ca3af; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
  .rt-stat-up { color: #10b981; }
  .rt-stat-down { color: #ef4444; }
  .rt-stat-bg {
    position: absolute; right: -10px; bottom: -10px;
    width: 70px; height: 70px; border-radius: 50%; opacity: 0.06;
  }

  /* Card */
  .rt-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .rt-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5;
  }
  .rt-card-title {
    font-size: 15px; font-weight: 700; color: #111827;
    display: flex; align-items: center; gap: 8px; margin: 0;
  }
  .rt-card-title-icon {
    width: 24px; height: 24px; border-radius: 6px;
    background: #eff4ff; display: flex; align-items: center; justify-content: center;
  }
  .rt-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }

  /* Two-col layout */
  .rt-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  /* Progress bar */
  .rt-progress-wrap { margin-bottom: 14px; }
  .rt-progress-label { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 7px; }
  .rt-progress-label-name { font-weight: 600; color: #374151; }
  .rt-progress-label-val { color: #6b7280; }
  .rt-progress-track { height: 8px; background: #f1f3f5; border-radius: 100px; overflow: hidden; }
  .rt-progress-fill { height: 100%; border-radius: 100px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }

  /* Timeline */
  .rt-timeline { display: flex; flex-direction: column; gap: 0; }
  .rt-timeline-item { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid #f9fafb; }
  .rt-timeline-item:last-child { border-bottom: none; }
  .rt-timeline-dot {
    width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0;
  }
  .rt-timeline-time { font-size: 11.5px; color: #9ca3af; min-width: 44px; padding-top: 1px; }
  .rt-timeline-text { font-size: 13px; color: #374151; line-height: 1.5; }
  .rt-timeline-name { font-weight: 600; color: #111827; }

  /* Heatmap-like row */
  .rt-hour-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; }
  .rt-hour-cell {
    aspect-ratio: 1; border-radius: 4px; display: flex; align-items: center;
    justify-content: center; font-size: 9px; color: #fff; font-weight: 700;
    cursor: default;
  }

  @media (max-width: 900px) {
    .rt-stat-grid { grid-template-columns: repeat(2, 1fr); }
    .rt-two-col { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .rt-container { padding: 20px 16px 48px; }
    .rt-stat-grid { grid-template-columns: repeat(2, 1fr); }
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

const STATS = [
  {
    label: "총 참가 신청",
    value: "1,284",
    sub: "전일 대비 +38명",
    up: true,
    icon: <Users size={18} color="#1a4fd6" />,
    iconBg: "#eff4ff",
    barColor: "#1a4fd6",
  },
  {
    label: "체크인 완료",
    value: "847",
    sub: "전체의 65.9%",
    up: true,
    icon: <CheckCircle2 size={18} color="#10b981" />,
    iconBg: "#ecfdf5",
    barColor: "#10b981",
  },
  {
    label: "투표 참여",
    value: "512",
    sub: "참여율 60.4%",
    up: true,
    icon: <Vote size={18} color="#8b5cf6" />,
    iconBg: "#f5f3ff",
    barColor: "#8b5cf6",
  },
  {
    label: "현재 대기",
    value: "23",
    sub: "평균 대기 8분",
    up: false,
    icon: <Clock size={18} color="#f59e0b" />,
    iconBg: "#fffbeb",
    barColor: "#f59e0b",
  },
];

const HOUR_DATA = [
  { h: "10", v: 12, pct: 15 },
  { h: "11", v: 48, pct: 55 },
  { h: "12", v: 97, pct: 100 },
  { h: "13", v: 88, pct: 90 },
  { h: "14", v: 75, pct: 78 },
  { h: "15", v: 60, pct: 62 },
  { h: "16", v: 43, pct: 44 },
  { h: "17", v: 29, pct: 30 },
  { h: "18", v: 18, pct: 19 },
  { h: "19", v: 0, pct: 0 },
  { h: "20", v: 0, pct: 0 },
  { h: "21", v: 0, pct: 0 },
];

const RECENT_ACTIVITIES = [
  { time: "14:31", text: "홍*동님이 체크인을 완료했습니다.", color: "#10b981" },
  { time: "14:29", text: "이*연님이 투표에 참여했습니다.", color: "#8b5cf6" },
  { time: "14:27", text: "김*수님이 대기열에 등록했습니다.", color: "#f59e0b" },
  { time: "14:25", text: "박*희님이 체크인을 완료했습니다.", color: "#10b981" },
  { time: "14:22", text: "최*준님이 투표에 참여했습니다.", color: "#8b5cf6" },
  { time: "14:20", text: "정*아님이 체크인을 완료했습니다.", color: "#10b981" },
];

const getHeatColor = (pct) => {
  if (pct === 0) return "#f1f3f5";
  if (pct < 30) return "#bfdbfe";
  if (pct < 60) return "#60a5fa";
  if (pct < 85) return "#2563eb";
  return "#1a4fd6";
};

function DashboardContent() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <div className="rt-live-badge">
        <div className="rt-live-dot" />
        LIVE
      </div>

      {/* Stats */}
      <div className="rt-stat-grid">
        {STATS.map((s) => (
          <div key={s.label} className="rt-stat-card">
            <div className="rt-stat-icon" style={{ background: s.iconBg }}>
              {s.icon}
            </div>
            <div className="rt-stat-label">{s.label}</div>
            <div className="rt-stat-value">{s.value}</div>
            <div className="rt-stat-sub">
              {s.up ? (
                <ArrowUpRight size={12} className="rt-stat-up" />
              ) : (
                <ArrowDownRight size={12} className="rt-stat-down" />
              )}
              <span className={s.up ? "rt-stat-up" : "rt-stat-down"}>
                {s.sub}
              </span>
            </div>
            <div className="rt-stat-bg" style={{ background: s.barColor }} />
          </div>
        ))}
      </div>

      <div className="rt-two-col">
        {/* 시간대별 체크인 */}
        <div className="rt-card">
          <div className="rt-card-header">
            <div className="rt-card-title">
              <div className="rt-card-title-icon">
                <BarChart2 size={14} color="#1a4fd6" />
              </div>
              시간대별 체크인 현황
            </div>
            <span className="rt-card-tag">오늘</span>
          </div>
          <div className="rt-hour-grid">
            {HOUR_DATA.map((h) => (
              <div
                key={h.h}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <div
                  className="rt-hour-cell"
                  style={{
                    background: getHeatColor(h.pct),
                    width: "100%",
                    fontSize: h.pct > 0 ? 9 : 8,
                    color: h.pct > 50 ? "#fff" : "#9ca3af",
                  }}
                  title={`${h.h}시 ${h.v}명`}
                >
                  {h.v > 0 ? h.v : ""}
                </div>
                <div
                  style={{ fontSize: 9, color: "#9ca3af", textAlign: "center" }}
                >
                  {h.h}시
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, color: "#9ca3af" }}>낮음</span>
            {["#bfdbfe", "#60a5fa", "#2563eb", "#1a4fd6"].map((c) => (
              <div
                key={c}
                style={{
                  width: 16,
                  height: 10,
                  background: c,
                  borderRadius: 2,
                }}
              />
            ))}
            <span style={{ fontSize: 11, color: "#9ca3af" }}>높음</span>
          </div>
        </div>

        {/* 참가 현황 진행률 */}
        <div className="rt-card">
          <div className="rt-card-header">
            <div className="rt-card-title">
              <div className="rt-card-title-icon">
                <TrendingUp size={14} color="#1a4fd6" />
              </div>
              참가 현황 요약
            </div>
            <span className="rt-card-tag">실시간</span>
          </div>
          {[
            { name: "체크인 완료", val: 847, total: 1284, color: "#10b981" },
            { name: "투표 참여", val: 512, total: 847, color: "#8b5cf6" },
            { name: "프로그램 참여", val: 390, total: 847, color: "#1a4fd6" },
            { name: "굿즈 수령", val: 234, total: 847, color: "#f59e0b" },
          ].map((item) => (
            <div key={item.name} className="rt-progress-wrap">
              <div className="rt-progress-label">
                <span className="rt-progress-label-name">{item.name}</span>
                <span className="rt-progress-label-val">
                  {item.val.toLocaleString()} / {item.total.toLocaleString()}명
                </span>
              </div>
              <div className="rt-progress-track">
                <div
                  className="rt-progress-fill"
                  style={{
                    width: `${Math.round((item.val / item.total) * 100)}%`,
                    background: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="rt-card">
        <div className="rt-card-header">
          <div className="rt-card-title">
            <div className="rt-card-title-icon">
              <Activity size={14} color="#1a4fd6" />
            </div>
            최근 활동 로그
          </div>
          <span className="rt-card-tag">자동 갱신</span>
        </div>
        <div className="rt-timeline">
          {RECENT_ACTIVITIES.map((a, i) => (
            <div key={i} className="rt-timeline-item">
              <div
                className="rt-timeline-dot"
                style={{ background: a.color }}
              />
              <div className="rt-timeline-time">{a.time}</div>
              <div className="rt-timeline-text">{a.text}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const [currentPath, setCurrentPath] = useState("/realtime/dashboard");

  return (
    <div className="rt-root">
      <style>{styles}</style>
      <PageHeader
        title="대시보드"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />
      <main className="rt-container">
        <DashboardContent />
      </main>
    </div>
  );
}
