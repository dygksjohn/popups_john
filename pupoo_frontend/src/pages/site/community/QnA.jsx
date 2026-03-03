import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import {
  ChevronDown,
  Search,
  Plus,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  Lock,
} from "lucide-react";
import { qnaApi, unwrap } from "../../../api/qnaApi";
import { userApi } from "../../../app/http/userApi";
import { useAuth } from "../auth/AuthProvider";

const SERVICE_CATEGORIES = [
  { label: "자유게시판", path: "/community/freeboard" },
  { label: "공지사항", path: "/community/notice" },
  { label: "행사후기", path: "/community/review" },
  { label: "질문/답변", path: "/community/qna" },
];

const FILTER_OPTIONS = [
  { value: "ALL", label: "전체" },
  { value: "ANSWERED", label: "답변완료" },
  { value: "WAITING", label: "미답변" },
];

/* ── 날짜 포맷 ── */
function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/* ── 토스트 ── */
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
      {type === "success" ? "✓" : "✕"} {msg}
    </div>
  );
}

/* ── 오버레이 ── */
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

/* ── 삭제 확인 모달 ── */
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
            type="button"
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
            type="button"
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

/* ── 글쓰기/수정 모달 ── */
function WriteModal({ item, onSave, onClose, saving }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    title: item?.title || "",
    content: item?.content || "",
  });
  const [err, setErr] = useState("");

  const handleSave = () => {
    if (!form.title.trim()) {
      setErr("제목을 입력해주세요.");
      return;
    }
    if (!form.content.trim()) {
      setErr("내용을 입력해주세요.");
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
            type="button"
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
            placeholder="질문 제목을 입력하세요"
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
          <textarea
            rows={5}
            value={form.content}
            onChange={(e) =>
              setForm((p) => ({ ...p, content: e.target.value }))
            }
            placeholder="질문 내용을 입력하세요"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 14,
              color: "#222",
              outline: "none",
              boxSizing: "border-box",
              resize: "vertical",
              fontFamily: "'Noto Sans KR', sans-serif",
              lineHeight: 1.6,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#4a7cf7")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
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
            type="button"
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

/* ═══════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════ */
export default function QnAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAuthed } = useAuth();

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [openReplies, setOpenReplies] = useState({});

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 10;

  const [writeModal, setWriteModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [meUserId, setMeUserId] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const toggleReply = (id) => {
    setOpenReplies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (isAuthed) {
      userApi.getMe().then((me) => setMeUserId(me?.userId ?? null)).catch(() => setMeUserId(null));
    } else {
      setMeUserId(null);
    }
  }, [isAuthed]);

  /* ── 목록 조회 ── */
  const fetchList = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await qnaApi.list(p, PAGE_SIZE);
      const d = unwrap(res);
      setItems(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotalElements(d.totalElements ?? d.content?.length ?? 0);
      setPage(p);
    } catch (err) {
      console.error("[QnA] fetch error:", err);
      setError("질문 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(1);
  }, [fetchList]);

  /* ── 필터링 (백엔드 status: WAITING | ANSWERED) ── */
  const filtered = items.filter((q) => {
    const matchFilter = filter === "ALL" || q.status === filter;
    const matchSearch =
      !search || q.title?.includes(search) || q.content?.includes(search);
    return matchFilter && matchSearch;
  });

  /* ── 등록 ── */
  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const res = await qnaApi.create(form);
      setWriteModal(null);
      showToast("질문이 등록되었습니다.");
      fetchList(1);
    } catch (err) {
      console.error("[QnA] create error:", err);
      showToast("등록에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── 수정 ── */
  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      await qnaApi.update(writeModal.item.qnaId, form);
      setWriteModal(null);
      showToast("질문이 수정되었습니다.");
      fetchList(page);
    } catch (err) {
      console.error("[QnA] update error:", err);
      showToast("수정에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── 삭제 ── */
  const handleDelete = async () => {
    setSaving(true);
    try {
      await qnaApi.delete(deleteModal.qnaId);
      setDeleteModal(null);
      showToast("질문이 삭제되었습니다.");
      fetchList(page);
    } catch (err) {
      console.error("[QnA] delete error:", err);
      setDeleteModal(null);
      showToast("삭제에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── 마감 ── */
  const handleClose = async (qnaId) => {
    setSaving(true);
    try {
      await qnaApi.close(qnaId);
      setOpenReplies((prev) => ({ ...prev, [qnaId]: false }));
      showToast("질문이 마감되었습니다.");
      fetchList(page);
    } catch (err) {
      console.error("[QnA] close error:", err);
      showToast("마감에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="질문 답변"
        subtitle="서비스 이용과 관련된 문의사항을 등록하고 답변을 확인할 수 있습니다."
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
        {/* 상단 필터/검색 바 */}
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

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ position: "relative" }}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "7px 32px 7px 12px",
                  fontSize: "14px",
                  color: "#333",
                  background: "#fff",
                  cursor: "pointer",
                  outline: "none",
                  minWidth: "100px",
                }}
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                <ChevronDown size={14} color="#666" />
              </span>
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
                placeholder="검색어를 입력하세요."
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

            {/* 글쓰기 버튼 (로그인 시에만) */}
            {isAuthed && (
            <button
              type="button"
              onClick={() => setWriteModal({})}
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
              <Plus size={14} strokeWidth={2.5} /> 질문하기
            </button>
            )}
          </div>
        </div>

        {/* 로딩 */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Loader2
              size={28}
              color="#999"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span style={{ fontSize: 13, color: "#999" }}>불러오는 중...</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <AlertTriangle
              size={36}
              color="#F59E0B"
              style={{
                marginBottom: 12,
                display: "block",
                margin: "0 auto 12px",
              }}
            />
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#666",
                marginBottom: 8,
              }}
            >
              {error}
            </div>
            <button
              type="button"
              onClick={() => fetchList(page)}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                color: "#666",
              }}
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 목록 */}
        {!loading && !error && (
          <div>
            {filtered.map((q) => {
              const isAnswered = q.status === "ANSWERED";
              const statusLabel = isAnswered ? "답변완료" : "미답변";
              const isMine = meUserId != null && q.userId === meUserId;

              return (
                <div
                  key={q.qnaId}
                  style={{ borderBottom: "1px solid #e8e8e8" }}
                >
                  {/* 질문 행 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "18px 4px",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      gap: "0",
                    }}
                    onClick={() => toggleReply(q.qnaId)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f9f9f9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span
                      style={{
                        color: "#2d2d2d",
                        fontWeight: "600",
                        fontSize: "14px",
                        minWidth: "64px",
                      }}
                    >
                      pupoo
                    </span>
                    <span
                      style={{
                        color: "#565656",
                        fontWeight: "400",
                        fontSize: "14px",
                        minWidth: "80px",
                      }}
                    >
                      질문해요
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

                    {/* 상태 뱃지 */}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: isAnswered ? "#4a7cf7" : "#999",
                        border: `1px solid ${isAnswered ? "#4a7cf7" : "#ccc"}`,
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

                  {/* 상세 내용 (토글) */}
                  {openReplies[q.qnaId] && (
                    <div
                      style={{
                        padding: "16px 20px",
                        background: "#f7f9ff",
                        borderTop: "1px dashed #dde6ff",
                      }}
                    >
                      {/* 질문 내용 */}
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

                      {/* 운영자 답변 */}
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

                      {/* 수정/삭제/마감 버튼 (본인 글만) */}
                      {isMine && (
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
                          type="button"
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
                          type="button"
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("이 질문을 마감하시겠습니까? 마감 후 목록에서 숨겨집니다.")) {
                              handleClose(q.qnaId);
                            }
                          }}
                          disabled={saving}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "6px 14px",
                            borderRadius: 6,
                            border: "1px solid #94a3b8",
                            background: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: saving ? "not-allowed" : "pointer",
                            color: "#64748b",
                            fontFamily: "'Noto Sans KR', sans-serif",
                          }}
                        >
                          <Lock size={12} /> 마감
                        </button>
                      </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "#999",
                  fontSize: "14px",
                }}
              >
                {items.length === 0
                  ? "아직 질문이 없습니다. 첫 번째 질문을 등록해보세요!"
                  : "검색 결과가 없습니다."}
              </div>
            )}
          </div>
        )}

        {/* 페이지네이션 */}
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
              onClick={() => fetchList(page - 1)}
              disabled={page <= 1}
              style={{
                background: "none",
                border: "none",
                fontSize: "16px",
                color: page <= 1 ? "#ddd" : "#888",
                cursor: page <= 1 ? "default" : "pointer",
                padding: "4px 8px",
              }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => fetchList(i + 1)}
                style={{
                  fontSize: "14px",
                  fontWeight: i + 1 === page ? "700" : "500",
                  color: i + 1 === page ? "#4a7cf7" : "#333",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                  minWidth: "20px",
                  textAlign: "center",
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => fetchList(page + 1)}
              disabled={page >= totalPages}
              style={{
                background: "none",
                border: "none",
                fontSize: "16px",
                color: page >= totalPages ? "#ddd" : "#888",
                cursor: page >= totalPages ? "default" : "pointer",
                padding: "4px 8px",
              }}
            >
              ›
            </button>
          </div>
        )}
      </main>

      {/* ── 글쓰기/수정 모달 ── */}
      {writeModal && (
        <WriteModal
          item={writeModal.item}
          onSave={writeModal.item ? handleUpdate : handleCreate}
          onClose={() => setWriteModal(null)}
          saving={saving}
        />
      )}

      {/* ── 삭제 확인 모달 ── */}
      {deleteModal && (
        <ConfirmModal
          title="질문 삭제"
          loading={saving}
          msg={`"${deleteModal.title}" 을(를) 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* ── 토스트 ── */}
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
