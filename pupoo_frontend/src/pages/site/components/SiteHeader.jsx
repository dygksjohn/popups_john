import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { LogIn, UserPlus, Search, LogOut, UserCircle, CalendarHeart, MessageCircleHeart, TicketCheck, Activity, X, MapPin, Calendar, SearchX, Menu } from "lucide-react";
import {
  notificationApi,
  NOTIFICATION_UNREAD_COUNT_EVENT,
  emitNotificationUnreadCount,
} from "../../../app/http/notificationApi";
import { eventApi } from "../../../app/http/eventApi";
import { toPublicAssetUrl } from "../../../shared/utils/publicAssetUrl";

const FONT = "'JeonjuCraftGothic', Pretendard, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";

/* ?????????????????????????????????????????????
   NAV DATA
????????????????????????????????????????????? */
const megaMenuData = {
  events: {
    columns: [
      {
        title: "?됱궗",
        items: [
          { label: "?꾩옱 吏꾪뻾 ?됱궗", href: "/event/current" },
          { label: "?덉젙 ?됱궗", href: "/event/upcoming" },
          { label: "醫낅즺 ?됱궗", href: "/event/closed" },
          { label: "?됱궗 ?쇱젙 ?덈궡", href: "/event/eventschedule" },
        ],
      },
      {
        title: "?꾨줈洹몃옩",
        items: [
          { label: "?꾩옱 吏꾪뻾 ?꾨줈洹몃옩", href: "/program/current" },
          { label: "?덉젙 ?꾨줈洹몃옩", href: "/program/upcoming" },
          { label: "醫낅즺 ?꾨줈洹몃옩", href: "/program/closed" },
        ],
      },
    ],
    promo: {
      image: "/promo_event.jpg",
      title: "?됱궗 ?덈궡",
      desc: "Pupoo??二쇱슂 ?됱궗? ?꾨줈洹몃옩???쒕늿???뺤씤?섏꽭??",
      icon: "event",
    },
  },
  community: {
    columns: [
      {
        title: "?뚰넻 怨듦컙",
        items: [
          { label: "怨듭??ы빆", href: "/community/notice" },
          { label: "?먯쑀 寃뚯떆??", href: "/community/freeboard" },
          { label: "?뺣낫 寃뚯떆??", href: "/community/info" },
          { label: "?됱궗 ?꾧린", href: "/community/review" },
          { label: "吏덈Ц怨??듬?", href: "/community/qna" },
          { label: "?먯＜ 臾삳뒗 吏덈Ц", href: "/community/faq" },
        ],
      },
      {
        title: "誘몃뵒??",
        items: [{ label: "?됱궗 媛ㅻ윭由?", href: "/gallery/eventgallery" }],
      },
    ],
    promo: {
      image: "/promo_community.jpg",
      title: "而ㅻ??덊떚",
      desc: "李몄뿬 ?꾧린? ?좎슜???뺣낫瑜?而ㅻ??덊떚?먯꽌 ?뺤씤?섏꽭??",
      icon: "community",
    },
  },
  registration: {
    columns: [
      {
        title: "李멸? ?좎껌",
        items: [
          { label: "?됱궗 李멸? ?좎껌", href: "/registration/apply" },
          { label: "?좎껌 ?댁뿭 議고쉶", href: "/registration/applyhistory" },
          { label: "寃곗젣 ?댁뿭", href: "/registration/paymenthistory" },
          { label: "QR 泥댄겕??", href: "/registration/qrcheckin" },
        ],
      },
      {
        title: "李몄뿬 ?덈궡",
        items: [{ label: "?꾩옣 ?댁슜 ?덈궡", href: "/guide/operation" }],
      },
    ],
    promo: {
      image: "/promo_registration.jpg",
      title: "李멸? ?좎껌",
      desc: "李멸? ?좎껌遺???꾩옣 ?댁슜源뚯? 鍮좊Ⅴ寃??뺤씤?섏꽭??",
      icon: "registration",
    },
  },
  realtime: {
    columns: [
      {
        title: "?ㅼ떆媛??꾪솴",
        items: [
          { label: "?듯빀 ?꾪솴", href: "/realtime/dashboard" },
          { label: "?湲??꾪솴", href: "/realtime/waitingstatus" },
          { label: "泥댄겕???꾪솴", href: "/realtime/checkinstatus" },
          { label: "?ы몴 ?꾪솴", href: "/realtime/votestatus" },
        ],
      },
    ],
    promo: {
      image: "/promo_realtime.jpg",
      title: "?ㅼ떆媛??꾪솴",
      desc: "?됱궗?μ쓽 二쇱슂 吏?쒕? ?ㅼ떆媛꾩쑝濡??뺤씤?????덉뒿?덈떎.",
      icon: "realtime",
    },
  },
};

const navItems = [
  { label: "?됱궗", menuKey: "events" },
  { label: "而ㅻ??덊떚", menuKey: "community" },
  { label: "李멸??좎껌", menuKey: "registration" },
  { label: "?ㅼ떆媛꾪쁽??", href: "/realtime/dashboard" },
];

/* ?????????????????????????????????????????????
   MEGA MENU LINK ITEM
????????????????????????????????????????????? */
const MegaLink = ({ item, onNavigate }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={item.href}
      onClick={(e) => {
        e.preventDefault();
        onNavigate(item.href);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        padding: "5px 0",
        fontSize: 15,
        fontFamily: FONT,
        fontWeight: 500,
        color: hovered ? "#000" : "#333",
        textDecoration: hovered ? "underline" : "none",
        textUnderlineOffset: "4px",
        transition: "color 0.15s",
        lineHeight: 1.55,
      }}
    >
      {item.label}
    </a>
  );
};

/* ?????????????????????????????????????????????
   PROMO ICON MAP
????????????????????????????????????????????? */
const PROMO_ICONS = {
  event: { Icon: CalendarHeart, bg: "#eff4ff", color: "#02A17E" },
  community: { Icon: MessageCircleHeart, bg: "#fef3f2", color: "#e04545" },
  registration: { Icon: TicketCheck, bg: "#ecfdf5", color: "#059669" },
  realtime: { Icon: Activity, bg: "#fef9ee", color: "#ea580c" },
};

const PromoCard = ({ promo }) => {
  const iconCfg = PROMO_ICONS[promo.icon] || PROMO_ICONS.event;
  const { Icon, bg, color } = iconCfg;

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        backgroundColor: "#f7f8fa",
        borderRadius: 18,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "5 / 3",
          backgroundColor: "#e8edf3",
          overflow: "hidden",
        }}
      >
        <img
          src={promo.image}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentElement.style.background =
              "linear-gradient(135deg, #dce3ed 0%, #c5d0e0 100%)";
          }}
        />
      </div>
      <div style={{ padding: "16px 18px 20px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontFamily: FONT,
              fontWeight: 700,
              color: "rgb(127, 127, 127)",
            }}
          >
            {promo.title}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontFamily: FONT,
            fontWeight: 500,
            color: "rgb(127, 127, 127)",
            lineHeight: 1.5,
          }}
        >
          {promo.desc}
        </p>
      </div>
    </div>
  );
};

/* ?????????????????????????????????????????????
   DROPDOWN CARD (compact, fixed below header)
????????????????????????????????????????????? */
const DropdownCard = ({ menuData, onNavigate, topOffset = 92 }) => {
  if (!menuData) return null;
  const { columns, promo } = menuData;

  return (
    <div
      style={{
        position: "fixed",
        top: topOffset,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1001,
        backgroundColor: "#fff",
        borderRadius: "0 0 20px 20px",
        padding: "28px 36px 26px",
        display: "flex",
        gap: 0,
        animation: "megaSlideDown 0.18s ease",
      }}
    >
      {/* Columns */}
      <div style={{ display: "flex", gap: 48 }}>
        {columns.map((col, i) => (
          <div key={i} style={{ minWidth: 130 }}>
            <div
              style={{
                fontSize: 14,
                fontFamily: FONT,
                fontWeight: 400,
                color: "#999",
                marginBottom: 14,
                lineHeight: 1,
              }}
            >
              {col.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {col.items.map((item, j) => (
                <MegaLink key={j} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      {promo && (
        <div style={{ width: 1, background: "#f0f0f0", margin: "0 36px", flexShrink: 0 }} />
      )}

      {/* Promo Card (right side ??Kakao ESG style) */}
      {promo && (
        <PromoCard promo={promo} />
      )}
    </div>
  );
};

/* ?????????????????????????????????????????????
   SEARCH PANEL (dropdown style, below header)
????????????????????????????????????????????? */
const POPULAR_TAGS = [
  { label: "#?됱궗?덈궡", to: "/event/current" },
  { label: "#李멸??좎껌", to: "/registration/apply" },
  { label: "#?꾨줈洹몃옩", to: "/program/current" },
  { label: "#泥댄겕??", to: "/registration/qrcheckin" },
  { label: "#媛ㅻ윭由?", to: "/gallery/eventgallery" },
];

const SearchPanel = ({
  onClose,
  onSearch,
  onNavigate,
  topOffset = 92,
  compact = false,
  mobile = false,
}) => {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  /* ?붾컮?댁뒪 寃??*/
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await eventApi.getEvents({ keyword: trimmed, size: 5 });
        const data = res.data?.data?.content || res.data?.content || [];
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearched(true);
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const formatDate = (start, end) => {
    if (!start) return "";
    const fmt = (d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}`;
    };
    return end ? `${fmt(start)} ~ ${fmt(end)}` : fmt(start);
  };

  const statusLabel = (s) => {
    const m = { PLANNED: "?덉젙", ONGOING: "吏꾪뻾以?", ENDED: "醫낅즺" };
    return m[s] || s;
  };
  const statusColor = (s) => {
    const m = { PLANNED: "#F59E0B", ONGOING: "#22C55E", ENDED: "#9496A6" };
    return m[s] || "#9496A6";
  };

  const panelPadding = mobile ? "16px 12px 14px" : compact ? "24px 16px 22px" : "48px 36px 40px";
  const panelGap = mobile ? 14 : compact ? 18 : 24;
  const panelRadius = mobile ? "0 0 16px 16px" : compact ? "0 0 18px 18px" : "0 0 20px 20px";
  const formMaxWidth = compact ? "100%" : 720;
  const searchHeight = mobile ? 46 : compact ? 54 : 64;
  const searchGap = mobile ? 10 : compact ? 12 : 16;
  const searchPadding = mobile ? "0 14px" : compact ? "0 18px" : "0 30px";
  const inputFontSize = mobile ? 15 : compact ? 16 : 20;
  const resultMaxWidth = compact ? "100%" : 720;

  return (
    <div
      style={{
        position: "fixed",
        top: topOffset,
        left: 0,
        right: 0,
        zIndex: 1001,
        backgroundColor: "#fff",
        borderRadius: panelRadius,
        padding: panelPadding,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: panelGap,
        animation: "searchSlideDown 0.18s ease",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: formMaxWidth }}>
        <div style={{
          display: "flex", alignItems: "center", gap: searchGap,
          background: "#222", borderRadius: 999,
          padding: searchPadding, height: searchHeight,
        }}>
          <Search size={mobile ? 16 : compact ? 18 : 22} color="#999" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="?대뼡 ?됱궗瑜?李얘퀬 怨꾩꽭??"
            style={{
              flex: 1, border: "none", background: "none", outline: "none",
              color: "#fff", fontSize: inputFontSize, fontWeight: 500,
              fontFamily: FONT,
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              style={{ border: "none", background: "none", cursor: "pointer", display: "flex", padding: 0 }}
            >
              <X size={16} color="#999" />
            </button>
          )}
        </div>
      </form>

      {/* 寃??寃곌낵 or ?멸린 ?쒓렇 */}
      {searched && query.trim() ? (
        <div style={{ width: "100%", maxWidth: resultMaxWidth }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#999", fontSize: 14, fontFamily: FONT }}>
              寃??以?..
            </div>
          ) : results.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8, fontFamily: FONT }}>
                寃??寃곌낵 {results.length}嫄?              </div>
              {results.map((evt) => (
                <button
                  key={evt.eventId}
                  type="button"
                  onClick={() => { onClose(); onNavigate(`/event/eventschedule?eventId=${evt.eventId}`); }}
                  style={{
                    display: "flex", alignItems: "center", gap: compact ? 12 : 16,
                    padding: compact ? "12px 14px" : "14px 16px", borderRadius: 14,
                    border: "none", background: "#fff", cursor: "pointer",
                    textAlign: "left", fontFamily: FONT, width: "100%",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f8fa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  {/* ?몃꽕??*/}
                  <div style={{
                    width: compact ? 48 : 56, height: compact ? 48 : 56, borderRadius: 12, flexShrink: 0, overflow: "hidden",
                    background: "#f0f0f0",
                  }}>
                    {evt.imageUrl ? (
                      <img
                        src={toPublicAssetUrl(evt.imageUrl)}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%", display: "flex",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <CalendarHeart size={22} color="#ccc" />
                      </div>
                    )}
                  </div>
                  {/* ?뺣낫 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: mobile ? 14 : 15, fontWeight: 700, color: "#222",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {evt.eventName}
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: compact ? 8 : 12,
                      marginTop: 4, fontSize: compact ? 12 : 13, color: "#999",
                      flexWrap: compact ? "wrap" : "nowrap",
                    }}>
                      {evt.location && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <MapPin size={12} /> {evt.location}
                        </span>
                      )}
                      {evt.startAt && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Calendar size={12} /> {formatDate(evt.startAt, evt.endAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* ?곹깭 */}
                  {evt.status && (
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: statusColor(evt.status),
                      background: `${statusColor(evt.status)}18`,
                      padding: mobile ? "3px 8px" : "4px 10px", borderRadius: 20, flexShrink: 0,
                    }}>
                      {statusLabel(evt.status)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            /* 寃곌낵 ?놁쓬 */
            <div style={{
              textAlign: "center", padding: "32px 0",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: mobile ? 46 : 52, height: mobile ? 46 : 52, borderRadius: "50%", background: "#f5f5f5",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <SearchX size={mobile ? 20 : 24} color="#ccc" />
              </div>
              <div style={{ fontSize: mobile ? 14 : 15, fontWeight: 700, color: "#444", fontFamily: FONT }}>
                '{query.trim()}'?????寃??寃곌낵媛 ?놁뼱??              </div>
              <div style={{ fontSize: mobile ? 12 : 13, color: "#aaa", fontFamily: FONT, lineHeight: 1.5 }}>
                ?ㅻⅨ ?ㅼ썙?쒕줈 寃?됲븯嫄곕굹, ?꾨옒 ?쒓렇瑜??뚮윭蹂댁꽭??              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => { onClose(); onNavigate(tag.to); }}
                    style={{
                      padding: mobile ? "6px 13px" : "7px 16px", borderRadius: 999,
                      border: "1px solid #e5e7eb", background: "#fff",
                      fontSize: mobile ? 13 : 14, fontWeight: 600, color: "rgb(161,161,161)",
                      fontFamily: FONT, cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 湲곕낯: ?멸린 ?쒓렇 */
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => { onClose(); onNavigate(tag.to); }}
              style={{
                padding: mobile ? "6px 13px" : "7px 16px", borderRadius: 999,
                border: "1px solid #e5e7eb", background: "#fff",
                fontSize: mobile ? 13 : 14, fontWeight: 600, color: "rgb(161,161,161)",
                letterSpacing: "0px",
                fontFamily: FONT, cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
            >
              {tag.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ?????????????????????????????????????????????
   MAIN HEADER
????????????????????????????????????????????? */
export default function PupooHeader() {
  const navigate = useNavigate();
  const { isAuthed, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const unreadCountRef = useRef(0);
  const headerRef = useRef(null);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const isCompact = viewportWidth < 1024;
  const headerHeight = isMobile ? 58 : isTablet ? 72 : 92;
  const mobileShortcutHeight = isMobile ? 24 : 0;
  const compactTopOffset = isMobile ? headerHeight + mobileShortcutHeight : headerHeight;

  /* ?? scroll listener ?? */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncViewport = () => setViewportWidth(window.innerWidth);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  /* ?? unread count sync ?? */
  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!isAuthed) {
      unreadCountRef.current = 0;
      setUnreadCount(0);
      return;
    }
    let disposed = false;
    const syncUnreadCount = async ({ forceEmit = false } = {}) => {
      try {
        const nextCount = Math.max(0, Number(await notificationApi.getUnreadCount()) || 0);
        if (disposed) return;
        const prevCount = unreadCountRef.current;
        unreadCountRef.current = nextCount;
        setUnreadCount(nextCount);
        if (forceEmit || prevCount !== nextCount) emitNotificationUnreadCount(nextCount);
      } catch {
        if (disposed) return;
        unreadCountRef.current = 0;
        setUnreadCount(0);
      }
    };
    syncUnreadCount({ forceEmit: true });
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      syncUnreadCount();
    }, 5000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncUnreadCount();
    };
    const handleWindowFocus = () => syncUnreadCount();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [isAuthed]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleUnreadCountChange = (event) => {
      const nextCount = Number(event?.detail?.count);
      if (Number.isFinite(nextCount)) setUnreadCount(Math.max(0, nextCount));
    };
    window.addEventListener(NOTIFICATION_UNREAD_COUNT_EVENT, handleUnreadCountChange);
    return () => window.removeEventListener(NOTIFICATION_UNREAD_COUNT_EVENT, handleUnreadCountChange);
  }, []);

  /* ?? outside click ?? */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setActiveMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ?? close on route change ?? */
  useEffect(() => {
    setActiveMenu(null);
    setSearchOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isCompact) setMobileMenuOpen(false);
  }, [isCompact]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const root = document.documentElement;
    root.style.setProperty("--pupoo-site-header-height", `${headerHeight}px`);
    root.style.setProperty("--pupoo-site-header-offset", `${compactTopOffset}px`);
    root.style.setProperty("--pupoo-site-quicknav-height", `${mobileShortcutHeight}px`);
    return () => {
      root.style.removeProperty("--pupoo-site-header-height");
      root.style.removeProperty("--pupoo-site-header-offset");
      root.style.removeProperty("--pupoo-site-quicknav-height");
    };
  }, [headerHeight, compactTopOffset, mobileShortcutHeight]);

  const handleNavClick = (menuKey) => {
    setActiveMenu((prev) => (prev === menuKey ? null : menuKey));
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const handleMegaNavigate = (href) => {
    setActiveMenu(null);
    setSearchOpen(false);
    setMobileMenuOpen(false);
    navigate(href);
  };

  const isWhiteMode = !isHome || scrolled || activeMenu !== null || searchOpen || mobileMenuOpen;
  const isLight = isHome && !scrolled && !activeMenu && !searchOpen;
  const textColor = isWhiteMode ? "#222" : "#fff";
  const iconColor = isWhiteMode ? "#222" : "#fff";
  const mobileActionIconStyle = {
    width: 32,
    height: 32,
    borderRadius: 999,
    border: isWhiteMode ? "1px solid #e7ebf0" : "1px solid rgba(255,255,255,0.18)",
    background: isWhiteMode ? "#fff" : "rgba(255,255,255,0.12)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: textColor,
    textDecoration: "none",
    fontFamily: FONT,
    flexShrink: 0,
  };
  const mobileQuickLinks = [
    { label: "??", to: "/" },
    { label: "?됱궗", to: "/event/current" },
    { label: "而ㅻ??덊떚", to: "/community/notice" },
  ];

  return (
    <>
      <style>{`
        @keyframes megaSlideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes searchFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes searchSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .kakao-nav-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: auto;
          padding: 10px 20px;
          background: none;
          border: 1px solid transparent;
          border-radius: 999px;
          font-size: 17px;
          font-family: ${FONT};
          font-weight: 700;
          white-space: nowrap;
          letter-spacing: -0.02em;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          line-height: 1;
          margin: 0;
        }
        .kakao-nav-btn.light {
          color: rgba(255,255,255,0.85);
        }
        .kakao-nav-btn.light:hover,
        .kakao-nav-btn.light.active {
          color: #fff;
          border-color: #fff;
        }
        .kakao-nav-btn.dark {
          color: #555;
        }
        .kakao-nav-btn.dark:hover {
          color: #333;
          background: #f0f0f0;
          border-color: #f0f0f0;
        }
        .kakao-nav-btn.dark.active {
          color: #fff;
          background: #222;
          border-color: #222;
        }
        .kakao-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: none;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.2s ease;
          text-decoration: none;
          position: relative;
          flex-shrink: 0;
        }
        .kakao-icon-btn:hover {
          background-color: rgba(0,0,0,0.06);
          transform: scale(1.08);
        }
        .kakao-icon-btn.light:hover {
          background-color: rgba(255,255,255,0.15);
        }
        /* ?? custom tooltip ?? */
        .kakao-icon-btn .ktt {
          position: absolute;
          bottom: -36px;
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          padding: 5px 12px;
          border-radius: 8px;
          background: #222;
          color: #fff;
          font-family: 'JeonjuCraftGothic', Pretendard, sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: -0.02em;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          z-index: 9999;
        }
        .kakao-icon-btn.light .ktt {
          background: rgba(255,255,255,0.92);
          color: #222;
          box-shadow: 0 2px 12px rgba(0,0,0,0.12);
        }
        .kakao-icon-btn .ktt::before {
          content: '';
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 5px solid #222;
        }
        .kakao-icon-btn.light .ktt::before {
          border-bottom-color: rgba(255,255,255,0.92);
        }
        .kakao-icon-btn:hover .ktt {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        /* ?? CTA Button ?? */
        .kakao-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 999px;
          background: #02A17E;
          color: #fff;
          font-family: 'JeonjuCraftGothic', Pretendard, sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.02em;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 2px 12px rgba(37,99,235,0.3);
          flex-shrink: 0;
          margin-right: 8px;
        }
        .kakao-cta:hover {
          background: #028A6C;
          transform: scale(1.04);
          box-shadow: 0 4px 20px rgba(37,99,235,0.4);
        }
        .kakao-cta:active {
          transform: scale(0.97);
        }
        .kakao-cta.light {
          background: #fff;
          color: #02A17E;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }
        .kakao-cta.light:hover {
          background: #f0f4ff;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .pupoo-mobile-only {
          display: none;
        }
        .pupoo-desktop-only {
          display: flex;
        }
        @media (max-width: 1023px) {
          .pupoo-mobile-only {
            display: flex;
          }
          .pupoo-desktop-only {
            display: none !important;
          }
          .kakao-icon-btn .ktt {
            display: none;
          }
          .kakao-icon-btn {
            width: 38px;
            height: 38px;
            border-radius: 10px;
          }
        }
        @media (max-width: 767px) {
          .kakao-icon-btn {
            width: 34px;
            height: 34px;
            border-radius: 9px;
          }
        }
      `}</style>

      <div ref={headerRef} style={{ position: "relative", zIndex: 3000 }}>
        {/* ?? HEADER BAR ?? */}
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: headerHeight,
            display: "flex",
            alignItems: "center",
            zIndex: 1002,
            backgroundColor: isWhiteMode ? "#fff" : "transparent",
            borderBottom: isWhiteMode ? "1px solid #f0f0f0" : "none",
            transition: "background-color 0.3s ease",
          }}
        >
          <div
            style={{
              maxWidth: 1712,
              width: "100%",
              margin: "0 auto",
              padding: isMobile ? "0 12px" : isTablet ? "0 20px" : "0 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "100%",
            }}
          >
            {/* ?? LEFT: Logo ?? */}
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                flexShrink: 0,
                marginRight: isCompact ? 0 : 40,
              }}
            >
              <img
                src={isLight ? "/logo_white2.png" : "/logo_olive.png"}
                alt="Pupoo"
                style={{
                  height: isMobile ? 22 : isTablet ? 24 : 28,
                  width: "auto",
                  display: "block",
                }}
              />
            </Link>

            {/* ?? CENTER: Nav (Kakao-style pill buttons) ?? */}
            <nav
              className="pupoo-desktop-only"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                height: "100%",
                columnGap: 52,
              }}
            >
              {navItems.map((item) => (
                <button
                  key={item.menuKey || item.href}
                  className={`kakao-nav-btn ${isLight ? "light" : "dark"} ${activeMenu === item.menuKey ? "active" : ""}`}
                  onClick={() => item.href ? handleMegaNavigate(item.href) : handleNavClick(item.menuKey)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* ?? RIGHT: Icons ?? */}
            <div
              className="pupoo-desktop-only"
              style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
            >
              {!isAuthed ? (
                <>
                  <button
                    type="button"
                    className={`kakao-icon-btn ${isLight ? "light" : ""}`}
                    onClick={() => { setSearchOpen((v) => !v); setActiveMenu(null); }}
                  >
                    <Search size={20} color={iconColor} strokeWidth={1.8} />
                    <span className="ktt">寃??</span>
                  </button>
                  <Link
                    to="/auth/login"
                    className={`kakao-icon-btn ${isLight ? "light" : ""}`}
                  >
                    <LogIn size={20} color={iconColor} strokeWidth={1.8} />
                    <span className="ktt">濡쒓렇??</span>
                  </Link>
                  <Link
                    to="/auth/join/joinselect"
                    className={`kakao-icon-btn ${isLight ? "light" : ""}`}
                  >
                    <UserPlus size={20} color={iconColor} strokeWidth={1.8} />
                    <span className="ktt">?뚯썝媛??</span>
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={`kakao-icon-btn ${isLight ? "light" : ""}`}
                    onClick={() => { setSearchOpen((v) => !v); setActiveMenu(null); }}
                  >
                    <Search size={20} color={iconColor} strokeWidth={1.8} />
                    <span className="ktt">寃??</span>
                  </button>
                  <Link
                    to="/mypage"
                    className={`kakao-icon-btn ${isLight ? "light" : ""}`}
                  >
                    <UserCircle size={20} color={iconColor} strokeWidth={1.8} />
                    <span className="ktt">留덉씠?섏씠吏</span>
                  </Link>
                  <button
                    className={`kakao-icon-btn ${isLight ? "light" : ""}`}
                    onClick={() => {
                      logout();
                      navigate("/", { replace: true });
                    }}
                    type="button"
                  >
                    <LogOut size={20} color={iconColor} strokeWidth={1.8} />
                    <span className="ktt">濡쒓렇?꾩썐</span>
                  </button>
                </>
              )}
            </div>

            <div
              className="pupoo-mobile-only"
              style={{ display: "none", alignItems: "center", gap: 6, flexShrink: 0 }}
            >
              <button
                type="button"
                className={`kakao-icon-btn ${isLight ? "light" : ""}`}
                onClick={() => {
                  setSearchOpen((v) => !v);
                  setActiveMenu(null);
                  setMobileMenuOpen(false);
                }}
              >
                <Search size={16} color={iconColor} strokeWidth={1.8} />
              </button>
              {isAuthed ? (
                <>
                  <Link
                    to="/mypage"
                    style={mobileActionIconStyle}
                    onClick={() => {
                      setActiveMenu(null);
                      setSearchOpen(false);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <UserCircle size={17} color={iconColor} strokeWidth={1.8} />
                  </Link>
                  <button
                    type="button"
                    style={{ ...mobileActionIconStyle, cursor: "pointer" }}
                    onClick={() => {
                      logout();
                      setActiveMenu(null);
                      setSearchOpen(false);
                      setMobileMenuOpen(false);
                      navigate("/", { replace: true });
                    }}
                  >
                    <LogOut size={17} color={iconColor} strokeWidth={1.8} />
                  </button>
                </>
              ) : (
                <Link
                  to="/auth/login"
                  style={mobileActionIconStyle}
                  onClick={() => {
                    setActiveMenu(null);
                    setSearchOpen(false);
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogIn size={17} color={iconColor} strokeWidth={1.8} />
                </Link>
              )}
              <button
                type="button"
                className={`kakao-icon-btn ${isLight ? "light" : ""}`}
                onClick={() => {
                  setMobileMenuOpen((prev) => !prev);
                  setActiveMenu(null);
                  setSearchOpen(false);
                }}
              >
                {mobileMenuOpen ? (
                  <X size={18} color={iconColor} strokeWidth={1.8} />
                ) : (
                  <Menu size={18} color={iconColor} strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>
        </header>

        {isMobile && (
          <div
            style={{
              position: "fixed",
              top: headerHeight,
              left: 0,
              right: 0,
              zIndex: 1001,
              background: isWhiteMode ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.14)",
              backdropFilter: "blur(14px)",
              borderBottom: isWhiteMode ? "1px solid #edf1f5" : "1px solid rgba(255,255,255,0.16)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 5,
                overflowX: "auto",
                padding: "3px 10px 3px",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
              }}
            >
              {mobileQuickLinks.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      setActiveMenu(null);
                      setSearchOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      flexShrink: 0,
                      height: 18,
                      padding: "0 8px",
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                      fontSize: 11.5,
                      fontWeight: 700,
                      fontFamily: FONT,
                      color: active ? "#fff" : isWhiteMode ? "#4b5563" : "#fff",
                      background: active ? "#02A17E" : isWhiteMode ? "#f3f4f6" : "rgba(255,255,255,0.16)",
                      border: active ? "none" : isWhiteMode ? "1px solid #eef2f7" : "1px solid rgba(255,255,255,0.14)",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ?? DROPDOWN CARD ?? */}
        {!isCompact && activeMenu && megaMenuData[activeMenu] && (
          <DropdownCard
            menuData={megaMenuData[activeMenu]}
            onNavigate={handleMegaNavigate}
            topOffset={headerHeight}
          />
        )}

        {isCompact && mobileMenuOpen && (
          <div
            style={{
              position: "fixed",
              top: compactTopOffset,
              left: 0,
              right: 0,
              zIndex: 1001,
              background: "#fff",
              borderBottomLeftRadius: 20,
              borderBottomRightRadius: 20,
              padding: isMobile ? "12px 12px 14px" : "16px 16px 20px",
              paddingBottom: isCompact
                ? `calc(${isMobile ? 14 : 20}px + env(safe-area-inset-bottom, 0px))`
                : undefined,
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.16)",
              maxHeight: `calc(${isCompact ? "100dvh" : "100vh"} - ${compactTopOffset}px - env(safe-area-inset-bottom, 0px))`,
              overflowY: "auto",
              animation: "searchSlideDown 0.18s ease",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16 }}>
              {navItems.map((item) => {
                if (item.href) {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleMegaNavigate(item.href)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: isMobile ? "12px 14px" : "14px 16px",
                        borderRadius: 14,
                        border: "1px solid #eef2f7",
                        background: "#fff",
                        color: "#222",
                        fontSize: isMobile ? 14 : 15,
                        fontWeight: 700,
                        fontFamily: FONT,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                    </button>
                  );
                }

                const menu = megaMenuData[item.menuKey];
                return (
                  <div
                    key={item.menuKey}
                    style={{
                      border: "1px solid #eef2f7",
                      borderRadius: 16,
                      padding: isMobile ? "12px 12px 4px" : "14px 14px 6px",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        fontSize: isMobile ? 14 : 15,
                        fontWeight: 800,
                        color: "#222",
                        fontFamily: FONT,
                        marginBottom: 10,
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {menu.columns.map((column, index) => (
                        <div key={`${item.menuKey}-${index}`}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#7f7f7f",
                              fontFamily: FONT,
                              marginBottom: 6,
                            }}
                          >
                            {column.title}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {column.items.map((menuItem) => (
                              <button
                                key={menuItem.href}
                                type="button"
                                onClick={() => handleMegaNavigate(menuItem.href)}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  padding: isMobile ? "7px 0" : "8px 0",
                                  textAlign: "left",
                                  fontSize: isMobile ? 13 : 14,
                                  fontWeight: 500,
                                  color: "#333",
                                  fontFamily: FONT,
                                  cursor: "pointer",
                                }}
                              >
                                {menuItem.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div
                style={{
                  border: "1px solid #eef2f7",
                  borderRadius: 16,
                  padding: isMobile ? 12 : 14,
                  background: "#f7f8fa",
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? 8 : 10,
                }}
              >
                {!isAuthed ? (
                  <>
                    <Link
                      to="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        textDecoration: "none",
                        color: "#222",
                        fontSize: isMobile ? 13 : 14,
                        fontWeight: 700,
                        fontFamily: FONT,
                      }}
                    >
                      濡쒓렇??                    </Link>
                    <Link
                      to="/auth/join/joinselect"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        textDecoration: "none",
                        color: "#02A17E",
                        fontSize: isMobile ? 13 : 14,
                        fontWeight: 700,
                        fontFamily: FONT,
                      }}
                    >
                      ?뚯썝媛??                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/mypage"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        textDecoration: "none",
                        color: "#222",
                        fontSize: isMobile ? 13 : 14,
                        fontWeight: 700,
                        fontFamily: FONT,
                      }}
                    >
                      留덉씠?섏씠吏
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                        navigate("/", { replace: true });
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        textAlign: "left",
                        color: "#222",
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: FONT,
                        cursor: "pointer",
                      }}
                    >
                      濡쒓렇?꾩썐
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ?? SEARCH PANEL ?? */}
        {searchOpen && (
          <SearchPanel
            onClose={() => setSearchOpen(false)}
            onSearch={(keyword) => {
              setSearchOpen(false);
              navigate(`/event/current?search=${encodeURIComponent(keyword)}`);
            }}
            onNavigate={(path) => { setSearchOpen(false); navigate(path); }}
            topOffset={compactTopOffset}
            compact={isCompact}
            mobile={isMobile}
          />
        )}

        {/* ?? BACKDROP (dark overlay below header, click to close) ?? */}
        {(activeMenu || searchOpen || mobileMenuOpen) && (
          <div
            onClick={() => {
              setActiveMenu(null);
              setSearchOpen(false);
              setMobileMenuOpen(false);
            }}
            style={{
              position: "fixed",
              top: compactTopOffset,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
              zIndex: 1000,
            }}
          />
        )}
      </div>
    </>
  );
}


