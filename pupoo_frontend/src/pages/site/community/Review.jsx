import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommunityPagination from "./shared/CommunityPagination";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import PageLoading from "../components/PageLoading";
import EmptyState from "../components/EmptyState";
import sortIcon from "../../../assets/sort-icon.svg";
import { reviewApi } from "../../../app/http/reviewApi";
import { eventApi } from "../../../app/http/eventApi";
import { reviewReplyApi } from "../../../app/http/replyApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { COMMUNITY_CATEGORIES, getBoardBadge } from "./communityConfig";
import { htmlToPlainText } from "./shared/communityHtml";
import { normalizeEventTitle } from "../../../shared/utils/eventDisplay";

const PAGE_SIZE = 10;
const REVIEW_FETCH_SIZE = 100;

const RATING_OPTIONS = [
  { value: "ALL", label: "별점 전체" },
  { value: "1", label: "1점" },
  { value: "2", label: "2점" },
  { value: "3", label: "3점" },
  { value: "4", label: "4점" },
  { value: "5", label: "5점" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "comments", label: "댓글순" },
  { value: "views", label: "조회순" },
];

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function toTimestamp(value) {
  const ts = Date.parse(String(value || ""));
  return Number.isFinite(ts) ? ts : 0;
}

function renderStars(rating = 0, size = 14) {
  return Array.from({ length: 5 }, (_, idx) => (
    <Star
      key={idx}
      size={size}
      fill={idx < rating ? "#F59E0B" : "none"}
      color={idx < rating ? "#F59E0B" : "#D1D5DB"}
      strokeWidth={1.6}
    />
  ));
}

export default function Review() {
  const navigate = useNavigate();
  const badge = getBoardBadge("REVIEW");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("latest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [commentCountMap, setCommentCountMap] = useState({});
  const [eventNameMap, setEventNameMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = [];
      let pageIndex = 0;
      let finished = false;

      while (!finished && pageIndex < 20) {
        const data = await reviewApi.list({
          page: pageIndex,
          size: REVIEW_FETCH_SIZE,
          rating: ratingFilter === "ALL" ? undefined : Number(ratingFilter),
        });
        const content = Array.isArray(data?.content) ? data.content : [];
        rows.push(...content);

        const totalPages = Number(data?.totalPages) || 0;
        finished =
          Boolean(data?.last) || totalPages === 0 || pageIndex + 1 >= totalPages;
        pageIndex += 1;
      }

      setItems(rows);

      const eventIds = [...new Set(rows.map((row) => row?.eventId).filter(Boolean))];
      if (eventIds.length > 0) {
        const entries = await Promise.all(
          eventIds.map(async (eventId) => {
            try {
              const res = await eventApi.getEventDetail(eventId);
              const eventDetail = res?.data?.data || {};
              return [
                eventId,
                normalizeEventTitle(eventDetail?.eventName || `행사 ${eventId}`, eventDetail),
              ];
            } catch {
              return [eventId, `행사 ${eventId}`];
            }
          }),
        );
        setEventNameMap(Object.fromEntries(entries));
      } else {
        setEventNameMap({});
      }
    } catch (err) {
      console.error("[Review] load failed:", err);
      setItems([]);
      setError(err?.response?.data?.message || "행사 후기를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [ratingFilter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    setPage(1);
  }, [search, ratingFilter, sortOption]);

  useEffect(() => {
    if (!items.length) return;
    const pendingItems = items.filter((item) => commentCountMap[item.reviewId] == null);
    if (!pendingItems.length) return;

    const loadCounts = async () => {
      const pairs = await Promise.all(
        pendingItems.map(async (item) => {
          try {
            const data = await reviewReplyApi.list(item.reviewId, 0, 1);
            const total = Number(data?.totalElements);
            const count = Number.isFinite(total)
              ? total
              : Array.isArray(data?.content)
                ? data.content.length
                : 0;
            return [item.reviewId, count];
          } catch {
            return [item.reviewId, 0];
          }
        }),
      );

      setCommentCountMap((prev) => ({
        ...prev,
        ...Object.fromEntries(pairs),
      }));
    };

    loadCounts().catch(() => {});
  }, [commentCountMap, items]);

  const sortedFilteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const eventName = String(eventNameMap[item.eventId] || item.eventName || "").toLowerCase();
      const title = String(item.reviewTitle || "").toLowerCase();
      const text = htmlToPlainText(item.content || "").toLowerCase();
      return !keyword || title.includes(keyword) || text.includes(keyword) || eventName.includes(keyword);
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === "views") {
        return Number(b.viewCount || 0) - Number(a.viewCount || 0);
      }
      if (sortOption === "comments") {
        return Number(commentCountMap[b.reviewId] || 0) - Number(commentCountMap[a.reviewId] || 0);
      }
      return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
    });
  }, [commentCountMap, eventNameMap, items, search, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sortedFilteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedFilteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, sortedFilteredItems]);

  const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sortOption)?.label || "최신순";

  const handleWrite = () => {
    if (!tokenStore.getAccess()) {
      navigate("/auth/login", { state: { from: "/community/review" } });
      return;
    }
    navigate("/community/review/write");
  };

  return (
    <>
      <PageHeader
        title="행사후기"
        subtitle="행사에 참여한 사용자의 후기와 별점을 확인하세요"
        categories={COMMUNITY_CATEGORIES}
        currentPath="/community/review"
        onNavigate={(path) => navigate(path)}
      />

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
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#222" }}>총 {sortedFilteredItems.length}개</span>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <select
                value={ratingFilter}
                onChange={(event) => setRatingFilter(event.target.value)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  background: "#fff",
                  height: 38,
                  padding: "0 34px 0 12px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#334155",
                  cursor: "pointer",
                  minWidth: 108,
                }}
              >
                {RATING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ChevronDown size={14} color="#666" />
              </span>
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
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortOption(option.value);
                        setSortMenuOpen(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        borderBottom: "1px solid #f1f5f9",
                        background: option.value === sortOption ? "#eff6ff" : "#fff",
                        color: option.value === sortOption ? "#1D4ED8" : "#334155",
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
                placeholder="제목/행사명/내용 검색"
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

            <button
              type="button"
              onClick={handleWrite}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: "#4a7cf7",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              <Plus size={14} strokeWidth={2.5} /> 글쓰기
            </button>
          </div>
        </div>

        {loading && (
          <PageLoading message="후기를 불러오는 중입니다" />
        )}

        {!loading && error && (
          <EmptyState type="error" message="후기를 불러오지 못했습니다" description={error} />
        )}

        {!loading && !error && (
          <>
            <div>
              {pagedItems.map((item) => {
                const commentCount = Number(commentCountMap[item.reviewId] || 0);
                const eventLabel = eventNameMap[item.eventId] || item.eventName || `행사 ${item.eventId}`;
                return (
                  <div
                    key={item.reviewId}
                    onClick={() => navigate(`/community/review/${item.reviewId}`)}
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
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>[{eventLabel}]</span>
                    <span style={{ flex: 1, fontSize: "15px", color: "#222", fontWeight: 500 }}>
                      {item.reviewTitle || "행사 후기"}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, minWidth: 96, justifyContent: "center" }}>
                      {renderStars(item.rating || 0, 13)}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "#64748B",
                        minWidth: 64,
                        justifyContent: "flex-end",
                      }}
                    >
                      <MessageCircle size={13} />
                      {commentCount}
                    </span>
                    <span style={{ fontSize: "12px", color: "#94A3B8", minWidth: 60, textAlign: "right" }}>
                      조회 {item.viewCount ?? 0}
                    </span>
                    <span style={{ fontSize: "13px", color: "#999", whiteSpace: "nowrap", minWidth: 94, textAlign: "right" }}>
                      {fmtDate(item.createdAt)}
                    </span>
                  </div>
                );
              })}

              {pagedItems.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: "14px" }}>
                  {search.trim() ? "검색 결과가 없습니다." : "후기가 없습니다."}
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
