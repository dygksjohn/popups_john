import { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { qnaApi, unwrap } from "../../../api/qnaApi";
import sortIcon from "../../../assets/sort-icon.svg";
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

  /* ?? ?깅줉 ?? */
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
            borderBottom: "1px solid #e0e0e0",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#222" }}>
            총 {totalElements}건
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  height: 38,
                  padding: "0 34px 0 12px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#334155",
                  background: "#fff",
                  cursor: "pointer",
                  outline: "none",
                  minWidth: 108,
                }}
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
              <span
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ChevronDown size={14} color="#64748b" />
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
                placeholder="검색어를 입력해 주세요"
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

            {/* 湲?곌린 踰꾪듉 */}
            <button
              onClick={() => navigate("/community/qna/write")}
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
                transition: "background .15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#3a6ce7")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#4a7cf7")
              }
            >
              <Plus size={14} strokeWidth={2.5} /> 질문하기</button>
          </div>
        </div>

        {loading && (
          <PageLoading message="질문 목록을 불러오는 중입니다" />
        )}

        {!loading && error && (
          <EmptyState type="error" message="질문 목록을 불러오지 못했습니다" description={error} />
        )}

        {/* 紐⑸줉 */}
        {!loading && !error && (
          <div>
            {pagedItems.map((q) => {
              const isClosed = hasAnswer(q);
              const statusLabel = isClosed ? "답변완료" : "미답변";

              return (
                <div
                  key={q.qnaId}
                  style={{ borderBottom: "1px solid #e8e8e8" }}
                >
                  {/* 吏덈Ц ??*/}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "18px 4px",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      gap: "0",
                    }}
                    onClick={() => navigate(`/community/qna/${q.qnaId}`)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f9f9f9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span
                      style={{ ...getBoardBadge("QNA").style, marginRight: 12 }}
                    >
                      {getBoardBadge("QNA").text}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: "15px",
                        color: "#222",
                        fontWeight: "400",
                      }}
                    >
                      {q.title}
                    </span>

                    {/* ?곹깭 諭껋? */}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: isClosed ? "#4a7cf7" : "#999",
                        border: `1px solid ${isClosed ? "#4a7cf7" : "#ccc"}`,
                        borderRadius: "20px",
                        padding: "2px 9px",
                        marginRight: "12px",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
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

                    <span
                      style={{
                        fontSize: "13px",
                        color: "#999",
                        whiteSpace: "nowrap",
                      }}
                    >
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




