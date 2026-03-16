import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ListFilter, Loader2, Megaphone, Search, SlidersHorizontal } from "lucide-react";
import PageHeader from "../components/PageHeader";
import PageLoading from "../components/PageLoading";
import EmptyState from "../components/EmptyState";
import CommunityPagination from "./shared/CommunityPagination";
import { noticeApi, unwrap } from "../../../api/noticeApi";
import {
  COMMUNITY_CATEGORIES,
  getBoardBadge,
  getNoticeScopeBadge,
} from "./communityConfig";
import BadgeTag from "./shared/BadgeTag";

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { key: "recent", label: "최신순" },
  { key: "views", label: "조회순" },
  { key: "oldest", label: "오래된순" },
];

const SCOPE_OPTIONS = [
  { key: "all", label: "모든 공지" },
  { key: "ALL", label: "전체공지" },
  { key: "EVENT", label: "행사공지" },
];

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function Notice() {
  const navigate = useNavigate();
  const badge = getBoardBadge("NOTICE");
  const [search, setSearch] = useState("");
  const [scopeKey, setScopeKey] = useState("all");
  const [sortKey, setSortKey] = useState("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [scopeDdOpen, setScopeDdOpen] = useState(false);
  const scopeDdRef = useRef(null);
  const sortDdRef = useRef(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalFromApi, setTotalFromApi] = useState(0);
  const [totalPagesFromApi, setTotalPagesFromApi] = useState(1);
  const [keyword, setKeyword] = useState("");

  const fetchNotices = useCallback(async (pageNum) => {
    setLoading(true);
    setError("");
    try {
      const res = await noticeApi.list(
        pageNum,
        PAGE_SIZE,
        "TITLE_CONTENT",
        keyword.trim() || undefined,
        scopeKey === "all" ? undefined : scopeKey,
        sortKey,
      );
      const data = unwrap(res);
      const content = Array.isArray(data?.content) ? data.content : [];
      setNotices(content);
      setTotalFromApi(Number(data?.totalElements) ?? 0);
      setTotalPagesFromApi(Math.max(1, Number(data?.totalPages) ?? 1));
    } catch (err) {
      console.error("[Notice] fetch error:", err);
      setError("공지사항을 불러오지 못했습니다.");
      setNotices([]);
      setTotalFromApi(0);
      setTotalPagesFromApi(1);
    } finally {
      setLoading(false);
    }
  }, [scopeKey, sortKey, keyword]);

  useEffect(() => {
    fetchNotices(page);
  }, [page, scopeKey, sortKey, keyword, fetchNotices]);

  const totalPages = Math.max(1, totalPagesFromApi);
  const currentPage = Math.min(page, totalPages);
  const paged = notices;

  const currentSortLabel = SORT_OPTIONS.find((option) => option.key === sortKey)?.label || "최신순";
  const currentScopeLabel = SCOPE_OPTIONS.find((option) => option.key === scopeKey)?.label || "모든 공지";

  useEffect(() => {
    const h = (e) => {
      if (scopeDdRef.current && !scopeDdRef.current.contains(e.target)) setScopeDdOpen(false);
      if (sortDdRef.current && !sortDdRef.current.contains(e.target)) setSortMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <>
      <PageHeader
        title="공지사항"
        subtitle="중요한 행사와 서비스 소식을 확인해 보세요."
        icon={<Megaphone size={42} color="#1a4fd6" strokeWidth={1.6} />}
        titleStyle={{ fontSize: 46, lineHeight: "66px", letterSpacing: "-1px" }}
        subtitleStyle={{ fontSize: 20 }}
        categories={COMMUNITY_CATEGORIES}
        currentPath="/community/notice"
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
            gap: 8,
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#222" }}>총 {totalFromApi}개</span>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#f3f4f6", borderRadius: 999, height: 42 }}>
              {/* scope dropdown */}
              <div style={{ position: "relative", flex: "0 0 auto" }} ref={scopeDdRef}>
                <button
                  type="button"
                  onClick={() => setScopeDdOpen((v) => !v)}
                  style={{ height: 42, padding: "0 36px 0 14px", border: "none", background: "transparent", color: "#9ca3af", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", outline: "none", fontFamily: "inherit", whiteSpace: "nowrap", minWidth: 120, display: "inline-flex", alignItems: "center", gap: 7 }}
                >
                  <ListFilter size={14} style={{ color: "#9ca3af" }} />
                  {currentScopeLabel}
                </button>
                <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: scopeDdOpen ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", transition: "transform .15s ease" }} />
                {scopeDdOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, minWidth: 200, background: "#fff", borderRadius: 16, padding: "8px 0", boxShadow: "0 4px 24px rgba(0,0,0,.10)", zIndex: 50, maxHeight: 280, overflowY: "auto" }}>
                    {SCOPE_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => { setScopeKey(option.key); setScopeDdOpen(false); setPage(1); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 16px", border: "none", background: "none", color: scopeKey === option.key ? "#111827" : "#6b7280", fontSize: 13, fontWeight: scopeKey === option.key ? 600 : 500, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        <ListFilter size={14} style={{ color: "#9ca3af", flexShrink: 0 }} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ width: 1, height: 20, background: "#dbe2ea", flexShrink: 0 }} />

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
                        onClick={() => { setSortKey(option.key); setSortMenuOpen(false); setPage(1); }}
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
                  placeholder="공지사항 검색"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setKeyword(search.trim());
                      setPage(1);
                    }
                  }}
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

        {loading && (
          <PageLoading message="공지사항을 불러오는 중입니다" />
        )}

        {!loading && error && (
          <EmptyState type="error" message="공지사항을 불러오지 못했습니다" description="네트워크 연결을 확인하고 다시 시도해 주세요." />
        )}

        {!loading && !error && (
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
              {paged.map((notice, index) => {
                const scopeBadge = getNoticeScopeBadge(notice.scope);
                const rowNumber = totalFromApi - ((currentPage - 1) * PAGE_SIZE) - index;
                return (
                  <div
                    key={notice.noticeId}
                    onClick={() => navigate(`/community/notice/${notice.noticeId}`)}
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
                    <span style={{ width: 60, textAlign: "center", fontSize: 14, color: notice.pinned ? "#dc2626" : "#9ca3af", fontWeight: notice.pinned ? 700 : 400, flexShrink: 0 }}>
                      {notice.pinned ? "공지" : rowNumber}
                    </span>
                    <span style={{ flex: 1, fontSize: 15, color: "#111827", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
                      <BadgeTag
                        icon={scopeBadge.icon}
                        label={scopeBadge.compactLabel}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          minWidth: 40,
                          padding: "4px 10px",
                          borderRadius: 999,
                          border: `1px solid ${scopeBadge.borderColor}`,
                          background: scopeBadge.background,
                          color: scopeBadge.color,
                          fontSize: 12,
                          fontWeight: 600,
                          lineHeight: 1,
                          marginRight: 6,
                          verticalAlign: "middle",
                        }}
                      />
                      {notice.pinned ? <span style={{ fontSize: 12, marginRight: 4 }}>📌</span> : null}
                      {notice.title}
                    </span>
                    <span style={{ width: 100, textAlign: "center", fontSize: 14, color: "#6b7280", flexShrink: 0 }}>관리자</span>
                    <span style={{ width: 100, textAlign: "center", fontSize: 14, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {fmtDate(notice.createdAt)}
                    </span>
                  </div>
                );
              })}

              {paged.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: "14px" }}>
                  {keyword ? "검색 결과가 없습니다." : "공지사항이 없습니다."}
                </div>
              )}
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
