import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommunityPagination from "./shared/CommunityPagination";
import {
  Search,
  ListFilter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  MessageCircle,
  ChevronDown,
  SlidersHorizontal,
  Award,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import PageLoading from "../components/PageLoading";
import EmptyState from "../components/EmptyState";
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

function maskDisplayName(value, maxUnits) {
  const src = String(value || "").trim();
  if (!src) return "";
  let used = 0;
  let out = "";
  for (const ch of src) {
    const units = ch.charCodeAt(0) <= 127 ? 1 : 2;
    if (used + units > maxUnits) return `${out}*`;
    out += ch;
    used += units;
  }
  return out;
}

/** 목록 표시용: API는 reviewTitle, 구버전/호환용 title, 없으면 본문 첫 줄 */
function displayReviewListTitle(item) {
  const explicit = String(item?.reviewTitle ?? item?.title ?? "").trim();
  if (explicit) return explicit;
  const plain = htmlToPlainText(item?.content || "").trim();
  const firstLine =
    plain
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find(Boolean) || "";
  return firstLine || "후기";
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
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("latest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [ratingDdOpen, setRatingDdOpen] = useState(false);
  const ratingDdRef = useRef(null);
  const sortDdRef = useRef(null);
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
          Boolean(data?.last) ||
          totalPages === 0 ||
          pageIndex + 1 >= totalPages;
        pageIndex += 1;
      }

      setItems(rows);

      const eventIds = [
        ...new Set(rows.map((row) => row?.eventId).filter(Boolean)),
      ];
      if (eventIds.length > 0) {
        const entries = await Promise.all(
          eventIds.map(async (eventId) => {
            try {
              const res = await eventApi.getEventDetail(eventId);
              const eventDetail = res?.data?.data || {};
              return [
                eventId,
                normalizeEventTitle(
                  eventDetail?.eventName || `행사 ${eventId}`,
                  eventDetail,
                ),
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
      setError(
        err?.response?.data?.message || "행사 후기를 불러오지 못했습니다.",
      );
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
    const pendingItems = items.filter(
      (item) => commentCountMap[item.reviewId] == null,
    );
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
      const eventName = String(
        eventNameMap[item.eventId] || item.eventName || "",
      ).toLowerCase();
      const title = String(item.reviewTitle || "").toLowerCase();
      const text = htmlToPlainText(item.content || "").toLowerCase();
      return (
        !keyword ||
        title.includes(keyword) ||
        text.includes(keyword) ||
        eventName.includes(keyword)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === "views") {
        return Number(b.viewCount || 0) - Number(a.viewCount || 0);
      }
      if (sortOption === "comments") {
        return (
          Number(commentCountMap[b.reviewId] || 0) -
          Number(commentCountMap[a.reviewId] || 0)
        );
      }
      return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
    });
  }, [commentCountMap, eventNameMap, items, search, sortOption]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedFilteredItems.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedFilteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, sortedFilteredItems]);

  const currentSortLabel =
    SORT_OPTIONS.find((option) => option.value === sortOption)?.label ||
    "최신순";
  const currentRatingLabel =
    RATING_OPTIONS.find((option) => option.value === ratingFilter)?.label ||
    "별점 전체";

  useEffect(() => {
    const h = (e) => {
      if (ratingDdRef.current && !ratingDdRef.current.contains(e.target))
        setRatingDdOpen(false);
      if (sortDdRef.current && !sortDdRef.current.contains(e.target))
        setSortMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncViewport = () => setViewportWidth(window.innerWidth);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;

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
        icon={<Award size={42} color="#02A17E" strokeWidth={1.6} />}
        titleStyle={{ fontSize: 46, lineHeight: "66px", letterSpacing: "-1px" }}
        subtitleStyle={{ fontSize: 20 }}
        categories={COMMUNITY_CATEGORIES}
        currentPath="/community/review"
        onNavigate={(path) => navigate(path)}
      />
      <style>{`.board-search-input::placeholder{color:#9ca3af;font-size:13px;font-weight:500;}`}</style>

      <main
        style={{
          width: isMobile
            ? "calc(100% - 20px)"
            : isTablet
              ? "calc(100% - 28px)"
              : "min(1400px, calc(100% - 40px))",
          margin: "0 auto",
          padding: isMobile
            ? "20px 0 40px"
            : isTablet
              ? "28px 0 52px"
              : "40px 0 64px",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
            paddingBottom: "16px",
            marginBottom: "8px",
            gap: isMobile ? 12 : 8,
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#222" }}>
            총 {sortedFilteredItems.length}개
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: isMobile ? "100%" : "auto",
              flexWrap: isMobile ? "wrap" : "nowrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                background: "#f3f4f6",
                borderRadius: isMobile ? 16 : 999,
                height: isMobile ? "auto" : 42,
                width: isMobile ? "100%" : "auto",
                flexWrap: isMobile ? "wrap" : "nowrap",
                padding: isMobile ? 6 : 0,
                rowGap: isMobile ? 6 : 0,
              }}
            >
              {/* rating dropdown */}
              <div
                style={{
                  position: "relative",
                  flex: isMobile ? "1 1 calc(50% - 3px)" : "0 0 auto",
                }}
                ref={ratingDdRef}
              >
                <button
                  type="button"
                  onClick={() => setRatingDdOpen((v) => !v)}
                  style={{
                    height: 42,
                    padding: "0 36px 0 14px",
                    border: "none",
                    background: "transparent",
                    color: "#9ca3af",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                    outline: "none",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    minWidth: 120,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <ListFilter size={14} style={{ color: "#9ca3af" }} />
                  {currentRatingLabel}
                </button>
                <ChevronDown
                  size={15}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: ratingDdOpen
                      ? "translateY(-50%) rotate(180deg)"
                      : "translateY(-50%)",
                    color: "#9ca3af",
                    pointerEvents: "none",
                    transition: "transform .15s ease",
                  }}
                />
                {ratingDdOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: 0,
                      minWidth: 200,
                      background: "#fff",
                      borderRadius: 16,
                      padding: "8px 0",
                      boxShadow: "0 4px 24px rgba(0,0,0,.10)",
                      zIndex: 50,
                      maxHeight: 280,
                      overflowY: "auto",
                    }}
                  >
                    {RATING_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setRatingFilter(option.value);
                          setRatingDdOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          padding: "11px 16px",
                          border: "none",
                          background: "none",
                          color:
                            ratingFilter === option.value
                              ? "#111827"
                              : "#6b7280",
                          fontSize: 13,
                          fontWeight: ratingFilter === option.value ? 600 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f9fafb")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <ListFilter
                          size={14}
                          style={{ color: "#9ca3af", flexShrink: 0 }}
                        />
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!isMobile && (
                <div
                  style={{
                    width: 1,
                    height: 20,
                    background: "#dbe2ea",
                    flexShrink: 0,
                  }}
                />
              )}

              {/* sort button */}
              <div
                style={{
                  position: "relative",
                  flex: isMobile ? "1 1 calc(50% - 3px)" : "0 0 auto",
                }}
                ref={sortDdRef}
              >
                <button
                  type="button"
                  onClick={() => setSortMenuOpen((prev) => !prev)}
                  style={{
                    height: 42,
                    padding: "0 36px 0 14px",
                    border: "none",
                    background: "transparent",
                    color: "#9ca3af",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                    outline: "none",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    minWidth: 110,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <SlidersHorizontal size={14} style={{ color: "#9ca3af" }} />
                  {currentSortLabel}
                </button>
                <ChevronDown
                  size={15}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: sortMenuOpen
                      ? "translateY(-50%) rotate(180deg)"
                      : "translateY(-50%)",
                    color: "#9ca3af",
                    pointerEvents: "none",
                    transition: "transform .15s ease",
                  }}
                />
                {sortMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: 0,
                      minWidth: 200,
                      background: "#fff",
                      borderRadius: 16,
                      padding: "8px 0",
                      boxShadow: "0 4px 24px rgba(0,0,0,.10)",
                      zIndex: 50,
                      maxHeight: 280,
                      overflowY: "auto",
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
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          padding: "11px 16px",
                          border: "none",
                          background: "none",
                          color:
                            sortOption === option.value ? "#111827" : "#6b7280",
                          fontSize: 13,
                          fontWeight: sortOption === option.value ? 600 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f9fafb")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <SlidersHorizontal
                          size={14}
                          style={{ color: "#9ca3af", flexShrink: 0 }}
                        />
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!isMobile && (
                <div
                  style={{
                    width: 1,
                    height: 20,
                    background: "#dbe2ea",
                    flexShrink: 0,
                  }}
                />
              )}

              {/* search input */}
              <div
                style={{
                  position: "relative",
                  flex: isMobile ? "1 1 100%" : "1 1 auto",
                  minWidth: 0,
                  width: isMobile ? "100%" : "auto",
                }}
              >
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
                  placeholder="후기 또는 행사명 검색"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  style={{
                    border: isMobile ? "1px solid #dbe2ea" : "none",
                    background: isMobile ? "#fff" : "transparent",
                    padding: "0 14px 0 40px",
                    borderRadius: isMobile ? 999 : "0 999px 999px 0",
                    height: 42,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#111827",
                    outline: "none",
                    width: isMobile ? "100%" : 280,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleWrite}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                background: "#2EB893",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Noto Sans KR', sans-serif",
                width: isMobile ? "100%" : "auto",
                justifyContent: "center",
              }}
            >
              <Plus size={14} strokeWidth={2.5} /> 글쓰기
            </button>
          </div>
        </div>

        {loading && <PageLoading message="후기를 불러오는 중입니다" />}

        {!loading && error && (
          <EmptyState
            type="error"
            message="후기를 불러오지 못했습니다"
            description="네트워크 연결을 확인하고 다시 시도해 주세요."
          />
        )}

        {!loading && !error && (
          <>
            <div>
              {!isMobile && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "#f9fafb",
                    borderTop: "2px solid #333",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#6b7280",
                  }}
                >
                  <span
                    style={{ width: 60, textAlign: "center", flexShrink: 0 }}
                  >
                    번호
                  </span>
                  <span style={{ flex: 1, textAlign: "center" }}>제목</span>
                  <span
                    style={{ width: 100, textAlign: "center", flexShrink: 0 }}
                  >
                    작성자
                  </span>
                  <span
                    style={{ width: 100, textAlign: "center", flexShrink: 0 }}
                  >
                    별점
                  </span>
                  <span
                    style={{ width: 100, textAlign: "center", flexShrink: 0 }}
                  >
                    등록일
                  </span>
                </div>
              )}
              {pagedItems.map((item, index) => {
                const commentCount = Number(
                  commentCountMap[item.reviewId] || 0,
                );
                const eventLabel =
                  eventNameMap[item.eventId] ||
                  item.eventName ||
                  `행사 ${item.eventId}`;
                const reviewTitle =
                  item.reviewTitle || item.title || "행사 후기";
                const authorLabel =
                  item?.writerNickname ||
                  item?.writerEmail ||
                  item?.author ||
                  item?.nickname ||
                  item?.userName ||
                  (item?.userId ? `회원 #${item.userId}` : "익명 사용자");
                const maskedAuthorLabel = maskDisplayName(authorLabel, 10);
                const rowNumber =
                  sortedFilteredItems.length -
                  (currentPage - 1) * PAGE_SIZE -
                  index;
                return (
                  <div
                    key={item.reviewId}
                    onClick={() =>
                      navigate(`/community/review/${item.reviewId}`)
                    }
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "stretch" : "center",
                      gap: isMobile ? 8 : 0,
                      padding: isMobile ? "14px 12px" : "18px 16px",
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
                    {!isMobile && (
                      <span
                        style={{
                          width: 60,
                          textAlign: "center",
                          fontSize: 13,
                          color: "#9ca3af",
                          flexShrink: 0,
                        }}
                      >
                        {rowNumber}
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                          minWidth: 0,
                        }}
                      >
                        <BadgeTag
                          badge={badge}
                          style={
                            isMobile
                              ? {
                                  ...badge.style,
                                  padding: "4px 10px",
                                  fontSize: 11,
                                }
                              : undefined
                          }
                        />
                        {!isMobile && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: 44,
                              padding: "4px 10px",
                              borderRadius: 999,
                              background: "#F1F5F9",
                              color: "#475569",
                              fontSize: 12,
                              fontWeight: 600,
                              lineHeight: 1,
                            }}
                          >
                            {eventLabel}
                          </span>
                        )}
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: isMobile ? 14 : 15,
                            color: "#111827",
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: isMobile ? "clip" : "ellipsis",
                            whiteSpace: isMobile ? "normal" : "nowrap",
                            wordBreak: "keep-all",
                            overflowWrap: "break-word",
                          }}
                        >
                          {displayReviewListTitle(item)}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            fontWeight: 600,
                            flexShrink: 0,
                            marginLeft: 6,
                          }}
                        >
                          +{commentCount}
                        </span>
                      </div>
                      {isMobile && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                            marginTop: 6,
                            fontSize: 13,
                            color: "#6b7280",
                          }}
                        >
                          <span style={{ color: "#4B5563", fontWeight: 600 }}>
                            {eventLabel}
                          </span>
                          <span style={{ color: "#cbd5e1" }}>·</span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {renderStars(Number(item.rating || 0), 12)}
                          </span>
                          <span style={{ color: "#cbd5e1" }}>·</span>
                          <span>{maskedAuthorLabel}</span>
                          <span style={{ color: "#cbd5e1" }}>·</span>
                          <span
                            style={{ color: "#9ca3af", whiteSpace: "nowrap" }}
                          >
                            {fmtDate(item.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                    {!isMobile && (
                      <span
                        style={{
                          width: 100,
                          textAlign: "center",
                          fontSize: 13,
                          color: "#6b7280",
                          flexShrink: 0,
                        }}
                      >
                        {maskedAuthorLabel}
                      </span>
                    )}
                    {!isMobile && (
                      <span
                        style={{
                          width: 100,
                          textAlign: "center",
                          flexShrink: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((starIndex) => (
                          <Star
                            key={starIndex}
                            size={12}
                            color={
                              starIndex <= Number(item.rating || 0)
                                ? "#F59E0B"
                                : "#D1D5DB"
                            }
                            fill={
                              starIndex <= Number(item.rating || 0)
                                ? "#F59E0B"
                                : "none"
                            }
                          />
                        ))}
                      </span>
                    )}
                    {!isMobile && (
                      <span
                        style={{
                          width: 100,
                          textAlign: "center",
                          fontSize: 13,
                          color: "#9ca3af",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {fmtDate(item.createdAt)}
                      </span>
                    )}
                  </div>
                );
              })}

              {pagedItems.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 0",
                    color: "#999",
                    fontSize: "14px",
                  }}
                >
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
