import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import PageLoading from "../components/PageLoading";
import EmptyState from "../components/EmptyState";
import CommunityPagination from "./shared/CommunityPagination";
import {
  ChevronDown,
  Search,
  Plus,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ListFilter,
} from "lucide-react";
import { qnaApi, unwrap } from "../../../api/qnaApi";
import { COMMUNITY_CATEGORIES, getBoardBadge } from "./communityConfig";
import CommunityContentTextarea from "./shared/CommunityContentTextarea";
import { hasMeaningfulCommunityContent } from "./shared/communityHtml";

const FILTER_OPTIONS = [
  "전체",
  "답변완료",
  "미답변",
];
const SORT_OPTIONS = [
  { key: "recent", label: "최신순" },
  { key: "views", label: "조회순" },
];

/* ?? ?좎쭨 ?щ㎎ ?? */
function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function toTimestamp(value) {
  const time = Date.parse(String(value || ""));
  return Number.isFinite(time) ? time : 0;
}

function hasAnswer(item) {
  return Boolean(String(item?.answerContent ?? "").trim()) || Boolean(item?.answeredAt);
}

/* ?? ?좎뒪???? */
function Toast({ msg, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  const bg = type === "success" ? "#10B981" : "#EF4444";
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        background: bg,
        color: "#fff",
        padding: "12px 22px",
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: "'Noto Sans KR', sans-serif",
        boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {type === "success" ? "완료" : "오류"} {msg}
    </div>
  );
}

/* ?? ?ㅻ쾭?덉씠 ?? */
function Overlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        background: "rgba(0,0,0,0.32)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: 520,
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ?? 삭제 ?뺤씤 紐⑤떖 ?? */
function ConfirmModal({ title, msg, onConfirm, onCancel, loading }) {
  return (
    <Overlay onClose={onCancel}>
      <div style={{ padding: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#FEF2F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={18} color="#EF4444" />
          </div>
          <h3
            style={{ fontSize: 16, fontWeight: 700, color: "#222", margin: 0 }}
          >
            {title}
          </h3>
        </div>
        <p
          style={{
            fontSize: 14,
            color: "#64748B",
            lineHeight: 1.6,
            whiteSpace: "pre-line",
            margin: "0 0 24px",
          }}
        >
          {msg}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: "#666",
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: "#EF4444",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ?? 湲?곌린/수정 紐⑤떖 ?? */
function WriteModal({ item, onSave, onClose, saving }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    title: item?.title || "",
    content: item?.content || "",
  });
  const [err, setErr] = useState("");

  const handleSave = () => {
    if (!form.title.trim()) {
      setErr("제목을 입력해 주세요.");
      return;
    }
    if (!hasMeaningfulCommunityContent(form.content)) {
      setErr("내용을 입력해 주세요.");
      return;
    }
    onSave(form);
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "28px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h3
            style={{ fontSize: 18, fontWeight: 700, color: "#222", margin: 0 }}
          >
            {isEdit ? "질문 수정" : "질문 등록"}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid #eee",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} color="#999" />
          </button>
        </div>

        {err && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: "#DC2626",
              marginBottom: 18,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={14} /> {err}
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#555",
              marginBottom: 6,
              display: "block",
            }}
          >
            제목 <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="질문 제목을 입력해 주세요"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 14,
              color: "#222",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#4a7cf7")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#555",
              marginBottom: 6,
              display: "block",
            }}
          >
            내용 <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <CommunityContentTextarea
            value={form.content}
            onChange={(value) => setForm((p) => ({ ...p, content: value }))}
            placeholder="질문 내용을 입력해 주세요."
            height={280}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              color: "#666",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 8,
              border: "none",
              background: "#4a7cf7",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Noto Sans KR', sans-serif",
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? "저장 중..." : isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   硫붿씤 而댄룷?뚰듃
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
export default function ServicePage() {
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState("/community/qna");
  const [filter, setFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [filterDdOpen, setFilterDdOpen] = useState(false);
  const filterDdRef = useRef(null);
  const sortDdRef = useRef(null);
  const [openReplies, setOpenReplies] = useState({});

  /* ???? API ???? ???? */
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [writeModal, setWriteModal] = useState(null); // null | { } | { item }
  const [deleteModal, setDeleteModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const toggleReply = (id) => {
    setOpenReplies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* ?? 紐⑸줉 議고쉶 ?? */
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchSize = 100;
      const firstRes = await qnaApi.list(1, fetchSize);
      const firstData = unwrap(firstRes) || {};
      const rows = Array.isArray(firstData.content) ? [...firstData.content] : [];
      const lastPage = Math.max(1, Number(firstData.totalPages) || 1);

      if (lastPage > 1) {
        const rest = await Promise.all(
          Array.from({ length: lastPage - 1 }, (_, index) =>
            qnaApi.list(index + 2, fetchSize),
          ),
        );

        rest.forEach((response) => {
          const data = unwrap(response) || {};
          const content = Array.isArray(data.content) ? data.content : [];
          rows.push(...content);
        });
      }

      setItems(rows);
    } catch (err) {
      console.error("[QnA] fetch error:", err);
      setError("질문 목록을 불러오지 못했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /* ?? ?꾪꽣留??? */
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((q) => {
      const statusLabel = hasAnswer(q)
        ? "답변완료"
        : "미답변";
      const matchFilter = filter === "전체" || filter === statusLabel;
      const matchSearch =
        !keyword ||
        String(q?.title || "").toLowerCase().includes(keyword) ||
        String(q?.content || "").toLowerCase().includes(keyword) ||
        String(q?.answerContent || "").toLowerCase().includes(keyword);
      return matchFilter && matchSearch;
    });
  }, [filter, items, search]);

  const sortedItems = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      if (sortKey === "views") {
        const diff = Number(b?.viewCount || 0) - Number(a?.viewCount || 0);
        if (diff !== 0) return diff;
      }
      return toTimestamp(b?.createdAt) - toTimestamp(a?.createdAt);
    });
    return rows;
  }, [filtered, sortKey]);

  const totalElements = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(
    () => sortedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, sortedItems],
  );

  useEffect(() => {
    setPage(1);
  }, [filter, search, sortKey]);

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
      if (filterDdRef.current && !filterDdRef.current.contains(e.target)) setFilterDdOpen(false);
      if (sortDdRef.current && !sortDdRef.current.contains(e.target)) setSortMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /*?? ?깅줉 ?? */
  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const res = await qnaApi.create(form);
      setWriteModal(null);
      showToast("질문이 등록되었습니다.");
      fetchList();
    } catch (err) {
      console.error("[QnA] create error:", err);
      showToast("등록에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ?? 수정 ?? */
  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      await qnaApi.update(writeModal.item.qnaId, form);
      setWriteModal(null);
      showToast("질문이 수정되었습니다.");
      fetchList();
    } catch (err) {
      console.error("[QnA] update error:", err);
      showToast("수정에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ?? 삭제 ?? */
  const handleDelete = async () => {
    setSaving(true);
    try {
      await qnaApi.delete(deleteModal.qnaId);
      setDeleteModal(null);
      showToast("질문이 삭제되었습니다.");
      fetchList();
    } catch (err) {
      console.error("[QnA] delete error:", err);
      setDeleteModal(null);
      showToast("삭제에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="질문/답변"
        subtitle="서비스 이용과 관련한 문의사항을 등록하고 답변을 확인할 수 있습니다."
        categories={COMMUNITY_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />
      <main
        style={{
          width: "min(1350px, calc(100% - 50px))",
          margin: "0 auto",
          padding: "40px 0 64px",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        {/* ?곷떒 ?꾪꽣/검색諛?*/}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "16px",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#222" }}>
            총 {totalElements}건
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#f3f4f6", borderRadius: 999, height: 42 }}>
              {/* status dropdown */}
              <div style={{ position: "relative", flex: "0 0 auto" }} ref={filterDdRef}>
                <button
                  type="button"
                  onClick={() => setFilterDdOpen((v) => !v)}
                  style={{ height: 42, padding: "0 36px 0 14px", border: "none", background: "transparent", color: "#9ca3af", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", outline: "none", fontFamily: "inherit", whiteSpace: "nowrap", minWidth: 120, display: "inline-flex", alignItems: "center", gap: 7 }}
                >
                  <ListFilter size={14} style={{ color: "#9ca3af" }} />
                  {filter}
                </button>
                <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: filterDdOpen ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", transition: "transform .15s ease" }} />
                {filterDdOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, minWidth: 200, background: "#fff", borderRadius: 16, padding: "8px 0", boxShadow: "0 4px 24px rgba(0,0,0,.10)", zIndex: 50, maxHeight: 280, overflowY: "auto" }}>
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setFilter(opt); setFilterDdOpen(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 16px", border: "none", background: "none", color: filter === opt ? "#111827" : "#6b7280", fontSize: 13, fontWeight: filter === opt ? 600 : 500, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        <ListFilter size={14} style={{ color: "#9ca3af", flexShrink: 0 }} />
                        {opt}
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
                  placeholder="질문 또는 답변 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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

            <button
              onClick={() => navigate("/community/qna/write")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                background: "#4a7cf7",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Noto Sans KR', sans-serif",
                transition: "background .15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#3a6ce7")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#4a7cf7")
              }
            >
              <Plus size={14} strokeWidth={2.5} /> 질문하기
            </button>
          </div>
        </div>

        {/* 濡쒕뵫 */}
        {loading && (
          <PageLoading message="질문 목록을 불러오는 중입니다" />
        )}

        {/* ?먮윭 */}
        {!loading && error && (
          <EmptyState type="error" message="질문 목록을 불러오지 못했습니다" description={error} />
        )}

        {/* 紐⑸줉 */}
        {!loading && !error && (
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
            {pagedItems.map((q, index) => {
              const isClosed = hasAnswer(q);
              const statusLabel = isClosed ? "답변완료" : "미답변";
              const rowNumber = totalElements - ((currentPage - 1) * PAGE_SIZE) - index;

              return (
                <div
                  key={q.qnaId}
                  style={{ borderBottom: "1px solid #f0f0f0" }}
                >
                  {/* 吏덈Ц ??*/}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "18px 16px",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onClick={() => navigate(`/community/qna/${q.qnaId}`)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f9f9f9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span style={{ width: 60, textAlign: "center", fontSize: 14, color: "#9ca3af", flexShrink: 0 }}>{rowNumber}</span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: "#111827",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {q.title}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: isClosed ? "#4a7cf7" : "#999",
                          border: `1px solid ${isClosed ? "#4a7cf7" : "#ccc"}`,
                          borderRadius: 20,
                          padding: "2px 9px",
                          marginLeft: 8,
                          whiteSpace: "nowrap",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          verticalAlign: "middle",
                        }}
                      >
                        {statusLabel}
                        <span
                          style={{
                            display: "inline-flex",
                            transition: "transform 0.2s ease",
                            transform: openReplies[q.qnaId]
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          }}
                        >
                          <ChevronDown size={11} strokeWidth={2.5} />
                        </span>
                      </span>
                    </span>

                    <span style={{ width: 100, textAlign: "center", fontSize: 14, color: "#6b7280", flexShrink: 0 }}>관리자</span>
                    <span style={{ width: 100, textAlign: "center", fontSize: 14, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {fmtDate(q.createdAt)}
                    </span>
                  </div>

                  {/* ?곸꽭 ?댁슜 (?좉?) */}
                  {openReplies[q.qnaId] && (
                    <div
                      style={{
                        padding: "16px 20px",
                        background: "#f7f9ff",
                        borderTop: "1px dashed #dde6ff",
                      }}
                    >
                      {/* 吏덈Ц ?댁슜 */}
                      <p
                        style={{
                          fontSize: 14,
                          color: "#444",
                          lineHeight: 1.6,
                          margin: "0 0 16px",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {q.content}
                      </p>

                      {/* ?댁쁺???듬? */}
                      {q.answerContent && (
                        <div
                          style={{
                            padding: "14px 16px",
                            background: "#eef3ff",
                            borderRadius: 8,
                            borderLeft: "3px solid #4a7cf7",
                            marginBottom: 16,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#4a7cf7",
                              marginBottom: 6,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            re: 관리자 답변
                            {q.answeredAt && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "#999",
                                  fontWeight: 400,
                                  marginLeft: 8,
                                }}
                              >
                                {fmtDate(q.answeredAt)}
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: 14,
                              color: "#444",
                              lineHeight: 1.6,
                              margin: 0,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {q.answerContent}
                          </p>
                        </div>
                      )}

                      {/* 수정/삭제 踰꾪듉 */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 8,
                          paddingTop: 8,
                          borderTop: "1px solid #eef2ff",
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWriteModal({ item: q });
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "6px 14px",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            background: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            color: "#555",
                            fontFamily: "'Noto Sans KR', sans-serif",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#f5f5f5")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "#fff")
                          }
                        >
                          <Pencil size={12} /> 수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal(q);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "6px 14px",
                            borderRadius: 6,
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            color: "#dc2626",
                            fontFamily: "'Noto Sans KR', sans-serif",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#fee2e2")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "#fef2f2")
                          }
                        >
                          <Trash2 size={12} /> 삭제
                        </button>
                      </div>
                    </div>
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
                {items.length === 0
                  ? "아직 질문이 없습니다. 첫 번째 질문을 등록해 보세요."
                  : "검색 결과가 없습니다."}
              </div>
            )}
          </div>
        )}

        {/* ?섏씠吏?ㅼ씠??*/}
        {!loading && !error ? (
          <CommunityPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={setPage}
          />
        ) : null}
      </main>

      {/* ?? 湲?곌린/수정 紐⑤떖 ?? */}
      {writeModal?.item ? (
        <WriteModal
          item={writeModal.item}
          onSave={handleUpdate}
          onClose={() => setWriteModal(null)}
          saving={saving}
        />
      ) : null}

      {/* ?? 삭제 ?뺤씤 紐⑤떖 ?? */}
      {deleteModal && (
        <ConfirmModal
          title="질문 삭제"
          loading={saving}
          msg={`"${deleteModal.title}"을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* ?? ?좎뒪???? */}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}




