import { useState, useCallback, useEffect } from "react";
import {
  Home,
  CalendarDays,
  Archive,
  Megaphone,
  Bell,
  LogOut,
  Settings,
  PawPrint,
  LayoutGrid,
  Clipboard,
  Users,
  Trophy,
  Image,
  CreditCard,
  Send,
  Layers,
  Mic,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CircleDot } from "lucide-react";
import ds, { cardStyle } from "../shared/designTokens";
import { KpiCard, ChartTip } from "../shared/Components";
import DATA from "../shared/data";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { getToken, clearToken } from "../../../api/noticeApi";

/* 페이지 import */
import EventManage from "../event/eventManage";
import ProgramManage from "../program/programManage";
import BoardManage from "../board/boardManage";
import Notice from "../board/Notice";
import PastEvents from "../past/PastEvents";
import ZoneManage from "../zone/zoneManage";
import ContestManage from "../contest/contestManage";
import SessionManage from "../session/sessionManage";
import Gallery from "../gallery/Gallery";
import ParticipantList from "../participant/ParticipantList";
import PaymentManage from "../participant/PaymentManage";
import AlertManage from "../participant/AlertManage";
/**/

/* ═══════════════════════════════════════════════
   벨 애니메이션 CSS
   ═══════════════════════════════════════════════ */
const globalStyles = `
@keyframes bellRing {
  0%   { transform: rotate(0deg); }
  10%  { transform: rotate(14deg); }
  20%  { transform: rotate(-12deg); }
  30%  { transform: rotate(10deg); }
  40%  { transform: rotate(-8deg); }
  50%  { transform: rotate(6deg); }
  60%  { transform: rotate(-4deg); }
  70%  { transform: rotate(2deg); }
  80%  { transform: rotate(-1deg); }
  100% { transform: rotate(0deg); }
}

/* ── 세련된 다크 스크롤바 ── */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
::-webkit-scrollbar-corner {
  background: transparent;
}

/* 사이드바 전용 */
aside ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.07);
}
aside ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.18);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}
aside * {
  scrollbar-color: rgba(255, 255, 255, 0.07) transparent;
}
`;

/* ═══════════════════════════════════════════════
   사이드바 & 탭 설정
   ═══════════════════════════════════════════════ */
const NAV = [
  {
    section: "대시보드",
    items: [{ id: "dashboard", label: "홈", icon: Home }],
  },
  {
    section: "행사",
    items: [
      { id: "pastEvents", label: "지난 행사", icon: Archive },
      { id: "eventManage", label: "행사 관리", icon: CalendarDays },
      { id: "programManage", label: "프로그램 관리", icon: Clipboard },
    ],
  },
  {
    section: "행사 상세",
    items: [
      { id: "zoneManage", label: "체험존 관리", icon: Layers },
      { id: "contestManage", label: "콘테스트 관리", icon: Trophy },
      { id: "sessionManage", label: "세션/강연 관리", icon: Mic },
    ],
  },
  {
    section: "커뮤니티",
    items: [
      { id: "boardManage", label: "게시판 관리", icon: LayoutGrid },
      { id: "gallery", label: "갤러리 관리", icon: Image },
      { id: "notice", label: "공지사항 관리", icon: Megaphone },
    ],
  },
  {
    section: "참가자",
    items: [
      { id: "participantList", label: "참가자 목록", icon: Users },
      { id: "paymentManage", label: "결제 관리", icon: CreditCard },
      { id: "alertManage", label: "알림 관리", icon: Send },
    ],
  },
];

const DEFAULT_PAGE_TABS = {
  dashboard: [{ id: "summary", label: "요약" }],
  eventManage: [
    { id: "all", label: "전체 이벤트", count: 0 },
    { id: "active", label: "진행 중", count: 0 },
    { id: "ended", label: "종료", count: 0 },
    { id: "new", label: "신규", count: 0 },
  ],
  programManage: [
    { id: "all", label: "전체", count: 0 },
    { id: "active", label: "운영 중", count: 0 },
    { id: "ended", label: "종료", count: 0 },
    { id: "pending", label: "대기", count: 0 },
  ],
  pastEvents: [{ id: "all", label: "전체 행사" }],
  zoneManage: [
    { id: "all", label: "전체", count: 0 },
    { id: "active", label: "운영 중", count: 0 },
    { id: "ended", label: "종료", count: 0 },
    { id: "pending", label: "대기", count: 0 },
  ],
  contestManage: [
    { id: "all", label: "전체", count: 0 },
    { id: "active", label: "운영 중", count: 0 },
    { id: "ended", label: "종료", count: 0 },
    { id: "pending", label: "대기", count: 0 },
  ],
  sessionManage: [
    { id: "all", label: "전체", count: 0 },
    { id: "active", label: "운영 중", count: 0 },
    { id: "ended", label: "종료", count: 0 },
    { id: "pending", label: "대기", count: 0 },
  ],
  boardManage: [
    { id: "free", label: "자유게시판" },
    { id: "info", label: "정보게시판" },
    { id: "review", label: "행사후기" },
    { id: "qna", label: "질문·답변" },
    { id: "faq", label: "자주묻는질문" },
  ],
  gallery: [{ id: "all", label: "갤러리" }],
  notice: [{ id: "all", label: "공지사항", count: 5 }],
  participantList: [
    { id: "list", label: "참가자 목록" },
    { id: "checkin", label: "체크인 관리" },
    { id: "session", label: "체험 세션" },
  ],
  paymentManage: [
    { id: "all", label: "전체", count: 0 },
    { id: "active", label: "운영 중", count: 0 },
    { id: "ended", label: "종료", count: 0 },
    { id: "pending", label: "대기", count: 0 },
  ],
  alertManage: [{ id: "all", label: "알림 내역" }],
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const PAGE_TITLES = {
  dashboard: "홈",
  eventManage: "행사 관리",
  programManage: "프로그램 관리",
  pastEvents: "지난 행사",
  zoneManage: "체험존 관리",
  contestManage: "콘테스트 관리",
  sessionManage: "세션/강연 관리",
  boardManage: "게시판 관리",
  gallery: "갤러리 관리",
  notice: "공지사항 관리",
  participantList: "참가자 목록",
  paymentManage: "결제 관리",
  alertManage: "알림 관리",
};

/* ═══════════════════════════════════════════════
   오늘 날짜 + 인사말 (헤더용)
   ═══════════════════════════════════════════════ */
function TodayGreeting() {
  const now = new Date();
  const h = now.getHours();
  const greeting =
    h < 12 ? "좋은 아침이에요" : h < 17 ? "좋은 오후예요" : "수고하셨어요";
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const formatted = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()} (${days[now.getDay()]})`;
  const timeStr = `${String(h).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: ds.bg,
          borderRadius: 8,
          padding: "5px 12px",
        }}
      >
        <CalendarDays size={13} color={ds.ink4} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: ds.ink3 }}>
          {formatted}
        </span>
        <span style={{ fontSize: 11, color: ds.ink4, fontWeight: 500 }}>
          {timeStr}
        </span>
      </div>
      <span style={{ fontSize: 12.5, color: ds.ink4, fontWeight: 500 }}>
        {greeting} 👋
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   홈 페이지 (Dashboard 내장)
   ═══════════════════════════════════════════════ */
function PageHome() {
  const merged = DATA.userTrend.thisYear.map((d, i) => ({
    m: d.m,
    thisYear: d.v,
    lastYear: DATA.userTrend.lastYear[i]?.v || 0,
  }));
  const locDonut = DATA.locationTraffic.map((d) => ({
    name: d.name,
    value: d.pct,
    color: d.color,
  }));

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* KPI */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 14,
            marginBottom: 18,
          }}
        >
          {DATA.kpi.map((d) => (
            <KpiCard key={d.id} d={d} />
          ))}
        </div>

        {/* 참여자 차트 + 유입 경로 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: ds.ink }}>
                전체 참여자
              </span>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { l: "올해", c: ds.brand },
                  { l: "작년", c: ds.ink4 },
                ].map((x) => (
                  <span
                    key={x.l}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11.5,
                      color: ds.ink3,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 3,
                        borderRadius: 2,
                        background: x.c,
                      }}
                    />
                    {x.l}
                  </span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={merged}>
                <defs>
                  <linearGradient id="gThis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ds.brand} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={ds.brand} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={ds.lineSoft}
                  vertical={false}
                />
                <XAxis
                  dataKey="m"
                  tick={{ fontSize: 11, fill: ds.ink4 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: ds.ink4 }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  tickFormatter={(v) => `${v / 1000}K`}
                />
                <Tooltip content={<ChartTip />} />
                <Area
                  type="monotone"
                  dataKey="lastYear"
                  stroke={ds.ink4}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  fill="none"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="thisYear"
                  stroke={ds.brand}
                  strokeWidth={2.5}
                  fill="url(#gThis)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: ds.brand,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: ds.ink,
                marginBottom: 18,
              }}
            >
              유입 경로
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {DATA.trafficSite.map((t) => (
                <div
                  key={t.name}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span
                    style={{
                      width: 80,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: ds.ink2,
                    }}
                  >
                    {t.name}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      background: ds.lineSoft,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${t.value}%`,
                        height: "100%",
                        borderRadius: 3,
                        background: t.color,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: ds.ink3,
                      width: 30,
                      textAlign: "right",
                    }}
                  >
                    {t.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 디바이스 + 지역 */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}
        >
          <div style={cardStyle}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: ds.ink,
                marginBottom: 14,
              }}
            >
              디바이스별 트래픽
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={DATA.trafficDevice} barGap={2} barSize={14}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={ds.lineSoft}
                  vertical={false}
                />
                <XAxis
                  dataKey="d"
                  tick={{ fontSize: 11, fill: ds.ink4 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: ds.ink4 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                  tickFormatter={(v) => `${v / 1000}K`}
                />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="desktop" fill={ds.brand} radius={[3, 3, 0, 0]} />
                <Bar dataKey="mobile" fill={ds.sky} radius={[3, 3, 0, 0]} />
                <Bar
                  dataKey="tablet"
                  fill={ds.lineSoft}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                marginTop: 8,
              }}
            >
              {[
                { l: "데스크톱", c: ds.brand },
                { l: "모바일", c: ds.sky },
                { l: "태블릿", c: ds.ink4 },
              ].map((x) => (
                <span
                  key={x.l}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    color: ds.ink3,
                  }}
                >
                  <CircleDot size={8} color={x.c} fill={x.c} />
                  {x.l}
                </span>
              ))}
            </div>
          </div>
          <div style={cardStyle}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: ds.ink,
                marginBottom: 8,
              }}
            >
              지역별 트래픽
            </div>
            <div
              style={{
                position: "relative",
                width: 140,
                height: 140,
                margin: "0 auto 12px",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={locDonut}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={66}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {locDonut.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DATA.locationTraffic.map((l) => (
                <div
                  key={l.name}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <CircleDot size={8} color={l.color} fill={l.color} />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: ds.ink2,
                    }}
                  >
                    {l.name}
                  </span>
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: ds.ink }}
                  >
                    {l.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 우측 패널 */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={cardStyle}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: ds.ink,
              marginBottom: 14,
            }}
          >
            알림
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {DATA.notifications.map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: n.color + "15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <n.icon size={13} color={n.color} strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: ds.ink2,
                      lineHeight: 1.35,
                    }}
                  >
                    {n.msg}
                  </div>
                  <div style={{ fontSize: 11, color: ds.ink4, marginTop: 2 }}>
                    {n.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={cardStyle}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: ds.ink,
              marginBottom: 14,
            }}
          >
            활동 내역
          </div>
          {DATA.activities.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                padding: "8px 0",
                borderBottom:
                  i < DATA.activities.length - 1
                    ? `1px solid ${ds.lineSoft}`
                    : "none",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: a.color,
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{ fontSize: 12.5, fontWeight: 600, color: ds.ink2 }}
                >
                  {a.msg}
                </div>
                <div style={{ fontSize: 11, color: ds.ink4 }}>{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: ds.ink,
              marginBottom: 14,
            }}
          >
            팀원
          </div>
          {DATA.contacts.map((c, i) => {
            const colors = [ds.brand, ds.green, ds.violet, ds.amber];
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: `${colors[i]}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    color: colors[i],
                  }}
                >
                  {c.name[0]}
                </div>
                <div>
                  <div
                    style={{ fontSize: 12.5, fontWeight: 600, color: ds.ink }}
                  >
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: ds.ink4 }}>{c.role}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════════ */
export default function Dashboard() {
  const [nav, setNav] = useState("dashboard");
  const [subTab, setSubTab] = useState(null);
  // bellAnim removed — logout button now
  const [pageTabs, setPageTabs] = useState(DEFAULT_PAGE_TABS);
  const [eventMenuBadge, setEventMenuBadge] = useState(0);

  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = ds.bg;
    return () => {
      document.body.style.backgroundColor = prevBg;
    };
  }, []);

  const loadTabCounts = useCallback(async () => {
    try {
      const [eventRes, programRes] = await Promise.all([
        axiosInstance.get("/api/admin/dashboard/events", {
          headers: authHeaders(),
        }),
        axiosInstance.get("/api/admin/dashboard/programs", {
          headers: authHeaders(),
        }),
      ]);

      const eventList = eventRes?.data?.data || eventRes?.data || [];
      const programList = programRes?.data?.data || programRes?.data || [];

      const events = Array.isArray(eventList) ? eventList : [];
      const programs = Array.isArray(programList) ? programList : [];

      /* 날짜 기반 상태 계산 — 각 관리 페이지의 calcStatus와 동일 로직 */
      const calcSt = (startAt, endAt) => {
        if (!startAt && !endAt) return "pending";
        const now = new Date();
        const s = startAt
          ? new Date(String(startAt).includes("T") ? startAt : startAt + "T00:00:00+09:00")
          : null;
        const e = endAt
          ? new Date(String(endAt).includes("T") ? endAt : endAt + "T23:59:59+09:00")
          : null;
        if (e && now > e) return "ended";
        if (s && now < s) return "pending";
        return "active";
      };

      const evComputed = events.map((e) => calcSt(
        e.startAt ?? e.startDateTime ?? e.startDate ?? e.date?.split("~")[0]?.trim(),
        e.endAt ?? e.endDateTime ?? e.endDate ?? e.date?.split("~")[1]?.trim(),
      ));
      const prComputed = programs.map((p) => calcSt(p.startAt, p.endAt));

      const eventCounts = {
        all: events.length,
        active: evComputed.filter((s) => s === "active").length,
        ended: evComputed.filter((s) => s === "ended").length,
        pending: evComputed.filter((s) => s === "pending").length,
      };

      const programCounts = {
        all: programs.length,
        active: prComputed.filter((s) => s === "active").length,
        ended: prComputed.filter((s) => s === "ended").length,
        pending: prComputed.filter((s) => s === "pending").length,
      };

      const evTabRow = (label = "전체") => [
        { id: "all", label, count: eventCounts.all },
        { id: "active", label: "운영 중", count: eventCounts.active },
        { id: "ended", label: "종료", count: eventCounts.ended },
        { id: "pending", label: "대기", count: eventCounts.pending },
      ];

      setPageTabs((prev) => ({
        ...prev,
        eventManage: [
          { id: "all", label: "전체 이벤트", count: eventCounts.all },
          { id: "active", label: "진행 중", count: eventCounts.active },
          { id: "ended", label: "종료", count: eventCounts.ended },
          { id: "new", label: "신규", count: eventCounts.pending },
        ],
        programManage: [
          { id: "all", label: "전체", count: programCounts.all },
          { id: "active", label: "운영 중", count: programCounts.active },
          { id: "ended", label: "종료", count: programCounts.ended },
          { id: "pending", label: "대기", count: programCounts.pending },
        ],
        zoneManage: evTabRow("전체"),
        contestManage: evTabRow("전체"),
        sessionManage: evTabRow("전체"),
        paymentManage: evTabRow("전체"),
      }));
      setEventMenuBadge(eventCounts.all);
    } catch (err) {
      console.error("[Dashboard] tab count load failed:", err);
    }
  }, []);

  useEffect(() => {
    loadTabCounts();
  }, [nav, loadTabCounts]);

  const tabs = pageTabs[nav] || [];
  const activeTab = subTab || tabs[0]?.id;
  const handleNav = (id) => {
    setNav(id);
    setSubTab(null);
  };

  const renderPage = () => {
    switch (nav) {
      case "dashboard":
        return <PageHome />;
      case "eventManage":
        return <EventManage subTab={activeTab} />;
      case "programManage":
        return <ProgramManage subTab={activeTab} />;
      case "pastEvents":
        return <PastEvents />;
      case "zoneManage":
        return <ZoneManage subTab={activeTab} />;
      case "contestManage":
        return <ContestManage subTab={activeTab} />;
      case "sessionManage":
        return <SessionManage subTab={activeTab} />;
      case "boardManage":
        return <BoardManage subTab={activeTab} />;
      case "notice":
        return <Notice />;
      case "gallery":
        return <Gallery />;
      case "participantList":
        return <ParticipantList subTab={activeTab} />;
      case "paymentManage":
        return <PaymentManage subTab={activeTab} />;
      case "alertManage":
        return <AlertManage />;
      default:
        return <PageHome />;
    }
  };

  return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          fontFamily: ds.ff,
          background: ds.bg,
          overflow: "hidden",
        }}
      >
        <style>{globalStyles}</style>

        {/* ─── SIDEBAR ─── */}
        <aside
          style={{
            width: 240,
            background: ds.sidebar,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          {/* 로고 */}
          <div
            style={{
              padding: "22px 18px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: ds.brand,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 2px 10px ${ds.brand}44`,
              }}
            >
              <PawPrint size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: ds.inkW,
                  letterSpacing: -0.5,
                }}
              >
                <img
                  src="/logo_white.png"
                  alt="pupoo logo"
                  style={{
                    height: 20,
                    objectFit: "contain",
                    cursor: "pointer",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  color: ds.inkWG,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Admin Console
              </div>
            </div>
          </div>

          {/* 메뉴 그룹 */}
          <nav style={{ flex: 1, padding: "0 10px", overflow: "auto" }}>
            {NAV.map((group) => (
              <div key={group.section}>
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: ds.inkWG,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    padding: "14px 10px 6px",
                  }}
                >
                  {group.section}
                </div>
                {group.items.map((item) => {
                  const on = nav === item.id;
                  const I = item.icon;
                  const badgeValue =
                    item.id === "eventManage" ? eventMenuBadge : item.badge;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "8px 10px",
                        borderRadius: ds.rs,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: ds.ff,
                        fontSize: 13,
                        background: on ? ds.sideActive : "transparent",
                        color: on ? ds.inkW : ds.inkWD,
                        fontWeight: on ? 700 : 500,
                        marginBottom: 1,
                        transition: "all .08s",
                      }}
                      onMouseEnter={(e) => {
                        if (!on)
                          e.currentTarget.style.background = ds.sideHover;
                      }}
                      onMouseLeave={(e) => {
                        if (!on)
                          e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <I size={16} strokeWidth={on ? 2.2 : 1.8} />
                      <span style={{ flex: 1, textAlign: "left" }}>
                        {item.label}
                      </span>
                      {badgeValue != null && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 9,
                            background: on
                              ? ds.brand
                              : "rgba(255,255,255,0.12)",
                            color: "#fff",
                            lineHeight: "15px",
                          }}
                        >
                          {badgeValue}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* 유저 */}
          <div
            style={{
              padding: "12px 14px 16px",
              borderTop: `1px solid ${ds.lineD}`,
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: ds.brand,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              김
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: ds.inkW }}>
                김관리
              </div>
              <div style={{ fontSize: 10.5, color: ds.inkWG }}>Super Admin</div>
            </div>
            <Settings
              size={14}
              color={ds.inkWG}
              style={{ cursor: "pointer" }}
            />
          </div>
        </aside>

        {/* ─── MAIN ─── */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* 헤더 */}
          <header
            style={{
              background: ds.card,
              padding: "0 28px",
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${ds.line}`,
            }}
          >
            <h1
              style={{
                fontSize: 17,
                fontWeight: 800,
                margin: 0,
                color: ds.ink,
                letterSpacing: -0.3,
              }}
            >
              {PAGE_TITLES[nav] || "대시보드"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* ── 오늘 날짜 + 인사말 ── */}
              <TodayGreeting />

              {/* 로그아웃 */}
              <button
                onClick={() => {
                  clearToken();
                  window.location.href = "/admin/login";
                }}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: ds.rs,
                  border: `1px solid ${ds.line}`,
                  background: ds.bg,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: ds.ink3,
                  fontFamily: ds.ff,
                  transition: "all .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = ds.redSoft; e.currentTarget.style.color = ds.red; e.currentTarget.style.borderColor = `${ds.red}33`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ds.bg; e.currentTarget.style.color = ds.ink3; e.currentTarget.style.borderColor = ds.line; }}
              >
                <LogOut size={13} />
                로그아웃
              </button>
            </div>
          </header>

          {/* 탭 (2개 이상일 때만 표시) */}
          {tabs.length > 1 && (
            <div
              style={{
                background: ds.card,
                padding: "0 28px",
                borderBottom: `1px solid ${ds.line}`,
                display: "flex",
                alignItems: "center",
              }}
            >
              {tabs.map((t) => {
                const on = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSubTab(t.id)}
                    style={{
                      padding: "10px 16px",
                      border: "none",
                      cursor: "pointer",
                      background: "none",
                      fontSize: 13,
                      fontWeight: on ? 700 : 500,
                      color: on ? ds.brand : ds.ink4,
                      borderBottom: `2px solid ${on ? ds.brand : "transparent"}`,
                      transition: "all .1s",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontFamily: ds.ff,
                    }}
                    onMouseEnter={(e) => {
                      if (!on) e.currentTarget.style.color = ds.ink3;
                    }}
                    onMouseLeave={(e) => {
                      if (!on) e.currentTarget.style.color = ds.ink4;
                    }}
                  >
                    {t.label}
                    {t.count != null && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "0 6px",
                          borderRadius: 9,
                          lineHeight: "17px",
                          background: on ? ds.brandSoft : ds.lineSoft,
                          color: on ? ds.brand : ds.ink4,
                        }}
                      >
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 페이지 콘텐츠 */}
          <div style={{ flex: 1, overflow: "auto", padding: "20px 28px 28px" }}>
            {renderPage()}
          </div>
        </main>
      </div>
  );
}
