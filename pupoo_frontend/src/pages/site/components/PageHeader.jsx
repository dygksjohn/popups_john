import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const styles = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
  },
  page: {
    fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
  },
  header: {
    padding: "56px 80px 40px",
  },
  title: {
    fontSize: "48px",
    fontWeight: "900",
    color: "#111",
    margin: "0 0 12px 0",
    letterSpacing: "-1px",
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: "22px",
    fontWeight: "400",
    color: "#333",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  tabsWrapper: {
    padding: "32px 80px 0",
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
  },
  tabBase: {
    padding: "12px 22px",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
    letterSpacing: "-0.2px",
    transition: "background 0.18s ease, color 0.18s ease, transform 0.12s ease",
    outline: "none",
    whiteSpace: "nowrap",
  },
  tabDefault: {
    backgroundColor: "#e4e4e4",
    color: "#222",
  },
  tabActive: {
    backgroundColor: "#111",
    color: "#fff",
  },
  tabHover: {
    backgroundColor: "#d0d0d0",
    color: "#111",
  },
};

export default function PageHeader({
  title,
  subtitle,
  categories,
  currentPath,
  onNavigate,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={styles.page}>
      <header
        style={{
          ...styles.header,
          maxWidth: "1400px",
          margin: "80px auto 0",
          padding: "56px 24px 40px",
        }}
      >
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>{subtitle}</p>
      </header>

      <nav
        style={{
          ...styles.tabsWrapper,
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "32px 24px 0",
        }}
      >
        <div style={styles.tabs}>
          {categories.map((cat, i) => {
            const isActive = location.pathname === cat.path;
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
                onClick={() => navigate(cat.path)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                aria-current={isActive ? "page" : undefined}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
