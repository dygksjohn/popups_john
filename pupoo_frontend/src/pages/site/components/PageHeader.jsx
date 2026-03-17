import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

const SECTION_LABELS = {
  event: "행사",
  program: "프로그램",
  community: "커뮤니티",
  realtime: "실시간 현황",
  guide: "이용 안내",
  gallery: "갤러리",
  registration: "참가 신청",
  payment: "참가 신청",
};

const styles = {
  pageHeader: {
    backgroundColor: "#fff",
    marginTop: 150,
  },
  pageHeaderLegacy: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #e9ecef",
    paddingTop: 100,
  },
  pageHeaderSticky: {
    position: "sticky",
    top: 92,
    zIndex: 1200,
    paddingTop: 0,
  },
  inner: {
    width: "min(1400px, calc(100% - 40px))",
    margin: "0 auto",
  },
  innerLegacy: {
    width: "min(1350px, calc(100% - 50px))",
    margin: "0 auto",
  },
  topRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    fontSize: 46,
    fontWeight: 800,
    color: "#111827",
    margin: 0,
    letterSpacing: "-1px",
    lineHeight: "66px",
  },
  titleLegacy: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
    margin: "0 0 4px",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    color: "#b0b5bd",
    fontWeight: 400,
    whiteSpace: "nowrap",
    paddingTop: 6,
    flexShrink: 0,
  },
  breadcrumbSep: {
    color: "#d1d5db",
    fontSize: 10,
  },
  breadcrumbCurrent: {
    color: "#6b7280",
    fontWeight: 600,
  },
  breadcrumbLegacy: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12.5,
    color: "#b0b5bd",
    fontWeight: 400,
    whiteSpace: "nowrap",
    paddingTop: 6,
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 20,
    color: "#6b7280",
    fontWeight: 400,
    margin: "8px 0 0",
    lineHeight: 1.6,
  },
  subtitleLegacy: {
    fontSize: 13.5,
    color: "#6b7280",
    fontWeight: 400,
    margin: "0 0 20px",
    lineHeight: 1.6,
  },
  searchArea: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px 0 0",
  },
  searchAreaLegacy: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 0 14px",
  },
  tabs: {
    display: "flex",
    gap: 0,
    marginTop: 48,
  },
  tabsLegacy: {
    display: "flex",
    gap: 0,
  },
  tabBase: {
    flex: 1,
    padding: "13px 8px",
    fontSize: 17,
    fontWeight: 600,
    background: "#f3f4f6",
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'Kakao Big Sans', Apple SD Gothic Neo, Malgun Gothic, '맑은 고딕', sans-serif",
    color: "#6b7280",
    textAlign: "center",
    whiteSpace: "nowrap",
    borderRadius: 0,
  },
  tabBaseLegacy: {
    padding: "10px 20px",
    fontSize: 13.5,
    fontWeight: 600,
    background: "none",
    border: "none",
    cursor: "pointer",
    borderBottom: "2.5px solid transparent",
    transition: "all 0.15s",
    fontFamily: "inherit",
  },
  tabDefault: {
    color: "#6b7280",
  },
  tabDefaultLegacy: {
    color: "#6b7280",
  },
  tabActive: {
    color: "#fff",
    background: "#1a4fd6",
    borderRadius: 8,
  },
  tabActiveLegacy: {
    color: "#1a4fd6",
    borderBottomColor: "#1a4fd6",
  },
  tabHover: {
    color: "#1a4fd6",
  },
  tabHoverLegacy: {
    color: "#1a4fd6",
  },
};

export default function PageHeader({
  title,
  subtitle,
  icon,
  titleStyle,
  subtitleStyle,
  categories,
  currentPath,
  breadcrumbTitle,
  onNavigate,
  onTabClick,
  children,
  className,
  stickyCategories = false,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const hiddenPaths = new Set(["/event/preregister"]);

  const programMatch = location.pathname.match(
    /^\/program\/(?:all|current|upcoming|closed|experience|session|contest)(?:\/([^/?#]+))?/,
  );
  const realtimeMatch = location.pathname.match(
    /^\/realtime\/(?:dashboard|waitingstatus|checkinstatus|votestatus)(?:\/([^/?#]+))?/,
  );
  const currentProgramEventId = programMatch?.[1] || null;
  const currentRealtimeEventId = realtimeMatch?.[1] || null;

  const isProgramTabPath = (path) =>
    /^\/program\/(?:all|current|upcoming|closed|experience|session|contest)(?:\/[^/?#]+)?$/.test(path);
  const hasProgramEventIdInPath = (path) =>
    /^\/program\/(?:all|current|upcoming|closed|experience|session|contest)\/[^/?#]+$/.test(path);

  const isRealtimeTabPath = (path) =>
    /^\/realtime\/(?:dashboard|waitingstatus|checkinstatus|votestatus)(?:\/[^/?#]+)?$/.test(path);
  const hasRealtimeEventIdInPath = (path) =>
    /^\/realtime\/(?:dashboard|waitingstatus|checkinstatus|votestatus)\/[^/?#]+$/.test(path);

  const resolveTargetPath = (path) => {
    if (
      currentProgramEventId &&
      isProgramTabPath(path) &&
      !hasProgramEventIdInPath(path)
    ) {
      return `${path}/${currentProgramEventId}`;
    }

    if (
      currentRealtimeEventId &&
      isRealtimeTabPath(path) &&
      !hasRealtimeEventIdInPath(path)
    ) {
      return `${path}/${currentRealtimeEventId}`;
    }

    return path;
  };

  const filteredCategories = (categories || []).filter(
    (cat) => !hiddenPaths.has(cat.path),
  );

  const activePath = currentPath || location.pathname;
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const section = pathSegments[0] || "";
  const sectionLabel = SECTION_LABELS[section];
  const lastCrumb = breadcrumbTitle || title;
  const breadcrumbItems = sectionLabel
    ? ["홈", sectionLabel, lastCrumb].filter(Boolean)
    : ["홈", lastCrumb].filter(Boolean);

  const useLegacyStickyStyle = stickyCategories;
  const pageHeaderStyle = useLegacyStickyStyle
    ? { ...styles.pageHeaderLegacy, ...styles.pageHeaderSticky }
    : styles.pageHeader;
  const innerStyle = useLegacyStickyStyle ? styles.innerLegacy : styles.inner;
  const titleBaseStyle = useLegacyStickyStyle ? styles.titleLegacy : styles.title;
  const subtitleBaseStyle = useLegacyStickyStyle
    ? styles.subtitleLegacy
    : styles.subtitle;
  const breadcrumbStyle = useLegacyStickyStyle
    ? styles.breadcrumbLegacy
    : styles.breadcrumb;
  const searchAreaStyle = useLegacyStickyStyle
    ? styles.searchAreaLegacy
    : styles.searchArea;
  const tabsStyle = useLegacyStickyStyle ? styles.tabsLegacy : styles.tabs;
  const tabBaseStyle = useLegacyStickyStyle
    ? styles.tabBaseLegacy
    : styles.tabBase;
  const tabDefaultStyle = useLegacyStickyStyle
    ? styles.tabDefaultLegacy
    : styles.tabDefault;
  const tabActiveStyle = useLegacyStickyStyle
    ? styles.tabActiveLegacy
    : styles.tabActive;
  const tabHoverStyle = useLegacyStickyStyle
    ? styles.tabHoverLegacy
    : styles.tabHover;

  const handleNavigate = (targetPath) => {
    if (onTabClick) {
      onTabClick(targetPath);
      return;
    }

    if (onNavigate) {
      onNavigate(targetPath);
    }

    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  return (
    <div style={pageHeaderStyle} className={className || ""}>
      <div style={innerStyle}>
        <div style={styles.topRow}>
          <div>
            {title ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {icon ? icon : null}
                <h1 style={{ ...titleBaseStyle, ...titleStyle }}>{title}</h1>
              </div>
            ) : null}
            {subtitle ? (
              <p style={{ ...subtitleBaseStyle, ...subtitleStyle }}>{subtitle}</p>
            ) : null}
          </div>
          {title ? (
            <div style={breadcrumbStyle}>
              <Home size={12} style={{ color: "#b0b5bd" }} />
              {breadcrumbItems.map((item, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {i > 0 ? <span style={styles.breadcrumbSep}>{">"}</span> : null}
                  <span
                    style={
                      i === breadcrumbItems.length - 1
                        ? styles.breadcrumbCurrent
                        : undefined
                    }
                  >
                    {item}
                  </span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {children ? <div style={searchAreaStyle}>{children}</div> : null}

        {filteredCategories.length > 0 ? (
          <div style={tabsStyle}>
            {filteredCategories.map((cat, i) => {
              const targetPath = resolveTargetPath(cat.path);
              const isActive = activePath === targetPath;
              const isHovered = hoveredIdx === i;

              let btnStyle = { ...tabBaseStyle, ...tabDefaultStyle };
              if (isActive) {
                btnStyle = { ...btnStyle, ...tabActiveStyle };
              } else if (isHovered) {
                btnStyle = { ...btnStyle, ...tabHoverStyle };
              }

              return (
                <button
                  key={cat.path}
                  style={btnStyle}
                  onClick={() => handleNavigate(targetPath)}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {cat.icon ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        marginRight: 6,
                      }}
                    >
                      {cat.icon}
                    </span>
                  ) : null}
                  {cat.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
