import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const styles = {
  pageHeader: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #e9ecef",
    paddingTop: 100,
  },
  inner: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "0 24px",
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
  tabClosedActive: {
    fontSize: 18,
    fontWeight: 800,
  },
  tabHover: {
    color: "#1a4fd6",
  },
};

export default function PageHeader({ title, subtitle, categories }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isProgramSection = /^\/program\//.test(location.pathname);
  const isRegistrationSection = /^\/registration\//.test(location.pathname);
  const isCompactSection = isProgramSection || isRegistrationSection;
  const effectiveTitle = isCompactSection ? "" : title;
  const effectiveSubtitle = isCompactSection ? "" : subtitle;
  const emphasizedTabs = new Set([
    "/event/current",
    "/event/upcoming",
    "/event/closed",
    "/program/schedule",
    "/program/experience",
    "/program/session",
    "/program/contest",
    "/program/booth",
    "/registration/apply",
    "/registration/applyhistory",
    "/registration/paymenthistory",
    "/registration/qrcheckin",
  ]);
  const isCompact = !effectiveTitle && !effectiveSubtitle;
  const pageHeaderStyle = {
    ...styles.pageHeader,
    paddingTop: isCompact ? 75 : styles.pageHeader.paddingTop,
  };
  const hiddenPaths = new Set([
    "/event/preregister",
    "/event/eventschedule",
    "/program/all",
  ]);
  const programMatch = location.pathname.match(
    /^\/program\/(?:all|schedule|experience|session|contest|booth)(?:\/([^/?#]+))?/,
  );
  const currentEventId = programMatch?.[1] || null;

  const isProgramTabPath = (path) =>
    /^\/program\/(?:all|schedule|experience|session|contest|booth)(?:\/[^/?#]+)?$/.test(
      path,
    );

  const hasEventIdInPath = (path) =>
    /^\/program\/(?:all|schedule|experience|session|contest|booth)\/[^/?#]+$/.test(
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

  return (
    <div style={pageHeaderStyle}>
      <div style={styles.inner}>
        {effectiveTitle && <h1 style={styles.title}>{effectiveTitle}</h1>}
        {effectiveSubtitle && <p style={styles.subtitle}>{effectiveSubtitle}</p>}

        {filteredCategories.length > 0 && (
          <div style={styles.tabs}>
            {filteredCategories.map((cat, i) => {
              const targetPath = resolveTargetPath(cat.path);
              const isActive = location.pathname === targetPath;
              const isHovered = hoveredIdx === i;

              let btnStyle = { ...styles.tabBase };
              if (isActive) {
                btnStyle = { ...btnStyle, ...styles.tabActive };
                if (emphasizedTabs.has(cat.path)) {
                  btnStyle = { ...btnStyle, ...styles.tabClosedActive };
                }
              } else if (isHovered) {
                btnStyle = { ...btnStyle, ...styles.tabHover };
              } else {
                btnStyle = { ...btnStyle, ...styles.tabDefault };
              }

              return (
                <button
                  key={cat.path}
                  style={btnStyle}
                  onClick={() => navigate(targetPath)}
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
