import { useState, useEffect, useCallback } from "react";
import PageHeader from "../components/PageHeader";
import { Search, Loader2, ChevronLeft, ChevronRight, X, Star } from "lucide-react";
import { reviewApi } from "../../../app/http/reviewApi";
import { COMMUNITY_CATEGORIES, getBoardBadge } from "./communityConfig";

const PAGE_SIZE = 10;

function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function getReviewTitle(item) {
  const firstLine = String(item?.content || "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return "행사 후기";
  return firstLine.length > 58 ? `${firstLine.slice(0, 58)}...` : firstLine;
}

function renderStars(rating = 0) {
  return Array.from({ length: 5 }, (_, idx) => (
    <Star
      key={idx}
      size={14}
      fill={idx < rating ? "#F59E0B" : "none"}
      color={idx < rating ? "#F59E0B" : "#D1D5DB"}
      strokeWidth={1.6}
    />
  ));
}

function DetailModal({ item, onClose }) {
  if (!item) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 5000,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 5001,
          background: "#fff",
          borderRadius: 16,
          width: "90%",
          maxWidth: 760,
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            padding: "24px 28px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, paddingRight: 16 }}>
            <span style={getBoardBadge("REVIEW").style}>{getBoardBadge("REVIEW").text}</span>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#1E293B",
                margin: "10px 0 0",
                lineHeight: 1.4,
              }}
            >
              {getReviewTitle(item)}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={16} color="#94A3B8" />
          </button>
        </div>

        <div
          style={{
            padding: "10px 28px 0",
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            fontSize: 13,
            color: "#94A3B8",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
            {renderStars(item.rating || 0)}
          </span>
          <span>작성일 {fmtDate(item.createdAt)}</span>
          <span>행사 ID {item.eventId ?? "-"}</span>
        </div>

        <div style={{ margin: "16px 28px", borderBottom: "1px solid #E2E8F0" }} />

        <div style={{ padding: "0 28px 28px" }}>
          <p
            style={{
              fontSize: 15,
              color: "#334155",
              lineHeight: 1.75,
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {item.content || "내용이 없습니다."}
          </p>
        </div>
      </div>
    </>
  );
}

export default function Review() {
  const [search, setSearch] = useState("");
  const [currentPath, setCurrentPath] = useState("/community/review");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selected, setSelected] = useState(null);

  const fetchList = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const d = await reviewApi.list({ page: p - 1, size: PAGE_SIZE });
      const content = Array.isArray(d?.content) ? d.content : [];
      setItems(content);
      setTotalPages(d?.totalPages || 0);
      setTotalElements(d?.totalElements ?? content.length);
      setPage(p);
    } catch (e) {
      console.error("[Review] list fetch failed:", e);
      setError("행사후기 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(1);
  }, [fetchList]);

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.trim();
    return getReviewTitle(item).includes(q) || (item.content || "").includes(q);
  });

  const badge = getBoardBadge("REVIEW");

  return (
    <>
      <PageHeader
        title="행사후기"
        subtitle="참가자들이 남긴 생생한 행사 후기를 확인해보세요."
        categories={COMMUNITY_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <main
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "40px 20px",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "16px",
            borderBottom: "1px solid #e0e0e0",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#222" }}>
            총 {totalElements}개
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #ccc",
              borderRadius: "6px",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <input
              type="text"
              placeholder="후기 내용 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                padding: "8px 12px",
                fontSize: "14px",
                color: "#333",
                width: "240px",
                background: "transparent",
              }}
            />
            <button
              style={{
                border: "none",
                background: "#fff",
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search size={16} strokeWidth={2} color="#555" />
            </button>
          </div>
        </div>

        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <Loader2 size={28} color="#999" style={{ animation: "spin 1s linear infinite" }} />
            <div style={{ marginTop: 12, fontSize: "14px", color: "#999" }}>후기를 불러오고 있습니다.</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "14px", color: "#999", marginBottom: 12 }}>{error}</div>
            <button
              onClick={() => fetchList(page)}
              style={{
                padding: "8px 20px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                background: "#fff",
                fontSize: "14px",
                cursor: "pointer",
                color: "#333",
              }}
            >
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div>
              {filtered.map((item) => (
                <div
                  key={item.reviewId}
                  onClick={() => setSelected(item)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "18px 6px",
                    borderBottom: "1px solid #e8e8e8",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ ...badge.style, marginRight: 12 }}>{badge.text}</span>
                  <span style={{ flex: 1, fontSize: "15px", color: "#222", fontWeight: 500 }}>
                    {getReviewTitle(item)}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 2, marginRight: 12 }}>
                    {renderStars(item.rating || 0)}
                  </span>
                  <span style={{ fontSize: "13px", color: "#999", whiteSpace: "nowrap" }}>
                    {fmtDate(item.createdAt)}
                  </span>
                </div>
              ))}

              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: "14px" }}>
                  검색 결과가 없습니다.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "36px",
                }}
              >
                <button
                  onClick={() => page > 1 && fetchList(page - 1)}
                  disabled={page <= 1}
                  style={{
                    background: "none",
                    border: "none",
                    color: page <= 1 ? "#ccc" : "#666",
                    cursor: page <= 1 ? "default" : "pointer",
                    padding: "4px 8px",
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => fetchList(i + 1)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: i + 1 === page ? 700 : 500,
                      color: i + 1 === page ? "#1A4FD6" : "#333",
                      cursor: "pointer",
                      minWidth: 20,
                    }}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => page < totalPages && fetchList(page + 1)}
                  disabled={page >= totalPages}
                  style={{
                    background: "none",
                    border: "none",
                    color: page >= totalPages ? "#ccc" : "#666",
                    cursor: page >= totalPages ? "default" : "pointer",
                    padding: "4px 8px",
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <DetailModal item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
