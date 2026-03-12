import { useState, useCallback, useEffect } from "react";
import AdminChatBot from "./AdminChatBot";
import {
  AlertTriangle,
  Home,
  CalendarDays,
  Archive,
  Megaphone,
  LogOut,
  Settings,
  PawPrint,
  LayoutGrid,
  Clipboard,
  Users,
  Trophy,
  Image,
  CreditCard,
  RotateCcw,
  Send,
  Layers,
  Mic,
} from "lucide-react";
import ds from "../shared/designTokens";
import { countAdminStatuses, resolveAdminStatus } from "../shared/adminStatus";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { getToken, clearToken } from "../../../api/noticeApi";
import HomeDashboard from "./HomeDashboard";

/* ?섏씠吏 import */
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
import RefundManage from "../refund/RefundManage";
import AdminLogManage from "../adminlog/AdminLogManage";
import ReportManage from "../report/ReportManage";
/**/

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   踰??좊땲硫붿씠??CSS
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
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

/* ?? ?몃젴???ㅽ겕 ?ㅽ겕濡ㅻ컮 ?? */
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

/* ?ъ씠?쒕컮 ?꾩슜 */
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

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   ?ъ씠?쒕컮 & ???ㅼ젙
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
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
      { id: "programManage", label: "전체 프로그램 관리", icon: Clipboard },
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
    section: "참가",
    items: [
      { id: "participantList", label: "참가자 목록", icon: Users },
      { id: "paymentManage", label: "결제 관리", icon: CreditCard },
      { id: "refundManage", label: "환불 관리", icon: RotateCcw },
      { id: "alertManage", label: "알림 관리", icon: Send },
    ],
  },
  {
    section: "관리자",
    items: [
      { id: "reports", label: "신고 관리", icon: AlertTriangle },
      { id: "adminLogs", label: "관리자 로그", icon: Settings },
    ],
  },
];

const DEFAULT_PAGE_TABS = {
  dashboard: [{ id: "summary", label: "요약" }],
  eventManage: [
    { id: "all", label: "전체 이벤트", count: 0 },
    { id: "active", label: "진행 중", count: 0 },
    { id: "ended", label: "종료", count: 0 },
    { id: "new", label: "예정", count: 0 },
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
    { id: "faq", label: "자주 묻는 질문" },
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
  refundManage: [{ id: "all", label: "환불 요청" }],
  alertManage: [{ id: "all", label: "알림 이력" }],
  reports: [{ id: "all", label: "신고 이력" }],
  adminLogs: [{ id: "all", label: "로그 이력" }],
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeAdminProgramCategory = (program) => {
  const raw = String(
    program?.category ?? program?.programCategory ?? program?.programType ?? "",
  ).trim();
  const upper = raw.toUpperCase();

  if (upper === "CONTEST" || raw === "대회") return "CONTEST";
  if (upper === "SESSION" || raw === "교육" || raw === "강연") return "SESSION";
  if (upper === "EXPERIENCE" || raw === "체험") return "EXPERIENCE";

  return upper;
};

const PAGE_TITLES = {
  dashboard: "대시보드",
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
  refundManage: "환불 관리",
  alertManage: "알림 관리",
  reports: "신고 관리",
  adminLogs: "관리자 로그",
};

function TodayGreeting() {
  const now = new Date();
  const h = now.getHours();
  const greeting =
    h < 12
      ? "좋은 아침입니다"
      : h < 17
        ? "좋은 오후입니다"
        : "수고 많으셨습니다";
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
        {greeting}
      </span>
    </div>
  );
}

function PageHome() {
  return <HomeDashboard />;
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   硫붿씤 而댄룷?뚰듃
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
export default function Dashboard() {
  const [nav, setNav] = useState("dashboard");
  const [subTab, setSubTab] = useState(null);
  // bellAnim removed ??logout button now
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
      const eventRes = await axiosInstance.get("/api/admin/dashboard/events", {
        headers: authHeaders(),
      });

      const readList = (payload) =>
        Array.isArray(payload?.content)
          ? payload.content
          : Array.isArray(payload)
            ? payload
            : [];

      /* ?좎쭨 湲곕컲 ?곹깭 怨꾩궛 ??媛?愿由??섏씠吏??calcStatus? ?숈씪 濡쒖쭅 */
      const calcSt = (startAt, endAt) => {
        if (!startAt && !endAt) return "pending";
        const norm = (v) => (v ? String(v).replace(/\./g, "-").trim() : v);
        const now = new Date();
        const s = startAt
          ? new Date(
              norm(startAt).includes("T")
                ? norm(startAt)
                : norm(startAt) + "T00:00:00+09:00",
            )
          : null;
        const e = endAt
          ? new Date(
              norm(endAt).includes("T")
                ? norm(endAt)
                : norm(endAt) + "T23:59:59+09:00",
            )
          : null;
        if (e && !isNaN(e) && now > e) return "ended";
        if (s && !isNaN(s) && now < s) return "pending";
        return "active";
      };

      const events = readList(eventRes?.data?.data || eventRes?.data).map(
        (event) => {
          const startAt =
            event.startAt ??
            event.startDateTime ??
            event.startDate ??
            event.date?.split("~")[0]?.trim();
          const endAt =
            event.endAt ??
            event.endDateTime ??
            event.endDate ??
            event.date?.split("~")[1]?.trim();
          return {
            ...event,
            status: resolveAdminStatus(event, calcSt(startAt, endAt)),
          };
        },
      );
      const eventCounts = countAdminStatuses(events);

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
          { id: "new", label: "예정", count: eventCounts.pending },
        ],
        programManage: [
          { id: "all", label: "전체", count: eventCounts.all },
          { id: "active", label: "운영 중", count: eventCounts.active },
          { id: "ended", label: "종료", count: eventCounts.ended },
          { id: "pending", label: "대기", count: eventCounts.pending },
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
    const timerId = setInterval(() => {
      loadTabCounts();
    }, 5000);

    return () => clearInterval(timerId);
  }, [loadTabCounts]);

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
      case "refundManage":
        return <RefundManage />;
      case "alertManage":
        return <AlertManage />;
      case "reports":
        return <ReportManage />;
      case "adminLogs":
        return <AdminLogManage />;
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

      {/* ??? SIDEBAR ??? */}
      <aside
        style={{
          width: 240,
          background: ds.sidebar,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* 濡쒓퀬 */}
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

        {/* 硫붾돱 洹몃９ */}
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
                      if (!on) e.currentTarget.style.background = ds.sideHover;
                    }}
                    onMouseLeave={(e) => {
                      if (!on) e.currentTarget.style.background = "transparent";
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
                          background: on ? ds.brand : "rgba(255,255,255,0.12)",
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

        {/* ?좎? */}
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
            源
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: ds.inkW }}>
              김관리
            </div>
            <div style={{ fontSize: 10.5, color: ds.inkWG }}>Super Admin</div>
          </div>
          <Settings size={14} color={ds.inkWG} style={{ cursor: "pointer" }} />
        </div>
      </aside>

      {/* ??? MAIN ??? */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ?ㅻ뜑 */}
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
            {/* ?? ?ㅻ뒛 ?좎쭨 + ?몄궗留??? */}
            <TodayGreeting />

            {/* 濡쒓렇?꾩썐 */}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = ds.redSoft;
                e.currentTarget.style.color = ds.red;
                e.currentTarget.style.borderColor = `${ds.red}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = ds.bg;
                e.currentTarget.style.color = ds.ink3;
                e.currentTarget.style.borderColor = ds.line;
              }}
            >
              <LogOut size={13} />
              로그아웃
            </button>
          </div>
        </header>

        {/* ??(2媛??댁긽???뚮쭔 ?쒖떆) */}
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

        {/* ?섏씠吏 肄섑뀗痢?*/}
        <div style={{ flex: 1, overflow: "auto", padding: "20px 28px 28px" }}>
          {renderPage()}
        </div>
      </main>
      <AdminChatBot />
    </div>
  );
}
