import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, HelpCircle, Loader2, Search, SlidersHorizontal } from "lucide-react";
import PageHeader from "../components/PageHeader";
import PageLoading from "../components/PageLoading";
import EmptyState from "../components/EmptyState";
import CommunityPagination from "./shared/CommunityPagination";
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
  const sortDdRef = useRef(null);
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

  useEffect(() => {
    const h = (e) => {
      if (sortDdRef.current && !sortDdRef.current.contains(e.target)) setSortMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <>
      <PageHeader
        title="자주 묻는 질문"
        subtitle="자주 문의하는 내용을 빠르게 확인할 수 있는 안내 게시판입니다."
        icon={<HelpCircle size={42} color="#1a4fd6" strokeWidth={1.6} />}
        titleStyle={{ fontSize: 46, lineHeight: "66px", letterSpacing: "-1px" }}
        subtitleStyle={{ fontSize: 20 }}
        categories={COMMUNITY_CATEGORIES}
        currentPath="/community/faq"
        onNavigate={(path) => navigate(path)}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .board-search-input::placeholder{color:#9ca3af;font-size:13px;font-weight:500;}`}</style>
      <main
        style={{
          width: "min(1400px, calc(100% - 40px))",
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
            marginBottom: "8px",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#222" }}>
            총 {totalElements}건
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#f3f4f6", borderRadius: 999, height: 42 }}>
              {/* sort button */}
              <div style={{ position: "relative", flex: "0 0 auto" }} ref={sortDdRef}>
                <button
                  type="button"
                  onClick={() => setSortMenuOpen((prev) => !prev)}
                  style={{ height: 42, padding: "0 36px 0 14px", border: "none", background: "transparent", color: "#9ca3af", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", outline: "none", fontFamily: "inherit", whiteSpace: "nowrap", minWidth: 110, display: "inline-flex", alignItems: "center", gap: 7 }}
                >
                  <SlidersHorizontal size={14} style={{ color: "#9ca3af" }} />
                  {currentSortLabel}
                </button>
                <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: sortMenuOpen ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", transition: "transform .15s ease" }} />
                {sortMenuOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, minWidth: 200, background: "#fff", borderRadius: 16, padding: "8px 0", boxShadow: "0 4px 24px rgba(0,0,0,.10)", zIndex: 50, maxHeight: 280, overflowY: "auto" }}>
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => { setSortKey(option.key); setSortMenuOpen(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 16px", border: "none", background: "none", color: sortKey === option.key ? "#111827" : "#6b7280", fontSize: 13, fontWeight: sortKey === option.key ? 600 : 500, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        <SlidersHorizontal size={14} style={{ color: "#9ca3af", flexShrink: 0 }} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ width: 1, height: 20, background: "#dbe2ea", flexShrink: 0 }} />

              {/* search input */}
              <div style={{ position: "relative", flex: "1 1 auto", minWidth: 0 }}>
                <Search
                  size={16}
                  strokeWidth={2}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    pointerEvents: "none",
                  }}
                />
                <input
                  className="board-search-input"
                  type="text"
                  placeholder="자주 묻는 질문 검색"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "0 14px 0 40px",
                    borderRadius: "0 999px 999px 0",
                    height: 42,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#111827",
                    outline: "none",
                    width: 280,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <PageLoading message="FAQ를 불러오는 중입니다" />
        ) : error ? (
          <EmptyState type="error" message="FAQ를 불러오지 못했습니다" description="네트워크 연결을 확인하고 다시 시도해 주세요." />
        ) : (
          <>
            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 16px",
                background: "#f9fafb",
                borderTop: "2px solid #333",
                borderBottom: "1px solid #e5e7eb",
                fontSize: 13,
                fontWeight: 600,
                color: "#6b7280",
              }}>
                <span style={{ width: 60, textAlign: "center", flexShrink: 0 }}>번호</span>
                <span style={{ flex: 1, textAlign: "center" }}>제목</span>
                <span style={{ width: 100, textAlign: "center", flexShrink: 0 }}>작성자</span>
                <span style={{ width: 100, textAlign: "center", flexShrink: 0 }}>등록일</span>
              </div>
              {pagedItems.map((faq, index) => {
                const rowNumber = totalElements - ((currentPage - 1) * PAGE_SIZE) - index;
                return (
                  <div
                    key={faq.postId}
                    onClick={() => navigate(`/community/faq/${faq.postId}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "18px 16px",
                      borderBottom: "1px solid #f0f0f0",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = "#f9f9f9";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ width: 60, textAlign: "center", fontSize: 14, color: "#9ca3af", flexShrink: 0 }}>{rowNumber}</span>
                    <span style={{ flex: 1, fontSize: 15, color: "#111827", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {faq.title}
                    </span>
                    <span style={{ width: 100, textAlign: "center", fontSize: 14, color: "#6b7280", flexShrink: 0 }}>관리자</span>
                    <span style={{ width: 100, textAlign: "center", fontSize: 14, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {fmtDate(faq.createdAt)}
                    </span>
                  </div>
                );
              })}

              {pagedItems.length === 0 ? (
                <div
                  style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: "14px" }}
                >
                  검색 결과가 없습니다.
                </div>
              ) : null}
            </div>

            <CommunityPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={setPage}
            />
          </>
        )}
      </main>
    </>
  );
}
