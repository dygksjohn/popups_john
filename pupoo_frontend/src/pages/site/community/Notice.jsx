import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import PageHeader from "../components/PageHeader";
import CommunityPagination from "./shared/CommunityPagination";
import sortIcon from "../../../assets/sort-icon.svg";
import { noticeApi, unwrap } from "../../../api/noticeApi";
import {
  COMMUNITY_CATEGORIES,
  getBoardBadge,
  getNoticeScopeBadge,
} from "./communityConfig";

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

  return (
    <>
      <PageHeader
        title="공지사항"
        subtitle="중요한 행사와 서비스 소식을 확인해 보세요."
        categories={COMMUNITY_CATEGORIES}
        currentPath="/community/notice"
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
            gap: 8,
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#222" }}>총 {totalFromApi}개</span>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <select
                value={scopeKey}
                onChange={(event) => {
                  setScopeKey(event.target.value);
                  setPage(1);
                }}
                style={{
                  height: 38,
                  minWidth: 128,
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "0 36px 0 12px",
                  cursor: "pointer",
                  appearance: "none",
                }}
              >
                {SCOPE_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
              <ChevronRight
                size={14}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%) rotate(90deg)",
                  color: "#64748b",
                  pointerEvents: "none",
                }}
              />
            </div>

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
                        setPage(1);
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
                placeholder="제목/내용 검색"
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
                onClick={() => {
                  setKeyword(search.trim());
                  setPage(1);
                }}
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
            <div style={{ marginTop: 12, fontSize: "14px", color: "#999" }}>공지사항을 불러오고 있습니다.</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "14px", color: "#999", marginBottom: 12 }}>{error}</div>
            <button
              type="button"
              onClick={() => fetchNotices(page)}
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
              {paged.map((notice) => {
                const scopeBadge = getNoticeScopeBadge(notice.scope);
                return (
                  <div
                    key={notice.noticeId}
                    onClick={() => navigate(`/community/notice/${notice.noticeId}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "18px 6px",
                      borderBottom: "1px solid #e8e8e8",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      gap: 10,
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = "#f9f9f9";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ ...badge.style, marginRight: 2 }}>{badge.text}</span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 50,
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: `1px solid ${scopeBadge.borderColor}`,
                        background: scopeBadge.background,
                        color: scopeBadge.color,
                        fontSize: 12,
                        fontWeight: 800,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      {scopeBadge.compactLabel}
                    </span>
                    {notice.pinned ? <span style={{ fontSize: 12, fontWeight: 800, color: "#dc2626" }}>📌</span> : null}
                    <span style={{ flex: 1, fontSize: "15px", color: "#222", fontWeight: 500 }}>
                      {notice.title}
                    </span>
                    <span style={{ fontSize: "12px", color: "#94A3B8", minWidth: 60, textAlign: "right" }}>
                      조회 {notice.viewCount ?? 0}
                    </span>
                    <span style={{ fontSize: "13px", color: "#999", whiteSpace: "nowrap", minWidth: 94, textAlign: "right" }}>
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
