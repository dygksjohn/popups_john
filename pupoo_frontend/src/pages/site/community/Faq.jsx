import { useState, useEffect, useCallback } from "react";
import PageHeader from "../components/PageHeader";
import { Search, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { COMMUNITY_CATEGORIES, getBoardBadge } from "./communityConfig";

function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function DetailModal({ item, loading, onClose }) {
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
            <span
              style={{ ...getBoardBadge("FAQ").style, marginBottom: 10 }}
            >
              {getBoardBadge("FAQ").text}
            </span>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#1E293B",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {item.title || "제목 없음"}
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
          <span>작성일 {fmtDate(item.createdAt)}</span>
          <span>조회수 {item.viewCount ?? 0}</span>
          {item.answeredAt && <span>답변일 {fmtDate(item.answeredAt)}</span>}
        </div>

        <div style={{ margin: "16px 28px", borderBottom: "1px solid #E2E8F0" }} />

        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 0",
            }}
          >
            <Loader2
              size={24}
              color="#94A3B8"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <div style={{ marginTop: 10, fontSize: 13, color: "#94A3B8" }}>
              상세 내용을 불러오는 중입니다.
            </div>
          </div>
        ) : (
          <div style={{ padding: "0 28px 28px" }}>
            <section style={{ marginBottom: 20 }}>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0F172A",
                  margin: "0 0 8px",
                }}
              >
                질문
              </h3>
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "14px 16px",
                  fontSize: 14,
                  color: "#334155",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.content || "질문 내용이 없습니다."}
              </div>
            </section>

            <section>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0F172A",
                  margin: "0 0 8px",
                }}
              >
                답변
              </h3>
              <div
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: 10,
                  padding: "14px 16px",
                  fontSize: 14,
                  color: "#1E3A8A",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.answerContent || "등록된 답변이 없습니다."}
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}

export default function CommunityFaq() {
  const [currentPath, setCurrentPath] = useState("/community/faq");
  const [search, setSearch] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 10;

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchFaqs = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/faqs", {
        params: { page: p - 1, size: PAGE_SIZE },
      });
      const d = res.data?.data || res.data || {};
      const content = Array.isArray(d.content) ? d.content : [];
      setItems(content);
      setTotalPages(d.totalPages || 0);
      setTotalElements(d.totalElements ?? content.length);
      setPage(p);
    } catch (e) {
      console.error("[Community FAQ] list fetch failed:", e);
      setError("FAQ 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs(1);
  }, [fetchFaqs]);

  const openDetail = async (postId) => {
    setSelected({ postId, title: "", content: "", answerContent: "" });
    setDetailLoading(true);
    try {
      const res = await axiosInstance.get(`/api/faqs/${postId}`);
      const d = res.data?.data || res.data || {};
      setSelected({
        postId: d.postId,
        title: d.title,
        content: d.content,
        answerContent: d.answerContent,
        answeredAt: d.answeredAt,
        viewCount: d.viewCount,
        createdAt: d.createdAt,
      });
    } catch (e) {
      console.error("[Community FAQ] detail fetch failed:", e);
      setSelected({
        postId,
        title: "상세 조회 실패",
        content: "FAQ 상세 내용을 불러오지 못했습니다.",
        answerContent: "",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    return (item.title || "").includes(search.trim());
  });

  return (
    <>
      <PageHeader
        title="자주묻는질문"
        subtitle="자주 문의되는 내용을 빠르게 확인할 수 있는 안내 게시판입니다."
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
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#222" }}>
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
              placeholder="FAQ 제목 검색"
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
            <Loader2
              size={28}
              color="#999"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <div style={{ marginTop: 12, fontSize: "14px", color: "#999" }}>
              FAQ를 불러오고 있습니다.
            </div>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "14px", color: "#999", marginBottom: 12 }}>
              {error}
            </div>
            <button
              onClick={() => fetchFaqs(page)}
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
              {filtered.map((faq) => (
                <div
                  key={faq.postId}
                  onClick={() => openDetail(faq.postId)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "18px 6px",
                    borderBottom: "1px solid #e8e8e8",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f9f9f9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span
                    style={{ ...getBoardBadge("FAQ").style, marginRight: 12 }}
                  >
                    {getBoardBadge("FAQ").text}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "15px",
                      color: "#222",
                      fontWeight: 500,
                    }}
                  >
                    {faq.title}
                  </span>
                </div>
              ))}

              {filtered.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 0",
                    color: "#999",
                    fontSize: "14px",
                  }}
                >
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
                  onClick={() => page > 1 && fetchFaqs(page - 1)}
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
                    onClick={() => fetchFaqs(i + 1)}
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
                  onClick={() => page < totalPages && fetchFaqs(page + 1)}
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

      <DetailModal
        item={selected}
        loading={detailLoading}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
