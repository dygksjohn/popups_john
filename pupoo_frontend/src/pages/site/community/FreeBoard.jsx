import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { ChevronLeft, ChevronRight, Search, Loader2, X, Edit2, Trash2, MessageCircle, Pencil, Send } from "lucide-react";
import { boardApi } from "../../../app/http/boardApi";
import { postApi } from "../../../app/http/postApi";
import { postReplyApi } from "../../../app/http/replyApi";
import { userApi } from "../../../app/http/userApi";
import { useAuth } from "../auth/AuthProvider";

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

/* ── 상세보기 모달 (댓글 포함) ── */
function DetailModal({
  item,
  isMine,
  replies,
  replyLoading,
  meUserId,
  isAuthed,
  onClose,
  onEdit,
  onDelete,
  onCreateReply,
  onUpdateReply,
  onDeleteReply,
}) {
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyContent, setEditingReplyContent] = useState("");

  if (!item) return null;

  const replyList = Array.isArray(replies) ? replies : replies?.content ?? [];
  const activeReplies = replyList.filter((r) => r.status !== "DELETED");
  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !onCreateReply) return;
    setSubmittingReply(true);
    onCreateReply(replyText.trim(), () => {
      setReplyText("");
      setSubmittingReply(false);
    }).catch(() => setSubmittingReply(false));
  };

  const startEdit = (reply) => {
    setEditingReplyId(reply.replyId);
    setEditingReplyContent(reply.content ?? "");
  };
  const cancelEdit = () => {
    setEditingReplyId(null);
    setEditingReplyContent("");
  };
  const saveEdit = () => {
    if (editingReplyId == null || !onUpdateReply) return;
    onUpdateReply(editingReplyId, editingReplyContent.trim()).then(() => {
      setEditingReplyId(null);
      setEditingReplyContent("");
    });
  };

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
        <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, paddingRight: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", margin: 0, lineHeight: 1.4 }}>
              {item.postTitle}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isMine && (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    background: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#64748B",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Edit2 size={14} /> 수정
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid #FEE2E2",
                    background: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#DC2626",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Trash2 size={14} /> 삭제
                </button>
              </>
            )}
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
        </div>
        <div style={{ padding: "12px 28px 0", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>작성일 {fmtDate(item.createdAt)}</span>
          {item.updatedAt && item.updatedAt !== item.createdAt && (
            <span style={{ fontSize: 13, color: "#94A3B8" }}>수정일 {fmtDate(item.updatedAt)}</span>
          )}
          <span style={{ fontSize: 13, color: "#94A3B8" }}>조회 {item.viewCount ?? 0}</span>
        </div>
        <div style={{ margin: "16px 28px 0", borderBottom: "1px solid #E2E8F0" }} />
        <div style={{ padding: "20px 28px 16px" }}>
          {item.content ? (
            <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.75, whiteSpace: "pre-wrap", margin: 0 }}>
              {item.content}
            </p>
          ) : (
            <p style={{ fontSize: 14, color: "#CBD5E1", fontStyle: "italic", margin: 0 }}>내용이 없습니다.</p>
          )}
        </div>

        {/* 댓글 */}
        <div style={{ padding: "0 28px 24px", borderTop: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16, marginBottom: 12 }}>
            <MessageCircle size={18} color="#64748B" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>댓글 {activeReplies.length}개</span>
          </div>
          {replyLoading && (
            <div style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <Loader2 size={18} color="#94A3B8" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, color: "#94A3B8" }}>댓글 불러오는 중…</span>
            </div>
          )}
          {!replyLoading && activeReplies.length > 0 && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {activeReplies.map((r) => (
                <li key={r.replyId} style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                  {editingReplyId === r.replyId ? (
                    <div>
                      <textarea
                        value={editingReplyContent}
                        onChange={(e) => setEditingReplyContent(e.target.value)}
                        rows={2}
                        style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                      />
                      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                        <button type="button" onClick={saveEdit} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#1a4fd6", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>저장</button>
                        <button type="button" onClick={cancelEdit} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 13, cursor: "pointer", color: "#666" }}>취소</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: 14, color: "#334155", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{r.content}</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                        <span style={{ fontSize: 12, color: "#94A3B8" }}>{fmtDate(r.createdAt)}</span>
                        {meUserId != null && r.userId === meUserId && onUpdateReply && onDeleteReply && (
                          <span style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={() => startEdit(r)} style={{ padding: 0, border: "none", background: "none", fontSize: 12, color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}><Pencil size={12} /> 수정</button>
                            <button type="button" onClick={() => window.confirm("댓글을 삭제하시겠습니까?") && onDeleteReply(r.replyId)} style={{ padding: 0, border: "none", background: "none", fontSize: 12, color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}><Trash2 size={12} /> 삭제</button>
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isAuthed && onCreateReply && (
            <form onSubmit={handleSubmitReply} style={{ marginTop: 16 }}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="댓글을 입력하세요."
                rows={3}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
              />
              <button type="submit" disabled={submittingReply || !replyText.trim()} style={{ marginTop: 8, padding: "8px 16px", borderRadius: 8, border: "none", background: "#1a4fd6", color: "#fff", fontSize: 13, fontWeight: 600, cursor: submittingReply ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <Send size={14} /> {submittingReply ? "등록 중…" : "댓글 등록"}
              </button>
            </form>
          )}
        </div>

        <div style={{ padding: "0 28px 24px", display: "flex", justifyContent: "center" }}>
          <button
            type="button"
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
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            닫기
          </button>
        </div>
      </div>
    </>
  );
}

/* ── 글쓰기/수정 모달 ── */
function WriteModal({ boardId, initial, onClose, onSuccess }) {
  const [postTitle, setPostTitle] = useState(initial?.postTitle ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isEdit = !!initial?.postId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postTitle.trim()) {
      setError("제목을 입력하세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (isEdit) {
        await postApi.update(initial.postId, { postTitle: postTitle.trim(), content: content ?? "" });
      } else {
        await postApi.create({ boardId, postTitle: postTitle.trim(), content: content ?? "" });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? "저장에 실패했습니다.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
        }}
      />
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
          maxWidth: 560,
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #E2E8F0" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1E293B" }}>
            {isEdit ? "글 수정" : "글쓰기"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {error && (
            <div style={{ marginBottom: 12, padding: "10px 12px", background: "#FEE2E2", color: "#DC2626", borderRadius: 8, fontSize: 14 }}>
              {error}
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600, color: "#334155" }}>제목</label>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={255}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontSize: 15,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600, color: "#334155" }}>내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={10}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontSize: 15,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                background: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                color: "#64748B",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: "#1a4fd6",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "저장 중…" : isEdit ? "수정" : "등록"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function FreeBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAuthed } = useAuth();

  const [freeBoardId, setFreeBoardId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchType, setSearchType] = useState("TITLE_CONTENT");
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyLoading, setReplyLoading] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [meUserId, setMeUserId] = useState(null);

  const fetchBoards = useCallback(async () => {
    try {
      const list = await boardApi.getBoards(true);
      const free = Array.isArray(list) ? list.find((b) => b.boardType === "FREE") : null;
      setFreeBoardId(free?.boardId ?? null);
    } catch (err) {
      console.error("[FreeBoard] boards fetch error:", err);
      setError("게시판 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPosts = useCallback(async (p = 1, searchOverrides = {}) => {
    if (freeBoardId == null) return;
    const kw = searchOverrides.keyword !== undefined ? searchOverrides.keyword : keyword;
    const st = searchOverrides.searchType !== undefined ? searchOverrides.searchType : searchType;
    setLoading(true);
    setError(null);
    try {
      const data = await postApi.list(freeBoardId, {
        page: p - 1,
        size: PAGE_SIZE,
        searchType: kw?.trim() ? st : undefined,
        keyword: kw?.trim() || undefined,
      });
      setPosts(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
      setPage(p);
    } catch (err) {
      console.error("[FreeBoard] posts fetch error:", err);
      setError("게시글 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [freeBoardId, searchType, keyword]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    if (freeBoardId != null) fetchPosts(1);
  }, [freeBoardId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    const nextKeyword = searchInput.trim();
    setKeyword(nextKeyword);
    if (freeBoardId != null) fetchPosts(1, { keyword: nextKeyword, searchType });
  };

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) fetchPosts(p);
  };

  const openDetail = async (post) => {
    try {
      const detail = await postApi.get(post.postId);
      setSelectedPost(detail);
    } catch (err) {
      console.error("[FreeBoard] post detail error:", err);
    }
  };

  const handleEdit = (item) => {
    setSelectedPost(null);
    setEditPost(item);
    setShowWriteModal(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm("이 게시글을 삭제하시겠습니까?")) return;
    try {
      await postApi.delete(item.postId);
      setSelectedPost(null);
      fetchPosts(page);
    } catch (err) {
      console.error("[FreeBoard] delete error:", err);
      alert(err?.response?.data?.error?.message ?? "삭제에 실패했습니다.");
    }
  };

  const handleWriteSuccess = () => {
    setEditPost(null);
    setShowWriteModal(false);
    fetchPosts(1);
  };

  const loadReplies = useCallback((postId) => {
    if (postId == null) return;
    setReplyLoading(true);
    postReplyApi
      .list(postId, 0, 100)
      .then((data) => setReplies(data?.content ?? data ?? []))
      .catch(() => setReplies([]))
      .finally(() => setReplyLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPost?.postId) loadReplies(selectedPost.postId);
    else setReplies([]);
  }, [selectedPost?.postId, loadReplies]);

  const handleCreateReply = useCallback(
    (content, onDone) => {
      if (!selectedPost?.postId) return Promise.reject();
      return postReplyApi
        .create(selectedPost.postId, content)
        .then(() => loadReplies(selectedPost.postId))
        .then(() => { if (typeof onDone === "function") onDone(); })
        .catch((err) => {
          console.error("[FreeBoard] create reply error:", err);
          alert(err?.response?.data?.error?.message ?? "댓글 등록에 실패했습니다.");
          throw err;
        });
    },
    [selectedPost?.postId, loadReplies]
  );

  const handleUpdateReply = useCallback(
    (replyId, content) => {
      return postReplyApi.update(replyId, content).then(() => loadReplies(selectedPost?.postId));
    },
    [selectedPost?.postId, loadReplies]
  );

  const handleDeleteReply = useCallback(
    (replyId) => {
      return postReplyApi.delete(replyId).then(() => loadReplies(selectedPost?.postId));
    },
    [selectedPost?.postId, loadReplies]
  );

  useEffect(() => {
    if (isAuthed) {
      userApi
        .getMe()
        .then((me) => setMeUserId(me?.userId ?? null))
        .catch(() => setMeUserId(null));
    } else {
      setMeUserId(null);
    }
  }, [isAuthed]);

  return (
    <>
      <PageHeader
        title="자유게시판"
        subtitle="누구나 편하게 소통할 수 있는 게시판입니다"
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
            flexWrap: "wrap",
            gap: 12,
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
              >
                <Search size={16} strokeWidth={2} color="#555" />
              </button>
            </div>
            {isAuthed && freeBoardId != null && (
              <button
                type="button"
                onClick={() => { setEditPost(null); setShowWriteModal(true); }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#1a4fd6",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                글쓰기
              </button>
            )}
          </div>
        </div>

        {loading && freeBoardId == null && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
            <Loader2 size={28} color="#999" style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ marginTop: 12, fontSize: "14px", color: "#999" }}>게시판을 불러오는 중입니다.</div>
          </div>
        )}

        {!loading && freeBoardId == null && !error && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: "14px" }}>
            자유게시판이 없습니다.
          </div>
        )}

        {loading && freeBoardId != null && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
            <Loader2 size={28} color="#999" style={{ animation: "spin 1s linear infinite" }} />
            <div style={{ marginTop: 12, fontSize: "14px", color: "#999" }}>게시글 목록을 불러오는 중입니다.</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "14px", color: "#999", marginBottom: 12 }}>{error}</div>
            <button
              type="button"
              onClick={() => (freeBoardId != null ? fetchPosts(page) : fetchBoards())}
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

        {!loading && !error && freeBoardId != null && (
          <div>
            {posts.map((post) => (
              <div
                key={post.postId}
                onClick={() => openDetail(post)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "18px 4px",
                  borderBottom: "1px solid #e8e8e8",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  gap: 16,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ flex: 1, fontSize: "15px", color: "#222", fontWeight: "400" }}>
                  {post.postTitle}
                </span>
                <span style={{ fontSize: "13px", color: "#999", minWidth: 60 }}>
                  회원
                </span>
                <span style={{ fontSize: "13px", color: "#999", minWidth: 90 }}>
                  {fmtDate(post.createdAt)}
                </span>
                <span style={{ fontSize: "13px", color: "#999", minWidth: 44 }}>
                  {post.viewCount ?? 0}
                </span>
              </div>
            ))}
            {posts.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: "14px" }}>
                {keyword ? "검색 결과가 없습니다." : "등록된 게시글이 없습니다."}
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
              onClick={() => handlePageChange(page - 1)}
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
                onClick={() => handlePageChange(i + 1)}
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
              onClick={() => handlePageChange(page + 1)}
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

      {selectedPost && (
        <DetailModal
          item={selectedPost}
          isMine={meUserId != null && selectedPost.userId === meUserId}
          replies={replies}
          replyLoading={replyLoading}
          meUserId={meUserId}
          isAuthed={isAuthed}
          onClose={() => setSelectedPost(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreateReply={isAuthed ? handleCreateReply : undefined}
          onUpdateReply={handleUpdateReply}
          onDeleteReply={handleDeleteReply}
        />
      )}

      {showWriteModal && freeBoardId != null && (
        <WriteModal
          boardId={freeBoardId}
          initial={editPost}
          onClose={() => { setShowWriteModal(false); setEditPost(null); }}
          onSuccess={handleWriteSuccess}
        />
      )}
    </>
  );
}
