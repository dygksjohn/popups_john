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
    fontFamily: "'JeonjuCraftGothic', Apple SD Gothic Neo, Malgun Gothic, '맑은 고딕', sans-serif",
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

export default function PageHeader({ title, subtitle, icon, titleStyle, subtitleStyle, categories, currentPath, breadcrumbTitle, onTabClick, tabCounts, children, className }) {
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
    <div style={styles.pageHeader} className={className || ""}>
      <div style={styles.inner}>
        {/* Title + Breadcrumb */}
        <div style={styles.topRow}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {icon && icon}
              <h1 style={{ ...styles.title, ...titleStyle }}>{title}</h1>
            </div>
            {subtitle && <p style={{ ...styles.subtitle, ...subtitleStyle }}>{subtitle}</p>}
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
                  {cat.icon && <span style={{ display: "inline-flex", alignItems: "center", marginRight: 6 }}>{cat.icon}</span>}
                  {cat.label}
                  {tabCounts && cat.countKey != null && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      minWidth: 22, height: 22, borderRadius: 11, padding: "0 6px",
                      fontSize: 12, fontWeight: 700, lineHeight: 1,
                      background: isActive ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.07)",
                      color: isActive ? "#fff" : "#6b7280",
                    }}>
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
