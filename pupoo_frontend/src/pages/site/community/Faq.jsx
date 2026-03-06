import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { COMMUNITY_CATEGORIES, getBoardBadge } from "./communityConfig";

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function CommunityFaq() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 10;

  const fetchFaqs = useCallback(async (nextPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/api/faqs", {
        params: { page: nextPage - 1, size: PAGE_SIZE },
      });
      const data = res.data?.data || res.data || {};
      const content = Array.isArray(data.content) ? data.content : [];
      setItems(content);
      setTotalPages(Number(data.totalPages) || 0);
      setTotalElements(Number(data.totalElements) || content.length);
      setPage(nextPage);
    } catch (err) {
      console.error("[Community FAQ] list fetch failed:", err);
      setError("FAQ 목록을 불러오지 못했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs(1);
  }, [fetchFaqs]);

  const filtered = items.filter((item) => {
    const keyword = search.trim();
    if (!keyword) return true;
    return String(item.title || "").includes(keyword);
  });

  return (
    <>
      <PageHeader
        title="자주묻는질문"
        subtitle="자주 문의하는 내용을 빠르게 확인할 수 있는 안내 게시판입니다."
        categories={COMMUNITY_CATEGORIES}
        currentPath="/community/faq"
        onNavigate={(path) => navigate(path)}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <main
        style={{
          width: "min(1400px, calc(100% - 32px))",
          margin: "0 auto",
          padding: "40px 0 64px",
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
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#222" }}>총 {totalElements}건</span>

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
              onChange={(event) => setSearch(event.target.value)}
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
              type="button"
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

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
            <Loader2 size={28} color="#999" style={{ animation: "spin 1s linear infinite" }} />
            <div style={{ marginTop: 12, fontSize: "14px", color: "#999" }}>FAQ를 불러오고 있습니다.</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "14px", color: "#999", marginBottom: 12 }}>{error}</div>
            <button
              type="button"
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
        ) : (
          <>
            <div>
              {filtered.map((faq) => (
                <button
                  key={faq.postId}
                  type="button"
                  onClick={() => navigate(`/community/faq/${faq.postId}`)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    padding: "18px 6px",
                    borderBottom: "1px solid #e8e8e8",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    gap: 8,
                    textAlign: "left",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "#f9f9f9";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ ...getBoardBadge("FAQ").style, marginRight: 8 }}>{getBoardBadge("FAQ").text}</span>
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
                  <span style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap" }}>{fmtDate(faq.createdAt)}</span>
                </button>
              ))}

              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: "14px" }}>
                  검색 결과가 없습니다.
                </div>
              ) : null}
            </div>

            {totalPages > 1 ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "36px" }}>
                <button
                  type="button"
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

                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => fetchFaqs(index + 1)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: index + 1 === page ? 700 : 500,
                      color: index + 1 === page ? "#1A4FD6" : "#333",
                      cursor: "pointer",
                      minWidth: 20,
                    }}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  type="button"
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
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
