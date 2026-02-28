// src/pages/site/community/Notice.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { ChevronLeft, ChevronRight, Search, Loader2, X } from "lucide-react";
import { noticeApi, unwrap } from "../../../api/noticeApi";

const SERVICE_CATEGORIES = [
  { label: "자유게시판", path: "/community/freeboard" },
  { label: "공지사항", path: "/community/notice" },
  { label: "행사후기", path: "/community/review" },
  { label: "질문/답변", path: "/community/qna" },
];

const PAGE_SIZE = 10;
const SEARCH_TYPES = [
  { value: "TITLE_CONTENT", label: "제목+내용" },
  { value: "TITLE", label: "제목" },
  { value: "CONTENT", label: "내용" },
  { value: "WRITER", label: "작성자" },
];

function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/* ── 상세보기 모달 ── */
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
          maxWidth: 640,
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          animation: "slideUp .25s ease",
        }}
      >
        {/* 헤더 */}
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
              }}
            >
              {item.pinned && (
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
                  고정
                </span>
              )}
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>
                {item.scope === "ALL" ? "전체 공지" : "이벤트 공지"}
              </span>
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

        {/* 메타 정보 */}
        <div
          style={{
            padding: "12px 28px 0",
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, color: "#94A3B8" }}>
            작성일 {fmtDate(item.createdAt)}
          </span>
          {item.updatedAt && item.updatedAt !== item.createdAt && (
            <span style={{ fontSize: 13, color: "#94A3B8" }}>
              수정일 {fmtDate(item.updatedAt)}
            </span>
          )}
        </div>

        {/* 구분선 */}
        <div
          style={{ margin: "16px 28px 0", borderBottom: "1px solid #E2E8F0" }}
        />

        {/* 본문 */}
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

        {/* 하단 닫기 */}
        <div
          style={{
            padding: "0 28px 24px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 40px",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              color: "#64748B",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F8FAFC";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </>
  );
}

export default function Notice() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [searchType, setSearchType] = useState("TITLE_CONTENT");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(null);

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchNotices = useCallback(
    async (p = 1, searchOverrides = {}) => {
      const kw = searchOverrides.keyword !== undefined ? searchOverrides.keyword : keyword;
      const st = searchOverrides.searchType !== undefined ? searchOverrides.searchType : searchType;
      setLoading(true);
      setError(null);
      try {
        const res = await noticeApi.list(
          p,
          PAGE_SIZE,
          kw?.trim() ? st : undefined,
          kw?.trim() || undefined
        );
        const d = unwrap(res);
        setNotices(d?.content || []);
        setTotalPages(d?.totalPages ?? 0);
        setTotalElements(d?.totalElements ?? 0);
        setPage(p);
      } catch (err) {
        console.error("[Notice] fetch error:", err);
        setError("공지사항을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [keyword, searchType]
  );

  useEffect(() => {
    fetchNotices(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    const nextKeyword = searchInput.trim();
    setKeyword(nextKeyword);
    fetchNotices(1, { keyword: nextKeyword, searchType });
  };

  const openDetail = async (notice) => {
    try {
      const res = await noticeApi.get(notice.noticeId);
      setSelected(unwrap(res));
    } catch (err) {
      console.error("[Notice] detail error:", err);
    }
  };

  return (
    <>
      <PageHeader
        title="공지사항"
        subtitle="플랫폼 운영 및 주요 안내 사항을 공지하는 공간입니다."
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={(path) => navigate(path)}
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
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#222" }}>
            총 {totalElements}개
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "7px 32px 7px 12px",
                fontSize: "14px",
                color: "#333",
                background: "#fff",
                cursor: "pointer",
                minWidth: "100px",
              }}
            >
              {SEARCH_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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
                placeholder="검색어를 입력하세요."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                style={{
                  border: "none",
                  outline: "none",
                  padding: "8px 12px",
                  fontSize: "14px",
                  color: "#333",
                  width: "200px",
                  background: "transparent",
                }}
              />
              <button
                type="button"
                onClick={handleSearch}
                style={{
                  border: "none",
                  background: "#fff",
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f5f5f5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#fff")
                }
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
            <Loader2
              size={28}
              color="#999"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            <div
              style={{
                marginTop: 12,
                fontSize: "14px",
                color: "#999",
              }}
            >
              최신 공지를 불러오고 있습니다.
            </div>
          </div>
        )}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "14px", color: "#999", marginBottom: 12 }}>
              {error}
            </div>
            <button
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
          <div>
            {notices.map((notice) => (
              <div
                key={notice.noticeId}
                onClick={() => openDetail(notice)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "18px 4px",
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
                {notice.pinned && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#EF4444",
                      marginRight: 8,
                      flexShrink: 0,
                    }}
                  >
                    📌
                  </span>
                )}
                <span
                  style={{
                    flex: 1,
                    fontSize: "15px",
                    color: "#222",
                    fontWeight: "400",
                  }}
                >
                  {notice.title}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#999",
                    marginLeft: "16px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtDate(notice.createdAt)}
                </span>
              </div>
            ))}
            {notices.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "#999",
                  fontSize: "14px",
                }}
              >
                {keyword ? "검색 결과가 없습니다." : "공지사항이 없습니다."}
              </div>
            )}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              marginTop: "36px",
            }}
          >
            <button
              type="button"
              onClick={() => fetchNotices(page - 1)}
              disabled={page <= 1}
              style={{
                background: "none",
                border: "none",
                color: page <= 1 ? "#ddd" : "#666",
                cursor: page <= 1 ? "default" : "pointer",
                padding: "4px 8px",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => fetchNotices(i + 1)}
                style={{
                  fontSize: "14px",
                  fontWeight: i + 1 === page ? "700" : "500",
                  color: i + 1 === page ? "#222" : "#999",
                  background: i + 1 === page ? "#f0f0f0" : "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 10px",
                  borderRadius: "4px",
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => fetchNotices(page + 1)}
              disabled={page >= totalPages}
              style={{
                background: "none",
                border: "none",
                color: page >= totalPages ? "#ddd" : "#666",
                cursor: page >= totalPages ? "default" : "pointer",
                padding: "4px 8px",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* 상세보기 모달 */}
      {selected && (
        <DetailModal item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
