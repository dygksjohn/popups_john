import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import PageHeader from "../components/PageHeader";
import sortIcon from "../../../assets/sort-icon.svg";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { COMMUNITY_CATEGORIES, getBoardBadge } from "./communityConfig";

const PAGE_SIZE = 10;
const FETCH_SIZE = 100;
const SORT_OPTIONS = [
  { key: "recent", label: "최신순" },
  { key: "views", label: "조회순" },
];

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function toTimestamp(value) {
  const time = Date.parse(String(value || ""));
  return Number.isFinite(time) ? time : 0;
}

export default function CommunityFaq() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const firstRes = await axiosInstance.get("/api/faqs", {
        params: { page: 0, size: FETCH_SIZE, sort: "createdAt,desc" },
      });
      const firstData = firstRes.data?.data || firstRes.data || {};
      const rows = Array.isArray(firstData.content) ? [...firstData.content] : [];
      const totalPages = Math.max(1, Number(firstData.totalPages) || 1);

      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            axiosInstance.get("/api/faqs", {
              params: { page: index + 1, size: FETCH_SIZE, sort: "createdAt,desc" },
            }),
          ),
        );

        rest.forEach((response) => {
          const data = response.data?.data || response.data || {};
          const content = Array.isArray(data.content) ? data.content : [];
          rows.push(...content);
        });
      }

      setItems(rows);
    } catch (err) {
      console.error("[Community FAQ] list fetch failed:", err);
      setError("FAQ 목록을 불러오지 못했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      String(item?.title || "").toLowerCase().includes(keyword),
    );
  }, [items, search]);

  const sortedItems = useMemo(() => {
    const rows = [...filteredItems];
    rows.sort((a, b) => {
      if (sortKey === "views") {
        const diff = Number(b?.viewCount || 0) - Number(a?.viewCount || 0);
        if (diff !== 0) return diff;
      }
      return toTimestamp(b?.createdAt) - toTimestamp(a?.createdAt);
    });
    return rows;
  }, [filteredItems, sortKey]);

  const totalElements = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(
    () => sortedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, sortedItems],
  );

  useEffect(() => {
    setPage(1);
  }, [search, sortKey]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const currentSortLabel =
    SORT_OPTIONS.find((option) => option.key === sortKey)?.label ||
    "최신순";

  return (
    <>
      <PageHeader
        title="자주 묻는 질문"
        subtitle="자주 문의하는 내용을 빠르게 확인할 수 있는 안내 게시판입니다."
        categories={COMMUNITY_CATEGORIES}
        currentPath="/community/faq"
        onNavigate={(path) => navigate(path)}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <main
        style={{
          width: "min(1350px, calc(100% - 50px))",
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
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#222" }}>
            총 {totalElements}건
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setSortMenuOpen((prev) => !prev)}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  background: "#fff",
                  height: 38,
                  padding: "0 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                <img src={sortIcon} alt="정렬 아이콘" width={14} height={14} />
                {currentSortLabel}
              </button>
              {sortMenuOpen ? (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 42,
                    minWidth: 120,
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    background: "#fff",
                    boxShadow: "0 8px 20px rgba(15,23,42,0.12)",
                    zIndex: 20,
                    overflow: "hidden",
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setSortKey(option.key);
                        setSortMenuOpen(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        borderBottom: "1px solid #f1f5f9",
                        background: option.key === sortKey ? "#eff6ff" : "#fff",
                        color: option.key === sortKey ? "#1D4ED8" : "#334155",
                        padding: "9px 11px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

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
        </div>

        {loading ? (
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
            <div style={{ marginTop: 12, fontSize: "14px", color: "#999" }}>
              FAQ를 불러오고 있습니다.
            </div>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "14px", color: "#999", marginBottom: 12 }}>{error}</div>
            <button
              type="button"
              onClick={fetchFaqs}
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
              {pagedItems.map((faq) => (
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
                  <span style={{ ...getBoardBadge("FAQ").style, marginRight: 8 }}>
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
                  <span style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap" }}>
                    {fmtDate(faq.createdAt)}
                  </span>
                </button>
              ))}

              {pagedItems.length === 0 ? (
                <div
                  style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: "14px" }}
                >
                  검색 결과가 없습니다.
                </div>
              ) : null}
            </div>

            {totalPages > 1 ? (
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
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                  style={{
                    background: "none",
                    border: "none",
                    color: currentPage <= 1 ? "#ccc" : "#666",
                    cursor: currentPage <= 1 ? "default" : "pointer",
                    padding: "4px 8px",
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPage(index + 1)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: index + 1 === currentPage ? 700 : 500,
                      color: index + 1 === currentPage ? "#1A4FD6" : "#333",
                      cursor: "pointer",
                      minWidth: 20,
                    }}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  style={{
                    background: "none",
                    border: "none",
                    color: currentPage >= totalPages ? "#ccc" : "#666",
                    cursor: currentPage >= totalPages ? "default" : "pointer",
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
