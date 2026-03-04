import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import sortIcon from "../../../assets/sort-icon.svg";
import { noticeApi, unwrap } from "../../../api/noticeApi";
import { COMMUNITY_CATEGORIES, getBoardBadge } from "./communityConfig";

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { key: "recent", label: "최신순" },
  { key: "views", label: "조회순" },
];

const SCOPE_OPTIONS = [
  { key: "all", label: "전체" },
  { key: "GLOBAL", label: "전체 공지" },
  { key: "EVENT", label: "이벤트 공지" },
];

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function toTimestamp(value) {
  const ts = Date.parse(String(value || ""));
  return Number.isFinite(ts) ? ts : 0;
}

function isGlobalScope(scope) {
  const normalized = String(scope || "").toUpperCase();
  return normalized === "GLOBAL" || normalized === "ALL";
}

function getScopeMeta(scope) {
  if (isGlobalScope(scope)) {
    return {
      label: "[전체]",
      color: "#1D4ED8",
    };
  }
  return {
    label: "[이벤트]",
    color: "#0F766E",
  };
}

function DetailModal({ item, onClose }) {
  if (!item) return null;
  const scopeMeta = getScopeMeta(item.scope);

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
          animation: "fadeIn .15s ease",
        }}
      />
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
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
          maxWidth: 680,
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          animation: "slideUp .25s ease",
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              {item.pinned ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    background: "#EF4444",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  📌
                </span>
              ) : null}
              <span style={{ fontSize: 12, color: scopeMeta.color, fontWeight: 800 }}>
                {scopeMeta.label}
              </span>
              {item.eventName ? (
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                  {item.eventName}
                </span>
              ) : null}
            </div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#1E293B",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {item.title}
            </h2>
          </div>
          <button
            type="button"
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
            padding: "12px 28px 0",
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, color: "#94A3B8" }}>작성일 {fmtDate(item.createdAt)}</span>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>조회수 {item.viewCount ?? 0}</span>
          {item.updatedAt && item.updatedAt !== item.createdAt ? (
            <span style={{ fontSize: 13, color: "#94A3B8" }}>수정일 {fmtDate(item.updatedAt)}</span>
          ) : null}
        </div>

        <div style={{ margin: "16px 28px 0", borderBottom: "1px solid #E2E8F0" }} />

        <div style={{ padding: "20px 28px 28px" }}>
          {item.content ? (
            <p
              style={{
                fontSize: 15,
                color: "#334155",
                lineHeight: 1.75,
                whiteSpace: "pre-wrap",
                margin: 0,
              }}
            >
              {item.content}
            </p>
          ) : (
            <p
              style={{
                fontSize: 14,
                color: "#CBD5E1",
                fontStyle: "italic",
                margin: 0,
              }}
            >
              내용이 없습니다.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default function Notice() {
  const [currentPath, setCurrentPath] = useState("/community/notice");
  const [search, setSearch] = useState("");
  const [scopeKey, setScopeKey] = useState("all");
  const [sortKey, setSortKey] = useState("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = [];
      let pageIndex = 1;
      let finished = false;

      while (!finished && pageIndex <= 20) {
        const res = await noticeApi.list(
          pageIndex,
          50,
          undefined,
          undefined,
          scopeKey === "all" ? undefined : scopeKey,
          undefined,
        );
        const data = unwrap(res);
        const content = Array.isArray(data?.content) ? data.content : [];
        rows.push(...content);

        const totalPages = Number(data?.totalPages) || 0;
        finished = Boolean(data?.last) || totalPages === 0 || pageIndex >= totalPages;
        pageIndex += 1;
      }

      setNotices(rows);
      setPage(1);
    } catch (err) {
      console.error("[Notice] fetch error:", err);
      setError("공지사항을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [scopeKey]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  useEffect(() => {
    setPage(1);
  }, [search, sortKey, scopeKey]);

  const filteredNotices = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return notices;
    return notices.filter((notice) => {
      const title = String(notice?.title || "").toLowerCase();
      const content = String(notice?.content || "").toLowerCase();
      return title.includes(keyword) || content.includes(keyword);
    });
  }, [notices, search]);

  const sortedNotices = useMemo(() => {
    const rows = [...filteredNotices];
    rows.sort((a, b) => {
      if (a?.pinned !== b?.pinned) {
        return a?.pinned ? -1 : 1;
      }

      if (sortKey === "views") {
        const diff = (b?.viewCount ?? 0) - (a?.viewCount ?? 0);
        if (diff !== 0) return diff;
      }

      return toTimestamp(b?.createdAt) - toTimestamp(a?.createdAt);
    });
    return rows;
  }, [filteredNotices, sortKey]);

  const totalElements = sortedNotices.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = sortedNotices.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const currentSortLabel =
    SORT_OPTIONS.find((option) => option.key === sortKey)?.label || "최신순";

  return (
    <>
      <PageHeader
        title="공지사항"
        subtitle="행사 운영과 주요 안내 사항을 확인하세요."
        categories={COMMUNITY_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

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
            gap: 8,
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#222" }}>총 {totalElements}개</span>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <select
              value={scopeKey}
              onChange={(e) => setScopeKey(e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 8,
                background: "#fff",
                height: 38,
                padding: "0 10px",
                fontSize: 13,
                color: "#334155",
              }}
            >
              {SCOPE_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>

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
                placeholder="제목/내용 검색"
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
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ marginTop: 12, fontSize: "14px", color: "#999" }}>최신 공지를 불러오는 중입니다.</div>
          </div>
        ) : null}

        {!loading && error ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "14px", color: "#999", marginBottom: 12 }}>{error}</div>
            <button
              type="button"
              onClick={fetchNotices}
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
        ) : null}

        {!loading && !error ? (
          <div>
            {pageItems.map((notice) => {
              const scopeMeta = getScopeMeta(notice.scope);
              return (
                <div
                  key={notice.noticeId}
                  onClick={() => setSelected(notice)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "18px 4px",
                    borderBottom: "1px solid #e8e8e8",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f9f9f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ ...getBoardBadge("NOTICE").style, marginRight: 12 }}>
                    {getBoardBadge("NOTICE").text}
                  </span>

                  {notice.pinned ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#EF4444",
                        marginRight: 8,
                        flexShrink: 0,
                      }}
                    >
                      📌
                    </span>
                  ) : null}

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: scopeMeta.color,
                      marginRight: 8,
                      flexShrink: 0,
                    }}
                  >
                    {scopeMeta.label}
                  </span>

                  <span style={{ flex: 1, fontSize: "15px", color: "#222", fontWeight: 500 }}>
                    {notice.title}
                    {notice.eventName ? (
                      <span style={{ marginLeft: 8, color: "#64748B", fontSize: 12 }}>
                        {notice.eventName}
                      </span>
                    ) : null}
                  </span>

                  <span style={{ fontSize: "12px", color: "#94A3B8", marginLeft: 12 }}>
                    조회 {notice.viewCount ?? 0}
                  </span>

                  <span
                    style={{
                      fontSize: "13px",
                      color: "#999",
                      marginLeft: "12px",
                      whiteSpace: "nowrap",
                      minWidth: 94,
                      textAlign: "right",
                    }}
                  >
                    {fmtDate(notice.createdAt)}
                  </span>
                </div>
              );
            })}

            {pageItems.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "#999",
                  fontSize: "14px",
                }}
              >
                {search.trim() ? "검색 결과가 없습니다." : "공지사항이 없습니다."}
              </div>
            ) : null}
          </div>
        ) : null}

        {!loading && !error && totalPages > 1 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginTop: "36px",
            }}
          >
            <button
              type="button"
              onClick={() => setPage(pageSafe - 1)}
              disabled={pageSafe <= 1}
              style={{
                background: "none",
                border: "none",
                color: pageSafe <= 1 ? "#ddd" : "#666",
                cursor: pageSafe <= 1 ? "default" : "pointer",
                padding: "4px 8px",
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                type="button"
                onClick={() => setPage(index + 1)}
                style={{
                  fontSize: "14px",
                  fontWeight: index + 1 === pageSafe ? 700 : 500,
                  color: index + 1 === pageSafe ? "#222" : "#999",
                  background: index + 1 === pageSafe ? "#f0f0f0" : "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 10px",
                  borderRadius: 4,
                }}
              >
                {index + 1}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage(pageSafe + 1)}
              disabled={pageSafe >= totalPages}
              style={{
                background: "none",
                border: "none",
                color: pageSafe >= totalPages ? "#ddd" : "#666",
                cursor: pageSafe >= totalPages ? "default" : "pointer",
                padding: "4px 8px",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}
      </main>

      {selected ? <DetailModal item={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
