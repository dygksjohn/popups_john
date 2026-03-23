import { useEffect, useState } from "react";
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
    backgroundColor: "transparent",
    paddingTop: 150,
  },
  inner: {
    width: "min(1400px, calc(100% - 40px))",
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
    wordBreak: "keep-all",
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
  subtitle: {
    fontSize: 20,
    color: "#6b7280",
    fontWeight: 400,
    margin: "8px 0 0",
    lineHeight: 1.6,
    wordBreak: "keep-all",
  },
  searchArea: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px 0 0",
  },
  tabs: {
    display: "flex",
    gap: 0,
    marginTop: 48,
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
    fontFamily:
      "'JeonjuCraftGothic', Apple SD Gothic Neo, Malgun Gothic, '맑은 고딕', sans-serif",
    color: "#6b7280",
    textAlign: "center",
    whiteSpace: "nowrap",
    borderRadius: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tabActive: {
    color: "#fff",
    background: "#02A17E",
    borderRadius: 8,
  },
  tabHover: {
    color: "#02A17E",
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
  onTabClick,
  tabCounts,
  children,
  className,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  const navigate = useNavigate();
  const location = useLocation();
  const hiddenPaths = new Set(["/event/preregister"]);
  const programMatch = location.pathname.match(
    /^\/program\/(?:all|current|upcoming|closed|experience|session|contest)(?:\/([^/?#]+))?/,
  );
  const currentEventId = programMatch?.[1] || null;

  const isProgramTabPath = (path) =>
    /^\/program\/(?:all|current|upcoming|closed|experience|session|contest)(?:\/[^/?#]+)?$/.test(
      path,
    );

  const hasEventIdInPath = (path) =>
    /^\/program\/(?:all|current|upcoming|closed|experience|session|contest)\/[^/?#]+$/.test(
      path,
    );

  const resolveTargetPath = (path) => {
    if (!currentEventId) return path;
    if (!isProgramTabPath(path)) return path;
    if (hasEventIdInPath(path)) return path;
    return `${path}/${currentEventId}`;
  };

  const filteredCategories = (categories || []).filter(
    (cat) => !hiddenPaths.has(cat.path),
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncViewport = () => setViewportWidth(window.innerWidth);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const activePath = currentPath || location.pathname;
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const section = pathSegments[0] || "";
  const sectionLabel = SECTION_LABELS[section];
  const lastCrumb = breadcrumbTitle || title;
  const breadcrumbItems = sectionLabel
    ? ["홈", sectionLabel, lastCrumb]
    : ["홈", lastCrumb];

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const isCompact = viewportWidth < 1024;

  const pageHeaderStyle = {
    ...styles.pageHeader,
    paddingTop: isMobile
      ? "calc(var(--pupoo-site-header-offset, 96px) + 48px)"
      : isTablet
        ? "calc(var(--pupoo-site-header-height, 72px) + 36px)"
        : styles.pageHeader.paddingTop,
    paddingBottom: isMobile ? 36 : undefined,
  };

  const innerStyle = {
    ...styles.inner,
    width: isMobile
      ? "calc(100% - 20px)"
      : isTablet
        ? "calc(100% - 28px)"
        : styles.inner.width,
  };

  const topRowStyle = {
    ...styles.topRow,
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "flex-start" : styles.topRow.alignItems,
    gap: isMobile ? 12 : isTablet ? 16 : styles.topRow.gap,
  };

  const mergedTitleStyle = {
    ...styles.title,
    ...titleStyle,
    // responsive overrides always win — titleStyle cannot override these
    fontSize: isMobile ? 18 : isTablet ? 30 : (titleStyle?.fontSize ?? styles.title.fontSize),
    lineHeight: isMobile ? "1.3" : isTablet ? "1.22" : (titleStyle?.lineHeight ?? styles.title.lineHeight),
    letterSpacing: isMobile ? "-0.3px" : (titleStyle?.letterSpacing ?? styles.title.letterSpacing),
  };

  const mergedSubtitleStyle = {
    ...styles.subtitle,
    ...subtitleStyle,
    fontSize: isMobile ? 12 : isTablet ? 15 : (subtitleStyle?.fontSize ?? styles.subtitle.fontSize),
    margin: isMobile || isTablet ? "6px 0 0" : styles.subtitle.margin,
    lineHeight: isMobile ? 1.5 : styles.subtitle.lineHeight,
  };

  const breadcrumbStyle = {
    ...styles.breadcrumb,
    width: isMobile ? "100%" : "auto",
    justifyContent: isMobile ? "flex-start" : "flex-end",
    whiteSpace: isMobile ? "normal" : styles.breadcrumb.whiteSpace,
    flexWrap: isMobile ? "wrap" : "nowrap",
    paddingTop: isMobile ? 0 : styles.breadcrumb.paddingTop,
    fontSize: isMobile ? 12.5 : styles.breadcrumb.fontSize,
    gap: isMobile ? 4 : styles.breadcrumb.gap,
    lineHeight: isMobile ? 1.45 : 1,
  };

  const searchAreaStyle = {
    ...styles.searchArea,
    width: "100%",
    padding: isMobile ? "16px 0 0" : isTablet ? "22px 0 0" : styles.searchArea.padding,
  };

  const tabsStyle = {
    ...styles.tabs,
    marginTop: isMobile ? 16 : isTablet ? 32 : styles.tabs.marginTop,
    display: "flex",
    flexWrap: "nowrap",
    overflowX: isMobile ? "auto" : isCompact ? "auto" : "visible",
    overflowY: "hidden",
    gap: isMobile ? 6 : styles.tabs.gap,
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    paddingBottom: isMobile ? 4 : isCompact ? 2 : 0,
  };

  return (
    <div style={pageHeaderStyle} className={className || ""}>
      <div style={innerStyle}>
        <div style={topRowStyle}>
          <div style={{ minWidth: 0, width: isMobile ? "100%" : "auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 6 : 12,
              }}
            >
              {icon && (
                <span style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: isMobile ? 22 : isTablet ? 34 : "auto",
                  height: isMobile ? 22 : isTablet ? 34 : "auto",
                  overflow: "hidden",
                }}>
                  <span style={{
                    display: "inline-flex",
                    transform: isMobile ? "scale(0.52)" : isTablet ? "scale(0.8)" : "none",
                    transformOrigin: "center center",
                  }}>
                    {icon}
                  </span>
                </span>
              )}
              <h1 style={mergedTitleStyle}>{title}</h1>
            </div>
            {subtitle && <p style={mergedSubtitleStyle}>{subtitle}</p>}
          </div>
          <div style={breadcrumbStyle}>
            <Home size={12} style={{ color: "#b0b5bd", flexShrink: 0 }} />
            {breadcrumbItems.map((item, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {i > 0 && <span style={styles.breadcrumbSep}>{">"}</span>}
                <span
                  style={i === breadcrumbItems.length - 1 ? styles.breadcrumbCurrent : undefined}
                >
                  {item}
                </span>
              </span>
            ))}
          </div>
        </div>

        {children && <div style={searchAreaStyle}>{children}</div>}

        {filteredCategories.length > 0 && (
          <div style={tabsStyle}>
            {filteredCategories.map((cat, i) => {
              const targetPath = resolveTargetPath(cat.path);
              const isActive = activePath === targetPath;
              const isHovered = hoveredIdx === i;

              let btnStyle = {
                ...styles.tabBase,
                flex: "0 0 auto",
                minWidth: 0,
                width: "auto",
                minHeight: isMobile ? 34 : 44,
                padding: isMobile
                  ? "0 14px"
                  : isTablet
                    ? "11px 14px"
                    : styles.tabBase.padding,
                fontSize: isMobile ? 13 : isTablet ? 15 : styles.tabBase.fontSize,
                whiteSpace: "nowrap",
                borderRadius: isMobile ? 999 : 0,
                lineHeight: isMobile ? "34px" : undefined,
              };

              if (isActive) {
                btnStyle = { ...btnStyle, ...styles.tabActive };
              } else if (isHovered) {
                btnStyle = { ...btnStyle, ...styles.tabHover };
              }

              return (
                <button
                  key={cat.path}
                  style={btnStyle}
                  onClick={() => (onTabClick ? onTabClick(targetPath) : navigate(targetPath))}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {cat.icon && (
                    <span style={{ display: "inline-flex", alignItems: "center", marginRight: 6 }}>
                      {cat.icon}
                    </span>
                  )}
                  {cat.label}
                  {tabCounts && cat.countKey != null && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 22,
                        height: isMobile ? 20 : 22,
                        borderRadius: 11,
                        padding: "0 6px",
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 700,
                        lineHeight: 1,
                        background: isActive ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.07)",
                        color: isActive ? "#fff" : "#6b7280",
                      }}
                    >
                      {tabCounts[cat.countKey] ?? 0}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
