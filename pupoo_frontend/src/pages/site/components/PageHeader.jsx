import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

const SECTION_LABELS = {
  event: "행사",
  program: "프로그램",
  community: "커뮤니티",
  realtime: "실시간 현황",
  guide: "이용 안내",
  gallery: "갤러리",
  registration: "참가 신청",
  payment: "결제",
};

const styles = {
  pageHeader: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #e9ecef",
    paddingTop: 100,
  },
  pageHeaderSticky: {
    position: "sticky",
    top: 70,
    zIndex: 1200,
    paddingTop: 0,
  },
  inner: {
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
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
    margin: "0 0 4px",
  },
  subtitle: {
    fontSize: 13.5,
    color: "#6b7280",
    fontWeight: 400,
    margin: "0 0 20px",
    lineHeight: 1.6,
  },
  breadcrumb: {
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
  breadcrumbSep: {
    color: "#d1d5db",
    fontSize: 10,
  },
  breadcrumbCurrent: {
    color: "#6b7280",
    fontWeight: 600,
  },
  searchArea: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 0 14px",
  },
  tabs: {
    display: "flex",
    gap: 0,
  },
  tabBase: {
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
  tabActive: {
    color: "#1a4fd6",
    borderBottomColor: "#1a4fd6",
  },
  tabHover: {
    color: "#1a4fd6",
  },
};

export default function PageHeader({
  title,
  subtitle,
  categories,
  currentPath,
  breadcrumbTitle,
  onNavigate,
  onTabClick,
  children,
  stickyCategories = false,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const hiddenPaths = new Set(["/event/preregister"]);
  const activePath = currentPath || location.pathname;

  const programMatch = location.pathname.match(
    /^\/program\/(?:all|current|upcoming|closed|experience|session|contest)(?:\/([^/?#]+))?/,
  );
  const realtimeMatch = location.pathname.match(
    /^\/realtime\/(?:dashboard|waitingstatus|checkinstatus|votestatus)(?:\/([^/?#]+))?/,
  );
  const currentProgramEventId = programMatch?.[1] || null;
  const currentRealtimeEventId = realtimeMatch?.[1] || null;

  const isProgramTabPath = (path) =>
    /^\/program\/(?:all|current|upcoming|closed|experience|session|contest)(?:\/[^/?#]+)?$/.test(
      path,
    );
  const hasProgramEventIdInPath = (path) =>
    /^\/program\/(?:all|current|upcoming|closed|experience|session|contest)\/[^/?#]+$/.test(
      path,
    );

  const isRealtimeTabPath = (path) =>
    /^\/realtime\/(?:dashboard|waitingstatus|checkinstatus|votestatus)(?:\/[^/?#]+)?$/.test(
      path,
    );
  const hasRealtimeEventIdInPath = (path) =>
    /^\/realtime\/(?:dashboard|waitingstatus|checkinstatus|votestatus)\/[^/?#]+$/.test(
      path,
    );

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

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const sectionLabel = SECTION_LABELS[pathSegments[0] || ""];
  const lastCrumb = breadcrumbTitle || title;
  const breadcrumbItems = sectionLabel
    ? ["홈", sectionLabel, lastCrumb]
    : ["홈", lastCrumb];

  const pageHeaderStyle = stickyCategories
    ? { ...styles.pageHeader, ...styles.pageHeaderSticky }
    : styles.pageHeader;

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
    <div style={pageHeaderStyle}>
      <div style={styles.inner}>
        <div style={styles.topRow}>
          <div>
            {title ? <h1 style={styles.title}>{title}</h1> : null}
            {subtitle ? <p style={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {title ? (
            <div style={styles.breadcrumb}>
              <Home size={12} style={{ color: "#b0b5bd" }} />
              {breadcrumbItems.map((item, i) => (
                <span
                  key={`${item}-${i}`}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
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

        {children ? <div style={styles.searchArea}>{children}</div> : null}

        {filteredCategories.length > 0 ? (
          <div style={styles.tabs}>
            {filteredCategories.map((cat, i) => {
              const targetPath = resolveTargetPath(cat.path);
              const isActive = activePath === targetPath;
              const isHovered = hoveredIdx === i;

              let btnStyle = { ...styles.tabBase };
              if (isActive) {
                btnStyle = { ...btnStyle, ...styles.tabActive };
              } else if (isHovered) {
                btnStyle = { ...btnStyle, ...styles.tabHover };
              } else {
                btnStyle = { ...btnStyle, ...styles.tabDefault };
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
