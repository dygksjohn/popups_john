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
    paddingTop: 100,
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
    fontSize: 26,
    fontWeight: 800,
    color: "#111827",
    margin: 0,
    letterSpacing: "-0.3px",
    lineHeight: 1.3,
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
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: 400,
    margin: "8px 0 0",
    lineHeight: 1.6,
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
    marginTop: 24,
  },
  tabBase: {
    flex: 1,
    padding: "13px 8px",
    fontSize: 14,
    fontWeight: 600,
    background: "#f3f4f6",
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
    color: "#6b7280",
    textAlign: "center",
    whiteSpace: "nowrap",
    borderRadius: 0,
  },
  tabActive: {
    color: "#fff",
    background: "#1a4fd6",
    borderRadius: 8,
  },
  tabHover: {
    color: "#1a4fd6",
  },
};

export default function PageHeader({ title, subtitle, categories, currentPath, breadcrumbTitle, onTabClick, children }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const hiddenPaths = new Set(["/event/preregister"]);
  const programMatch = location.pathname.match(
    /^\/program\/(?:all|current|upcoming|closed|experience|session|contest)(?:\/([^/?#]+))?/,
  );
  const currentEventId = programMatch?.[1] || null;

  const isProgramTabPath = (path) =>
    /^\/program\/(?:all|current|upcoming|closed|experience|session|contest)(?:\/[^/?#]+)?$/.test(path);

  const hasEventIdInPath = (path) =>
    /^\/program\/(?:all|current|upcoming|closed|experience|session|contest)\/[^/?#]+$/.test(path);

  const resolveTargetPath = (path) => {
    if (!currentEventId) return path;
    if (!isProgramTabPath(path)) return path;
    if (hasEventIdInPath(path)) return path;
    return `${path}/${currentEventId}`;
  };

  const filteredCategories = (categories || []).filter(
    (cat) => !hiddenPaths.has(cat.path),
  );

  // Auto breadcrumb from URL
  const activePath = currentPath || location.pathname;
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const section = pathSegments[0] || "";
  const sectionLabel = SECTION_LABELS[section];
  const lastCrumb = breadcrumbTitle || title;
  const breadcrumbItems = sectionLabel ? ["홈", sectionLabel, lastCrumb] : ["홈", lastCrumb];

  return (
    <div style={styles.pageHeader}>
      <div style={styles.inner}>
        {/* Title + Breadcrumb */}
        <div style={styles.topRow}>
          <div>
            <h1 style={styles.title}>{title}</h1>
            {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
          </div>
          <div style={styles.breadcrumb}>
            <Home size={12} style={{ color: "#b0b5bd" }} />
            {breadcrumbItems.map((item, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {i > 0 && <span style={styles.breadcrumbSep}>{">"}</span>}
                <span style={i === breadcrumbItems.length - 1 ? styles.breadcrumbCurrent : undefined}>
                  {item}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Optional Search Area */}
        {children && <div style={styles.searchArea}>{children}</div>}

        {/* Tabs */}
        {filteredCategories.length > 0 && (
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
              }

              return (
                <button
                  key={cat.path}
                  style={btnStyle}
                  onClick={() => onTabClick ? onTabClick(targetPath) : navigate(targetPath)}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
