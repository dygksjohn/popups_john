import { useState, useEffect, useCallback } from "react";
import PageHeader from "../components/PageHeader";
import { Search, Loader2, ChevronLeft, ChevronRight, ChevronDown, Star } from "lucide-react";
import { reviewApi } from "../../../app/http/reviewApi";
import { replyApi } from "../../../app/http/replyApi";
import { COMMUNITY_CATEGORIES, getBoardBadge } from "./communityConfig";

const PAGE_SIZE = 10;

function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** DB review_title 우선, 없으면 content 첫 줄로 제목 추출 */
function getDisplayTitle(item) {
  const t = item?.reviewTitle ?? item?.review_title ?? "";
  if (t && String(t).trim()) return String(t).trim();
  const firstLine = String(item?.content || "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return "행사 후기";
  return firstLine.length > 58 ? `${firstLine.slice(0, 58)}...` : firstLine;
}

function renderStars(rating = 0) {
  return Array.from({ length: 5 }, (_, idx) => (
    <Star
      key={idx}
      size={14}
      fill={idx < rating ? "#F59E0B" : "none"}
      color={idx < rating ? "#F59E0B" : "#D1D5DB"}
      strokeWidth={1.6}
    />
  ));
}

/** 작성자 표시: 영문 기준 5글자, 이메일 앞 2글자 + 나머지 * */
function maskWriterEmail(email) {
  if (!email || typeof email !== "string") return "-----";
  const s = String(email).trim();
  const first2 = s.slice(0, 2);
  return (first2 + "***").slice(0, 5);
}

export default function Review() {
  const [search, setSearch] = useState("");
  const [currentPath, setCurrentPath] = useState("/community/review");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [openReplies, setOpenReplies] = useState({});
  const [commentCache, setCommentCache] = useState({});
  const [commentLoadingId, setCommentLoadingId] = useState(null);

  const toggleReply = async (reviewId) => {
    const nextOpen = !openReplies[reviewId];
    setOpenReplies((prev) => ({ ...prev, [reviewId]: nextOpen }));
    if (nextOpen && !commentCache[reviewId]) {
      setCommentLoadingId(reviewId);
      try {
        const res = await replyApi.list("REVIEW", reviewId, 0, 50);
        const list = res?.content ?? [];
        setCommentCache((prev) => ({ ...prev, [reviewId]: list }));
      } catch (e) {
        console.error("[Review] comments fetch failed:", e);
        setCommentCache((prev) => ({ ...prev, [reviewId]: [] }));
      } finally {
        setCommentLoadingId(null);
      }
    }
  };

  const fetchList = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const d = await reviewApi.list({ page: p - 1, size: PAGE_SIZE });
      const content = Array.isArray(d?.content) ? d.content : [];
      setItems(content);
      setTotalPages(d?.totalPages || 0);
      setTotalElements(d?.totalElements ?? content.length);
      setPage(p);
    } catch (e) {
      console.error("[Review] list fetch failed:", e);
      setError("행사후기 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(1);
  }, [fetchList]);

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.trim();
    return getDisplayTitle(item).includes(q) || (item.content || "").includes(q);
  });

  const badge = getBoardBadge("REVIEW");

  return (
    <>
      <PageHeader
        title="행사후기"
        subtitle="참가자들이 남긴 생생한 행사 후기를 확인해보세요."
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
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#222" }}>
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
              placeholder="후기 내용 검색"
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
            <Loader2 size={28} color="#999" style={{ animation: "spin 1s linear infinite" }} />
            <div style={{ marginTop: 12, fontSize: "14px", color: "#999" }}>후기를 불러오고 있습니다.</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "14px", color: "#999", marginBottom: 12 }}>{error}</div>
            <button
              onClick={() => fetchList(page)}
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
              {filtered.map((item) => (
                <div key={item.reviewId} style={{ borderBottom: "1px solid #e8e8e8" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "18px 4px",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      gap: "0",
                    }}
                    onClick={() => toggleReply(item.reviewId)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ ...badge.style, marginRight: 12 }}>{badge.text}</span>
                    <span
                      style={{
                        display: "inline-flex",
                        transition: "transform 0.2s ease",
                        transform: openReplies[item.reviewId] ? "rotate(180deg)" : "rotate(0deg)",
                        marginRight: 12,
                        flexShrink: 0,
                      }}
                    >
                      <ChevronDown size={18} strokeWidth={2.5} color="#666" />
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#64748B",
                        marginRight: 12,
                        flexShrink: 0,
                        maxWidth: 140,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.eventName ?? item.event_name ?? (item.eventId ? `행사 #${item.eventId}` : "-")}
                    </span>
                    <span style={{ flex: 1, fontSize: "15px", color: "#222", fontWeight: 400, minWidth: 0 }}>
                      {getDisplayTitle(item)}
                    </span>
                    <div
                      style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#999", whiteSpace: "nowrap", textAlign: "right" }}>
                        {maskWriterEmail(item.writerEmail ?? item.email)}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 2, textAlign: "right" }}>
                        {renderStars(item.rating || 0)}
                      </span>
                      <span style={{ fontSize: "13px", color: "#999", whiteSpace: "nowrap", textAlign: "right" }}>
                        작성일 {fmtDate(item.createdAt)}
                      </span>
                      <span style={{ fontSize: "13px", color: "#999", whiteSpace: "nowrap", textAlign: "right" }}>
                        조회수 {item.viewCount ?? 0}
                      </span>
                    </div>
                  </div>

                  {openReplies[item.reviewId] && (
                    <div
                      style={{
                        padding: "16px 20px",
                        background: "#f7f9ff",
                        borderTop: "1px dashed #dde6ff",
                        animation: "expandIn .15s ease",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 14,
                          color: "#334155",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                          margin: "0 0 16px",
                        }}
                      >
                        {item.content || "내용이 없습니다."}
                      </p>
                      {commentLoadingId === item.reviewId ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", fontSize: 13, color: "#64748B" }}>
                          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                          댓글 불러오는 중...
                        </div>
                      ) : (commentCache[item.reviewId]?.length > 0 ? (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
                          {commentCache[item.reviewId].map((c) => (
                            <div
                              key={c.replyId}
                              style={{
                                marginBottom: 12,
                                padding: "10px 12px",
                                background: "#fff",
                                borderRadius: 8,
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: "0 0 8px" }}>
                                {c.content}
                              </p>
                              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, fontSize: 12, color: "#64748B" }}>
                                <span style={{ textAlign: "right" }}>{maskWriterEmail(c.writerEmail ?? c.writer_email)}</span>
                                <span style={{ textAlign: "right" }}>작성일 {fmtDate(c.createdAt ?? c.created_at)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null)}
                    </div>
                  )}
                </div>
              ))}

              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: "14px" }}>
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
                  onClick={() => page > 1 && fetchList(page - 1)}
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
                    onClick={() => fetchList(i + 1)}
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
                  onClick={() => page < totalPages && fetchList(page + 1)}
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
