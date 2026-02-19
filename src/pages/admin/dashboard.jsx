import { useState, useRef, useEffect } from "react";

// ─── Inline Styles ────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Noto Sans KR', sans-serif;
    background: #f2f4f7;
    color: #1a1d23;
    height: 100vh;
    overflow: hidden;
  }

  .app { display: flex; width: 100%; height: 100vh; overflow: hidden; }

  /* ── Sidebar ── */
  .sidebar {
    width: 200px;
    min-width: 200px;
    height: 100vh;
    background: #fff;
    border-right: 1px solid #e8eaed;
    display: flex;
    flex-direction: column;
    padding: 20px 0;
    position: fixed;
    left: 0; top: 0;
    z-index: 100;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px 20px;
  }
  .logo-icon {
    width: 36px; height: 36px;
    background: #1a1d23;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .logo-icon svg { width: 20px; height: 20px; }
  .logo-text { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; color: #1a1d23; }

  .sidebar-icons {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px 16px;
    border-bottom: 1px solid #f0f1f3;
  }
  .icon-btn {
    width: 30px; height: 30px;
    border: none; background: none;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #8b909a;
    transition: background 0.15s;
  }
  .icon-btn:hover { background: #f4f5f7; }
  .icon-btn.notif { position: relative; }
  .notif-dot {
    position: absolute; top: 4px; right: 4px;
    width: 8px; height: 8px;
    background: #ef4444; border-radius: 50%;
    border: 1.5px solid #fff;
  }

  .search-wrap { padding: 12px 12px; }
  .search-input {
    width: 100%;
    padding: 8px 10px 8px 32px;
    border: 1px solid #e8eaed;
    border-radius: 8px;
    font-size: 12px;
    color: #8b909a;
    background: #f8f9fa url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%238b909a' stroke-width='2' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E") 10px center no-repeat;
    outline: none;
    transition: border 0.15s;
  }
  .search-input:focus { border-color: #a0a7b5; }

  .nav { flex: 1; padding: 4px 0; overflow-y: auto; }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    border-radius: 0;
    transition: background 0.15s, color 0.15s;
    user-select: none;
    position: relative;
  }
  .nav-item:hover { background: #f4f5f7; color: #1a1d23; }
  .nav-item.active { background: #f0f2ff; color: #4f46e5; }
  .nav-item.active::before {
    content: '';
    position: absolute; left: 0; top: 4px; bottom: 4px;
    width: 3px; background: #4f46e5; border-radius: 0 3px 3px 0;
  }
  .nav-item svg { width: 16px; height: 16px; flex-shrink: 0; }
  .nav-badge {
    margin-left: auto;
    background: #ef4444; color: #fff;
    font-size: 10px; font-weight: 600;
    padding: 1px 6px; border-radius: 20px;
  }
  .nav-item.active .nav-badge { background: #4f46e5; }

  /* ── Main ── */
  .main {
    margin-left: 200px;
    flex: 1;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .content {
    flex: 1;
    padding: 28px 28px;
    overflow-y: auto;
  }

  /* ── Page Title Row ── */
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }

  /* ── Date Picker ── */
  .date-range {
    display: flex; align-items: center; gap: 8px;
  }
  .date-field {
    display: flex; align-items: center; gap: 6px;
    border: 1px solid #e2e4e9;
    border-radius: 10px;
    padding: 7px 12px;
    background: #fff;
    cursor: pointer;
    font-size: 12px; color: #6b7280;
    position: relative;
    user-select: none;
    white-space: nowrap;
    transition: border 0.15s;
  }
  .date-field:hover { border-color: #a0a7b5; }
  .date-field svg { width: 15px; height: 15px; color: #9ca3af; }
  .date-arrow { color: #9ca3af; font-size: 14px; }

  .cal-popup {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: #fff;
    border: 1px solid #e2e4e9;
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    padding: 16px;
    z-index: 200;
    min-width: 260px;
  }
  .cal-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px;
  }
  .cal-nav {
    border: none; background: none; cursor: pointer;
    font-size: 16px; color: #6b7280; padding: 4px 8px; border-radius: 6px;
  }
  .cal-nav:hover { background: #f4f5f7; }
  .cal-month { font-size: 13px; font-weight: 600; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
  .cal-day-label {
    text-align: center; font-size: 10px; font-weight: 600;
    color: #9ca3af; padding: 4px 0;
  }
  .cal-day {
    text-align: center; font-size: 12px;
    padding: 6px 4px; border-radius: 6px; cursor: pointer;
    color: #374151;
    transition: background 0.1s;
  }
  .cal-day:hover { background: #f3f4f6; }
  .cal-day.selected { background: #4f46e5; color: #fff; }
  .cal-day.today { font-weight: 700; color: #4f46e5; }
  .cal-day.empty { cursor: default; }

  /* ── Tabs ── */
  .tabs {
    display: flex; align-items: center; gap: 4px;
    background: #f0f1f3;
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 20px;
    width: fit-content;
  }
  .tab {
    padding: 7px 14px;
    border-radius: 9px;
    font-size: 12px; font-weight: 500;
    cursor: pointer; user-select: none;
    color: #6b7280;
    display: flex; align-items: center; gap: 5px;
    transition: background 0.15s, color 0.15s;
    border: none; background: none;
  }
  .tab:hover { color: #1a1d23; }
  .tab.active { background: #fff; color: #1a1d23; font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .tab-count {
    font-size: 10px; font-weight: 700;
    background: #4f46e5; color: #fff;
    border-radius: 20px; padding: 1px 6px;
  }
  .tab.active .tab-count { background: #4f46e5; }
  .tab-count.red { background: #ef4444; }

  /* ── Stat Cards ── */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  .stat-card {
    background: #fff;
    border-radius: 14px;
    padding: 18px 20px;
    border: 1px solid #f0f1f3;
  }
  .stat-label { font-size: 11px; color: #9ca3af; margin-bottom: 8px; font-weight: 500; }
  .stat-row { display: flex; align-items: center; gap: 8px; }
  .stat-value { font-size: 26px; font-weight: 700; letter-spacing: -1px; }
  .stat-badge {
    font-size: 10px; font-weight: 600;
    padding: 2px 7px; border-radius: 20px;
  }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .badge-dark { background: #1a1d23; color: #fff; }

  /* ── Content Cards ── */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 14px;
  }
  .card {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    border: 1px solid #f0f1f3;
    min-height: 200px;
  }
  .card-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; }
  .card-legend {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 16px;
  }
  .legend-item {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: #6b7280;
  }
  .legend-dot { width: 7px; height: 7px; border-radius: 50%; }

  /* Radial Chart */
  .radial-wrap {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 140px;
    position: relative;
  }
  .radial-svg { width: 120px; height: 120px; }
  .radial-label {
    position: absolute;
    font-size: 18px; font-weight: 700;
    color: #1a1d23;
  }

  /* Check-in placeholder */
  .checkin-bars {
    display: flex; align-items: flex-end; gap: 6px; height: 90px; padding-top: 10px;
  }
  .bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
  .bar {
    width: 100%; border-radius: 4px 4px 0 0;
    transition: opacity 0.2s;
  }
  .bar:hover { opacity: 0.75; }
  .bar-label { font-size: 9px; color: #9ca3af; }

  /* Booth congestion */
  .congestion-items { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
  .cong-row { display: flex; align-items: center; gap: 10px; }
  .cong-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .cong-label { font-size: 12px; color: #374151; flex: 1; }
  .cong-bar-wrap { flex: 2; height: 8px; background: #f0f1f3; border-radius: 4px; overflow: hidden; }
  .cong-bar { height: 100%; border-radius: 4px; }

  .bottom-card-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .bottom-card {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    border: 1px solid #f0f1f3;
    min-height: 150px;
  }

  /* scrollbar */
  .content::-webkit-scrollbar { width: 4px; }
  .content::-webkit-scrollbar-track { background: transparent; }
  .content::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
`;

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const CalIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ value, onChange, onClose }) {
  const today = new Date();
  const [view, setView] = useState(value ? new Date(value) : new Date());

  const year = view.getFullYear();
  const month = view.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  const handleDay = (d) => {
    const selected = new Date(year, month, d);
    onChange(selected);
    onClose();
  };

  const isSelected = (d) => {
    if (!value || !d) return false;
    const v = new Date(value);
    return (
      v.getFullYear() === year && v.getMonth() === month && v.getDate() === d
    );
  };
  const isToday = (d) =>
    d &&
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === d;

  return (
    <div className="cal-popup" onClick={(e) => e.stopPropagation()}>
      <div className="cal-header">
        <button
          className="cal-nav"
          onClick={() => setView(new Date(year, month - 1, 1))}
        >
          ‹
        </button>
        <span className="cal-month">
          {year}년 {monthNames[month]}
        </span>
        <button
          className="cal-nav"
          onClick={() => setView(new Date(year, month + 1, 1))}
        >
          ›
        </button>
      </div>
      <div className="cal-grid">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="cal-day-label">
            {d}
          </div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            className={`cal-day${!d ? " empty" : ""}${isSelected(d) ? " selected" : ""}${isToday(d) && !isSelected(d) ? " today" : ""}`}
            onClick={() => d && handleDay(d)}
          >
            {d || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Date Field ───────────────────────────────────────────────────────────────
function DateField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const display = value
    ? `${value.getFullYear()}.${String(value.getMonth() + 1).padStart(2, "0")}.${String(value.getDate()).padStart(2, "0")}`
    : label;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div className="date-field" onClick={() => setOpen(!open)}>
        <CalIcon />
        <span
          style={{ color: value ? "#1a1d23" : "#9ca3af", fontSize: "12px" }}
        >
          {display}
        </span>
      </div>
      {open && (
        <MiniCalendar
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Radial Progress ──────────────────────────────────────────────────────────
function RadialChart({ pct = 67 }) {
  const r = 50,
    cx = 60,
    cy = 60;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="radial-wrap">
      <svg className="radial-svg" viewBox="0 0 120 120">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#f0f1f3"
          strokeWidth="12"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#1a1d23"
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <span className="radial-label">{pct}%</span>
    </div>
  );
}

// ─── Check-in Bar Chart ───────────────────────────────────────────────────────
const checkInData = [
  { label: "09", active: 40, inactive: 20 },
  { label: "10", active: 70, inactive: 30 },
  { label: "11", active: 55, inactive: 45 },
  { label: "12", active: 90, inactive: 10 },
  { label: "13", active: 60, inactive: 40 },
  { label: "14", active: 80, inactive: 20 },
  { label: "15", active: 50, inactive: 50 },
];
const maxVal = 100;

function CheckInBars() {
  return (
    <div className="checkin-bars">
      {checkInData.map(({ label, active, inactive }) => (
        <div key={label} className="bar-wrap">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              width: "100%",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <div
              className="bar"
              style={{
                height: `${(active / maxVal) * 70}px`,
                background: "#1a1d23",
              }}
            />
            <div
              className="bar"
              style={{
                height: `${(inactive / maxVal) * 30}px`,
                background: "#d1d5db",
              }}
            />
          </div>
          <span className="bar-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Booth Congestion ─────────────────────────────────────────────────────────
const boothData = [
  { label: "혼잡", color: "#ef4444", pct: 75 },
  { label: "보통", color: "#f59e0b", pct: 50 },
  { label: "여유", color: "#10b981", pct: 25 },
];

function BoothCongestion() {
  return (
    <div className="congestion-items">
      {boothData.map(({ label, color, pct }) => (
        <div key={label} className="cong-row">
          <div className="cong-dot" style={{ background: color }} />
          <span className="cong-label">{label}</span>
          <div className="cong-bar-wrap">
            <div
              className="cong-bar"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
          <span
            style={{
              fontSize: 11,
              color: "#9ca3af",
              width: 30,
              textAlign: "right",
            }}
          >
            {pct}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────
const navItems = [
  { label: "홈", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
  {
    label: "행사 관리",
    icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  },
  { label: "실시간 데이터", icon: "M22 12h-4l-3 9L9 3l-3 9H2", active: true },
  {
    label: "지난 포럼",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  },
  {
    label: "플랫폼 공지",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  },
  {
    label: "계정 권한 관리",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    badge: "99+",
  },
];

const tabs = [
  { label: "요약" },
  { label: "전체 이벤트", count: "7" },
  { label: "진행 중 이벤트", count: "2" },
  { label: "종료 이벤트", count: "99+", countClass: "red" },
  { label: "신규 이벤트" },
];

const statCards = [
  {
    label: "전체 이벤트",
    value: "123",
    badge: "+2,5%",
    badgeClass: "badge-green",
  },
  {
    label: "진행 중 이벤트",
    value: "123",
    badge: "-1,2%",
    badgeClass: "badge-red",
  },
  {
    label: "종료 이벤트",
    value: "123",
    badge: "+11%",
    badgeClass: "badge-green",
  },
  {
    label: "신규 이벤트",
    value: "123",
    badge: "+5,2%",
    badgeClass: "badge-dark",
  },
];

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState("실시간 데이터");
  const [activeTab, setActiveTab] = useState("요약");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [search, setSearch] = useState("");

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo-area">
            <div className="logo-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.1 2.344-1.672M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.1-2.344-1.672" />
                <path d="M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17z" />
                <path d="M4.42 11.247A13.152 13.152 0 004 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0112 5c.78 0 1.5.108 2.161.306" />
              </svg>
            </div>
            <span className="logo-text">pupoo</span>
          </div>

          <div className="sidebar-icons">
            <button className="icon-btn">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            </button>
            <button className="icon-btn">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2" />
              </svg>
            </button>
            <button className="icon-btn notif">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <span className="notif-dot" />
            </button>
          </div>

          <div className="search-wrap">
            <input
              className="search-input"
              placeholder="검색어를 입력하세요"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <nav className="nav">
            {navItems.map(({ label, icon, badge }) => (
              <div
                key={label}
                className={`nav-item${activeNav === label ? " active" : ""}`}
                onClick={() => setActiveNav(label)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={icon} />
                </svg>
                {label}
                {badge && <span className="nav-badge">{badge}</span>}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="content">
            {/* Header */}
            <div className="page-header">
              <h1 className="page-title">실시간 데이터</h1>
              <div className="date-range">
                <DateField
                  label="시작 날짜"
                  value={startDate}
                  onChange={setStartDate}
                />
                <span className="date-arrow">→</span>
                <DateField
                  label="끝나는 날짜"
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              {tabs.map(({ label, count, countClass }) => (
                <button
                  key={label}
                  className={`tab${activeTab === label ? " active" : ""}`}
                  onClick={() => setActiveTab(label)}
                >
                  {label}
                  {count && (
                    <span
                      className={`tab-count${countClass ? " " + countClass : ""}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Stat cards */}
            <div className="stat-grid">
              {statCards.map(({ label, value, badge, badgeClass }) => (
                <div key={label} className="stat-card">
                  <div className="stat-label">{label}</div>
                  <div className="stat-row">
                    <span className="stat-value">{value}</span>
                    <span className={`stat-badge ${badgeClass}`}>{badge}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Content cards row 1 */}
            <div className="card-grid">
              {/* 총 참여자 수 */}
              <div className="card">
                <div className="card-title">총 참여자 수</div>
                <div className="card-legend">
                  <div className="legend-item">
                    <div
                      className="legend-dot"
                      style={{ background: "#1a1d23" }}
                    />
                    신규 참여자
                  </div>
                  <div className="legend-item">
                    <div
                      className="legend-dot"
                      style={{ background: "#d1d5db" }}
                    />
                    재 참여자
                  </div>
                </div>
                <RadialChart pct={67} />
              </div>

              {/* 오늘 체크인 수 */}
              <div className="card">
                <div className="card-title">오늘 체크인 수</div>
                <div className="card-legend">
                  <div className="legend-item">
                    <div
                      className="legend-dot"
                      style={{ background: "#1a1d23" }}
                    />
                    Very Active
                  </div>
                  <div className="legend-item">
                    <div
                      className="legend-dot"
                      style={{ background: "#d1d5db" }}
                    />
                    Inactive
                  </div>
                </div>
                <CheckInBars />
              </div>

              {/* 현재 부스 혼잡도 */}
              <div className="card">
                <div className="card-title">현재 부스 혼잡도</div>
                <div className="card-legend">
                  <div className="legend-item">
                    <div
                      className="legend-dot"
                      style={{ background: "#ef4444" }}
                    />
                    혼잡
                  </div>
                  <div className="legend-item">
                    <div
                      className="legend-dot"
                      style={{ background: "#f59e0b" }}
                    />
                    보통
                  </div>
                  <div className="legend-item" style={{ gap: 5 }}>
                    여유
                  </div>
                </div>
                <BoothCongestion />
              </div>
            </div>

            {/* Content cards row 2 */}
            <div className="bottom-card-grid">
              <div className="bottom-card">
                <div className="card-title">체험 존 관리</div>
              </div>
              <div className="bottom-card">
                <div className="card-title">콘테스트 관리</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
