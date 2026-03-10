import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { COMMUNITY_CATEGORIES, getBoardBadge } from "../communityConfig";
import { prepareContentForDisplay } from "./communityHtml";

const styles = {
  main: {
    width: "min(1350px, calc(100% - 50px))",
    margin: "0 auto",
    padding: "40px 0 64px",
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
    border: "1px solid #dbe2ea",
    background: "#fff",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
  },
  head: {
    padding: "28px 32px 20px",
    borderBottom: "1px solid #edf2f7",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  },
  title: {
    fontSize: 28,
    lineHeight: 1.35,
    fontWeight: 800,
    color: "#0f172a",
    margin: "14px 0 0",
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
    fontSize: 13,
    color: "#64748b",
  },
  body: {
    padding: "30px 32px",
  },
  content: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 1.9,
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
        <button type="button" style={styles.backButton} onClick={() => navigate(currentPath)}>
          <ArrowLeft size={16} />
          목록으로
        </button>

        <article style={styles.card}>
          <header style={styles.head}>
            <span style={badge.style}>{badge.text}</span>
            {extraHead}
            <h1 style={styles.title}>{articleTitle}</h1>
            <div style={styles.metaRow}>
              {metaItems.map((item) => (
                <span key={`${item.label}-${item.value}`}>
                  {item.label} {item.value}
                </span>
              ))}
            </div>
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

