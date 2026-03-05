import { useState, useEffect, useCallback } from "react";
import PageHeader from "../components/PageHeader";
import { Search, Loader2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
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

  const [openRows, setOpenRows] = useState({});
  const [detailMap, setDetailMap] = useState({});
  const [detailLoadingMap, setDetailLoadingMap] = useState({});

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

  const loadDetail = useCallback(async (postId) => {
    setDetailLoadingMap((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await axiosInstance.get(`/api/faqs/${postId}`);
      const d = res.data?.data || res.data || {};
      setDetailMap((prev) => ({
        ...prev,
        [postId]: {
          postId: d.postId,
          title: d.title,
          content: d.content,
          answerContent: d.answerContent,
          answeredAt: d.answeredAt,
          viewCount: d.viewCount,
          createdAt: d.createdAt,
        },
      }));
    } catch (e) {
      console.error("[Community FAQ] detail fetch failed:", e);
      setDetailMap((prev) => ({
        ...prev,
        [postId]: {
          postId,
          title: "상세 조회 실패",
          content: "FAQ 상세 내용을 불러오지 못했습니다.",
          answerContent: "",
        },
      }));
    } finally {
      setDetailLoadingMap((prev) => ({ ...prev, [postId]: false }));
    }
  }, []);

  const toggleDetail = (postId) => {
    setOpenRows((prev) => {
      const willOpen = !prev[postId];
      if (willOpen && !detailMap[postId] && !detailLoadingMap[postId]) {
        loadDetail(postId);
      }
      return { ...prev, [postId]: willOpen };
    });
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
                >
                  <div
                    onClick={() => toggleDetail(faq.postId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "18px 6px",
                      borderBottom: "1px solid #e8e8e8",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      gap: 8,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f9f9f9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span
                      style={{ ...getBoardBadge("FAQ").style, marginRight: 8 }}
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
                    <span
                      style={{
                        fontSize: 12,
                        color: "#999",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtDate(faq.createdAt)}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        transition: "transform 0.2s ease",
                        transform: openRows[faq.postId]
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        marginLeft: 6,
                      }}
                    >
                      <ChevronDown size={14} color="#64748B" />
                    </span>
                  </div>

                  {openRows[faq.postId] && (
                    <div
                      style={{
                        padding: "16px 18px 18px",
                        background: "#f7f9ff",
                        borderBottom: "1px solid #e8e8e8",
                        borderTop: "1px dashed #dde6ff",
                      }}
                    >
                      {detailLoadingMap[faq.postId] ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            color: "#64748B",
                          }}
                        >
                          <Loader2
                            size={14}
                            color="#64748B"
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                          상세 내용을 불러오는 중입니다.
                        </div>
                      ) : (
                        <>
                          <div
                            style={{
                              display: "flex",
                              gap: 14,
                              flexWrap: "wrap",
                              fontSize: 12,
                              color: "#94A3B8",
                              marginBottom: 10,
                            }}
                          >
                            <span>
                              작성일 {fmtDate(detailMap[faq.postId]?.createdAt || faq.createdAt)}
                            </span>
                            <span>조회수 {detailMap[faq.postId]?.viewCount ?? faq.viewCount ?? 0}</span>
                            {(detailMap[faq.postId]?.answeredAt || faq.answeredAt) && (
                              <span>
                                답변일 {fmtDate(detailMap[faq.postId]?.answeredAt || faq.answeredAt)}
                              </span>
                            )}
                          </div>

                          <section style={{ marginBottom: 12 }}>
                            <h3
                              style={{
                                fontSize: 14,
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
                              {detailMap[faq.postId]?.content || "질문 내용이 없습니다."}
                            </div>
                          </section>

                          <section>
                            <h3
                              style={{
                                fontSize: 14,
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
                              {detailMap[faq.postId]?.answerContent || "등록된 답변이 없습니다."}
                            </div>
                          </section>
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
