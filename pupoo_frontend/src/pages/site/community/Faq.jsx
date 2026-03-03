import { useState, useEffect, useCallback } from "react";
import PageHeader from "../components/PageHeader";
import { Search, Loader2, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { COMMUNITY_CATEGORIES, getBoardBadge } from "./communityConfig";

function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
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

  const [openReplies, setOpenReplies] = useState({});
  const [detailCache, setDetailCache] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);

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

  const toggleReply = async (postId) => {
    if (openReplies[postId]) {
      setOpenReplies((prev) => ({ ...prev, [postId]: false }));
      return;
    }
    if (detailCache[postId]) {
      setOpenReplies((prev) => ({ ...prev, [postId]: true }));
      return;
    }
    setDetailLoadingId(postId);
    try {
      const res = await axiosInstance.get(`/api/faqs/${postId}`);
      const d = res.data?.data || res.data || {};
      setDetailCache((prev) => ({
        ...prev,
        [postId]: {
          content: d.content,
          answerContent: d.answerContent,
          answeredAt: d.answeredAt,
          viewCount: d.viewCount,
          createdAt: d.createdAt,
        },
      }));
      setOpenReplies((prev) => ({ ...prev, [postId]: true }));
    } catch (e) {
      console.error("[Community FAQ] detail fetch failed:", e);
      setDetailCache((prev) => ({
        ...prev,
        [postId]: {
          content: "FAQ 상세 내용을 불러오지 못했습니다.",
          answerContent: "",
          answeredAt: null,
        },
      }));
      setOpenReplies((prev) => ({ ...prev, [postId]: true }));
    } finally {
      setDetailLoadingId(null);
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes expandIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
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
                <div key={faq.postId} style={{ borderBottom: "1px solid #e8e8e8" }}>
                  {/* FAQ 행 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "18px 4px",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      gap: "0",
                    }}
                    onClick={() => toggleReply(faq.postId)}
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
                        display: "inline-flex",
                        transition: "transform 0.2s ease",
                        transform: openReplies[faq.postId]
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        marginRight: 12,
                        flexShrink: 0,
                      }}
                    >
                      <ChevronDown size={18} strokeWidth={2.5} color="#666" />
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: "15px",
                        color: "#222",
                        fontWeight: "400",
                        minWidth: 0,
                      }}
                    >
                      {faq.title}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#999",
                        whiteSpace: "nowrap",
                        marginLeft: "12px",
                        flexShrink: 0,
                      }}
                    >
                      조회수 {faq.viewCount ?? 0}
                    </span>
                  </div>

                  {/* 펼쳐진 상세 내용 (QnA와 동일 스타일) */}
                  {openReplies[faq.postId] && (
                    <div
                      style={{
                        padding: "16px 20px",
                        background: "#f7f9ff",
                        borderTop: "1px dashed #dde6ff",
                        animation: "expandIn .15s ease",
                      }}
                    >
                      {detailLoadingId === faq.postId ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "24px 0",
                            gap: 10,
                          }}
                        >
                          <Loader2
                            size={20}
                            color="#94A3B8"
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                          <span style={{ fontSize: 13, color: "#64748B" }}>
                            내용을 불러오는 중...
                          </span>
                        </div>
                      ) : (
                        <>
                          <p
                            style={{
                              fontSize: 14,
                              color: "#444",
                              lineHeight: 1.6,
                              margin: "0 0 16px",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {detailCache[faq.postId]?.content ?? "—"}
                          </p>

                          {detailCache[faq.postId]?.answerContent && (
                            <div
                              style={{
                                padding: "14px 16px",
                                background: "#eef3ff",
                                borderRadius: 8,
                                borderLeft: "3px solid #4a7cf7",
                                marginBottom: 0,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#4a7cf7",
                                  marginBottom: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                re: 답변
                                {detailCache[faq.postId]?.answeredAt && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "#999",
                                      fontWeight: 400,
                                      marginLeft: 8,
                                    }}
                                  >
                                    {fmtDate(detailCache[faq.postId].answeredAt)}
                                  </span>
                                )}
                              </div>
                              <p
                                style={{
                                  fontSize: 14,
                                  color: "#444",
                                  lineHeight: 1.6,
                                  margin: 0,
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {detailCache[faq.postId].answerContent}
                              </p>
                            </div>
                          )}
                          {detailCache[faq.postId] && !detailCache[faq.postId].answerContent && (
                            <div
                              style={{
                                fontSize: 13,
                                color: "#94A3B8",
                                fontStyle: "italic",
                              }}
                            >
                              등록된 답변이 없습니다.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
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
    </>
  );
}
