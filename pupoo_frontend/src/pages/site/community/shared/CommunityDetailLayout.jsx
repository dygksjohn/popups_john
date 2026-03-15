import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { COMMUNITY_CATEGORIES, getBoardBadge } from "../communityConfig";
import { prepareContentForDisplay } from "./communityHtml";
import BadgeTag from "./BadgeTag";

const styles = {
  main: {
    width: "min(1400px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "48px 0 80px",
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 32,
    border: "none",
    background: "none",
    padding: 0,
    fontSize: 14,
    fontWeight: 500,
    color: "#64748b",
    cursor: "pointer",
    transition: "color .15s",
  },
  card: {
    background: "#fff",
    borderRadius: 0,
    overflow: "hidden",
  },
  head: {
    paddingBottom: 28,
    borderBottom: "2px solid #111827",
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    lineHeight: 1.4,
    fontWeight: 700,
    color: "#111827",
    margin: 0,
    letterSpacing: -0.3,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 20,
    marginTop: 16,
    fontSize: 13,
    color: "#9ca3af",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    color: "#9ca3af",
    fontWeight: 400,
  },
  metaValue: {
    color: "#6b7280",
    fontWeight: 500,
  },
  metaDivider: {
    width: 1,
    height: 12,
    background: "#e5e7eb",
  },
  body: {
    padding: "36px 0",
  },
  content: {
    color: "#374151",
    fontSize: 15.5,
    lineHeight: 2,
    wordBreak: "keep-all",
  },
};

export default function CommunityDetailLayout({
  pageTitle,
  pageSubtitle,
  currentPath,
  badgeType,
  articleTitle,
  metaItems = [],
  content,
  extraHead = null,
  extraContent = null,
  children = null,
}) {
  const navigate = useNavigate();
  const badge = getBoardBadge(badgeType);

  return (
    <>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        categories={COMMUNITY_CATEGORIES}
        currentPath={currentPath}
        onNavigate={(path) => navigate(path)}
      />
      <main style={styles.main}>
        <button
          type="button"
          style={styles.backButton}
          onClick={() => navigate(currentPath)}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#111827"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; }}
        >
          <ArrowLeft size={16} />
          목록으로
        </button>

        <article style={styles.card}>
          <header style={styles.head}>
            <div style={styles.badgeRow}>
              <BadgeTag badge={badge} />
            </div>
            <h1 style={styles.title}>{articleTitle}</h1>
            {extraHead}
            {metaItems.length > 0 && (
              <div style={styles.metaRow}>
                {metaItems.map((item, i) => (
                  <span key={`${item.label}-${item.value}`} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    {i > 0 && <span style={{ ...styles.metaDivider, marginRight: 20 }} />}
                    <span style={styles.metaLabel}>{item.label}</span>
                    <span style={{ width: 6 }} />
                    <span style={styles.metaValue}>{item.value}</span>
                  </span>
                ))}
              </div>
            )}
          </header>

          <div style={styles.body}>
            <div
              style={styles.content}
              dangerouslySetInnerHTML={{ __html: prepareContentForDisplay(content || "") }}
            />
            {extraContent}
          </div>
          {children}
        </article>
      </main>
    </>
  );
}
