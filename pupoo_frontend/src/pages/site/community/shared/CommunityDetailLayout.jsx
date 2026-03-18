import { ArrowLeft, List } from "lucide-react";
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
    gap: 8,
    marginBottom: 32,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "10px 20px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    cursor: "pointer",
    transition: "all .15s",
  },
  bottomButtons: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    marginTop: 40,
    paddingTop: 32,
    borderTop: "1px solid #e5e7eb",
  },
  listButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "12px 28px",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    color: "#374151",
    cursor: "pointer",
    transition: "all .15s",
    fontFamily: "'Noto Sans KR', sans-serif",
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
    fontSize: 17.5,
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

        <div style={styles.bottomButtons}>
          <button
            type="button"
            style={styles.listButton}
            onClick={() => navigate(currentPath)}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.borderColor = "#9ca3af"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#d1d5db"; }}
          >
            <List size={18} />
            목록
          </button>
          <button
            type="button"
            style={{ ...styles.listButton, background: "#111827", color: "#fff", borderColor: "#111827" }}
            onClick={() => navigate(-1)}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <ArrowLeft size={18} />
            뒤로가기
          </button>
        </div>
      </main>
    </>
  );
}
