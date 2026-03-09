import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import CommunityPagination from "./shared/CommunityPagination";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  MessageCircle,
  Plus,
  AlertTriangle,
  Paperclip,
} from "lucide-react";
import sortIcon from "../../../assets/sort-icon.svg";
import { postApi } from "../../../app/http/postApi";
import { postReplyApi } from "../../../app/http/replyApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { boardApi } from "../../../app/http/boardApi";
import { fileApi } from "../../../app/http/fileApi";
import { toPublicAssetUrl } from "../../../shared/utils/publicAssetUrl";
import { COMMUNITY_CATEGORIES, getBoardBadge } from "./communityConfig";
import CommunityRichTextEditor from "./shared/CommunityRichTextEditor";
import { hasMeaningfulCommunityContent } from "./shared/communityHtml";

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { key: "recent", label: "최신순" },
  { key: "views", label: "조회순" },
  { key: "comments", label: "댓글순" },
];

function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function toTimestamp(value) {
  const ts = Date.parse(String(value || ""));
  return Number.isFinite(ts) ? ts : 0;
}

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

function WriteModal({ onClose, onSave, saving, errorMessage }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      setLocalError("제목을 입력해 주세요.");
      return;
    }
    if (!hasMeaningfulCommunityContent(content)) {
      setLocalError("내용을 입력해 주세요.");
      return;
    }
    setLocalError("");
    onSave({
      title: title.trim(),
      content,
      file,
    });
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#222", margin: 0 }}>글쓰기</h3>
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

        {localError ? (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: "#DC2626",
              marginBottom: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={14} /> {localError}
          </div>
        ) : null}

        {errorMessage ? (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: "#DC2626",
              marginBottom: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={14} /> {errorMessage}
          </div>
        ) : null}

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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요"
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
          />
        </div>

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
            내용 <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <CommunityRichTextEditor
            value={content}
            onChange={setContent}
            placeholder="내용을 입력해 주세요. 이미지는 본문에 바로 삽입할 수 있습니다."
            height={280}
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
            첨부파일 (선택)
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{
              width: "100%",
              padding: "9px 10px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 13,
              color: "#334155",
              background: "#fff",
            }}
          />
          {file ? (
            <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>선택됨: {file.name}</div>
          ) : null}
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
            onClick={handleSubmit}
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
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
function DetailModal({
  item,
  loading,
  onClose,
  replies,
  replyLoading,
  replyError,
  replyText,
  onReplyTextChange,
  onReplySubmit,
  replySubmitting,
  attachment,
  attachmentLoading,
  attachmentError,
}) {
  if (!item) return null;

  const badge = getBoardBadge("FREEBOARD");

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
          maxWidth: 760,
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
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
            <span style={badge.style}>{badge.text}</span>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#1E293B",
                margin: "10px 0 0",
                lineHeight: 1.4,
              }}
            >
              {item.postTitle || "제목 없음"}
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

        <div
          style={{
            padding: "10px 28px 0",
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            fontSize: 13,
            color: "#94A3B8",
          }}
        >
          <span>작성일 {fmtDate(item.createdAt)}</span>
          <span>조회수 {item.viewCount ?? 0}</span>
          <span>댓글 {replies.length}</span>
        </div>

        <div style={{ margin: "16px 28px", borderBottom: "1px solid #E2E8F0" }} />

        <div style={{ padding: "0 28px 12px" }}>
          {loading ? (
            <div style={{ fontSize: 14, color: "#94A3B8" }}>상세 내용을 불러오는 중입니다.</div>
          ) : (
            <p
              style={{
                fontSize: 15,
                color: "#334155",
                lineHeight: 1.75,
                whiteSpace: "pre-wrap",
                margin: 0,
              }}
            >
              {item.content || "내용이 없습니다."}
            </p>
          )}
        </div>

        <div style={{ padding: "0 28px 14px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>첨부파일</div>
          {attachmentLoading ? (
        <div style={{ fontSize: 12, color: "#94A3B8" }}>첨부파일 정보를 불러오는 중입니다.</div>
          ) : attachment ? (
            <a
              href={toPublicAssetUrl(attachment.publicPath)}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#1D4ED8",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <Paperclip size={13} />
                {attachment.originalName || "첨부파일 다운로드"}
            </a>
          ) : (
            <div style={{ fontSize: 12, color: "#94A3B8" }}>첨부파일이 없습니다.</div>
          )}
          {attachmentError ? (
            <div style={{ marginTop: 6, fontSize: 12, color: "#B91C1C" }}>{attachmentError}</div>
          ) : null}
        </div>

        <div style={{ margin: "0 28px", borderBottom: "1px solid #E2E8F0" }} />

        <div style={{ padding: "16px 28px 24px" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "#1E293B" }}>
            댓글
          </h3>

          <div style={{ marginBottom: 12 }}>
            <textarea
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              placeholder="댓글을 입력해 주세요. (로그인 필요)"
              rows={3}
              style={{
                width: "100%",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                padding: 10,
                resize: "vertical",
                fontSize: 13,
                color: "#334155",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                type="button"
                onClick={onReplySubmit}
                disabled={replySubmitting}
                style={{
                  border: "none",
                  borderRadius: 8,
                  background: "#1D4ED8",
                  color: "#fff",
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: replySubmitting ? "not-allowed" : "pointer",
                  opacity: replySubmitting ? 0.6 : 1,
                }}
              >
              {replySubmitting ? "등록 중..." : "댓글 등록"}
              </button>
            </div>
            {replyError ? (
              <div style={{ marginTop: 8, fontSize: 12, color: "#B91C1C" }}>{replyError}</div>
            ) : null}
          </div>

          {replyLoading ? (
            <div style={{ fontSize: 13, color: "#94A3B8" }}>댓글을 불러오는 중입니다.</div>
          ) : replies.length === 0 ? (
            <div style={{ fontSize: 13, color: "#94A3B8" }}>댓글이 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {replies.map((reply) => (
                <div
                  key={reply.replyId}
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: "#F8FAFC",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>
                    {reply.writerEmail || `user#${reply.userId || "-"}`} · {fmtDate(reply.createdAt)}
                  </div>
                  <div style={{ fontSize: 13, color: "#334155", whiteSpace: "pre-wrap" }}>
                    {reply.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function FreeBoard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPath, setCurrentPath] = useState("/community/freeboard");
  const [sortKey, setSortKey] = useState("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const [allItems, setAllItems] = useState([]);
  const [commentCountMap, setCommentCountMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [freeBoardId, setFreeBoardId] = useState(null);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [writeSaving, setWriteSaving] = useState(false);
  const [writeError, setWriteError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = [];
      let pageIndex = 0;
      let finished = false;

      while (!finished && pageIndex < 20) {
        const d = await postApi.listByBoardType("FREE", {
          page: pageIndex,
          size: 50,
          sort: "createdAt,desc",
        });
        const content = Array.isArray(d?.content) ? d.content : [];
        rows.push(...content);
        const totalPages = Number(d?.totalPages) || 0;
        finished = Boolean(d?.last) || totalPages === 0 || pageIndex + 1 >= totalPages;
        pageIndex += 1;
      }

      setAllItems(rows);
      setPage(1);
    } catch (e) {
      console.error("[FreeBoard] list fetch failed:", e);
      setError("자유게시판 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    let mounted = true;
    boardApi
      .getBoards(true)
      .then((rows) => {
        if (!mounted) return;
        const matched = (Array.isArray(rows) ? rows : []).find(
          (row) => String(row?.boardType || "").toUpperCase() === "FREE",
        );
        setFreeBoardId(Number(matched?.boardId) || null);
      })
      .catch(() => {
        if (!mounted) return;
        setFreeBoardId(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loadCommentCounts = useCallback(async (rows) => {
    const targets = rows.filter((row) => commentCountMap[row.postId] == null);
    if (targets.length === 0) return;

    const pairs = await Promise.all(
      targets.map(async (row) => {
        try {
          const d = await postReplyApi.list(row.postId, 0, 1);
          const total = Number(d?.totalElements);
          const count = Number.isFinite(total)
            ? total
            : Array.isArray(d?.content)
              ? d.content.length
              : 0;
          return [row.postId, count];
        } catch {
          return [row.postId, 0];
        }
      }),
    );

    setCommentCountMap((prev) => {
      const next = { ...prev };
      pairs.forEach(([postId, count]) => {
        next[postId] = count;
      });
      return next;
    });
  }, [commentCountMap]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((item) => {
      const title = String(item?.postTitle || "").toLowerCase();
      const content = String(item?.content || "").toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }, [allItems, search]);

  const sortedItems = useMemo(() => {
    const rows = [...filteredItems];
    rows.sort((a, b) => {
      if (sortKey === "views") {
        const diff = (b?.viewCount ?? 0) - (a?.viewCount ?? 0);
        if (diff !== 0) return diff;
      } else if (sortKey === "comments") {
        const diff =
          (commentCountMap[b?.postId] ?? 0) - (commentCountMap[a?.postId] ?? 0);
        if (diff !== 0) return diff;
      }
      return toTimestamp(b?.createdAt) - toTimestamp(a?.createdAt);
    });
    return rows;
  }, [filteredItems, sortKey, commentCountMap]);

  const totalElements = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pagedItems = sortedItems.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search, sortKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (pagedItems.length > 0) {
      loadCommentCounts(pagedItems).catch(() => {});
    }
  }, [pagedItems, loadCommentCounts]);

  useEffect(() => {
    if (sortKey === "comments" && filteredItems.length > 0) {
      loadCommentCounts(filteredItems).catch(() => {});
    }
  }, [sortKey, filteredItems, loadCommentCounts]);

  const loadReplies = useCallback(async (postId) => {
    setReplyLoading(true);
    setReplyError("");
    try {
      const d = await postReplyApi.list(postId, 0, 200);
      const list = Array.isArray(d?.content) ? d.content : [];
      setReplies(list);
      setCommentCountMap((prev) => ({
        ...prev,
        [postId]: Number(d?.totalElements ?? list.length) || 0,
      }));
    } catch (err) {
      console.error("[FreeBoard] reply fetch failed:", err);
      setReplies([]);
      setReplyError("댓글을 불러오지 못했습니다.");
    } finally {
      setReplyLoading(false);
    }
  }, []);

  const loadAttachment = useCallback(async (postId) => {
    setAttachmentLoading(true);
    setAttachmentError("");
    try {
      const data = await fileApi.getByPostId(postId);
      setAttachment(data || null);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setAttachment(null);
        setAttachmentError("");
      } else {
        setAttachment(null);
      setAttachmentError("첨부파일을 불러오지 못했습니다.");
      }
    } finally {
      setAttachmentLoading(false);
    }
  }, []);

  const openDetail = useCallback(async (item) => {
    setSelected(item);
    setDetailLoading(true);
    setReplyText("");
    setReplyError("");
    setAttachment(null);
    setAttachmentError("");
    try {
      const detail = await postApi.get(item.postId);
      setSelected(detail);
      setAllItems((prev) =>
        prev.map((row) => (row.postId === detail.postId ? { ...row, ...detail } : row)),
      );
      await Promise.all([loadReplies(detail.postId), loadAttachment(detail.postId)]);
    } catch (err) {
      console.error("[FreeBoard] detail fetch failed:", err);
      setReplyError("상세 정보를 불러오지 못했습니다.");
    } finally {
      setDetailLoading(false);
    }
  }, [loadReplies, loadAttachment]);

  const closeDetail = () => {
    setSelected(null);
    setReplies([]);
    setReplyText("");
    setReplyError("");
    setAttachment(null);
    setAttachmentError("");
    setAttachmentLoading(false);
  };

  const submitReply = async () => {
    if (!selected?.postId) return;
    if (!tokenStore.getAccess()) {
      setReplyError("댓글 작성은 로그인이 필요합니다.");
      return;
    }
    const content = replyText.trim();
    if (!content) {
      setReplyError("댓글 내용을 입력해 주세요.");
      return;
    }

    setReplySubmitting(true);
    setReplyError("");
    try {
      await postReplyApi.create(selected.postId, content);
      setReplyText("");
      await loadReplies(selected.postId);
    } catch (err) {
      console.error("[FreeBoard] reply create failed:", err);
      setReplyError("댓글 등록에 실패했습니다.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const submitPost = async ({ title, content, file }) => {
    if (!tokenStore.getAccess()) {
      setWriteError("글쓰기는 로그인이 필요합니다.");
      return;
    }
    if (!freeBoardId) {
      setWriteError("게시판 정보를 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setWriteSaving(true);
    setWriteError("");
    try {
      const created = await postApi.create({
        boardId: freeBoardId,
        postTitle: title,
        content,
      });
      const createdPostId = Number(created?.postId);
      if (file && createdPostId) {
        await fileApi.upload(file, "POST", createdPostId);
      }
      setWriteModalOpen(false);
      await fetchAll();
    } catch (err) {
      console.error("[FreeBoard] create failed:", err);
      setWriteError(err?.response?.data?.error?.message || "글 등록에 실패했습니다.");
    } finally {
      setWriteSaving(false);
    }
  };

  const badge = getBoardBadge("FREEBOARD");
  const currentSortLabel =
    SORT_OPTIONS.find((option) => option.key === sortKey)?.label || "최신순";

  return (
    <>
      <PageHeader
        title="자유게시판"
        subtitle="자유롭게 의견을 나누는 커뮤니티 공간입니다."
        categories={COMMUNITY_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
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
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#222" }}>총 {totalElements}개</span>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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

            <button
              type="button"
              onClick={() => navigate("/community/freeboard/write")}
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
            <div style={{ marginTop: 12, fontSize: "14px", color: "#999" }}>목록을 불러오고 있습니다.</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "14px", color: "#999", marginBottom: 12 }}>{error}</div>
            <button
              onClick={fetchAll}
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
              {pagedItems.map((item) => (
                <div
                  key={item.postId}
                  onClick={() => navigate(`/community/freeboard/${item.postId}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "18px 6px",
                    borderBottom: "1px solid #e8e8e8",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    gap: 10,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ ...badge.style, marginRight: 2 }}>{badge.text}</span>
                  <span style={{ flex: 1, fontSize: "15px", color: "#222", fontWeight: 500 }}>
                    {item.postTitle}
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
                    {commentCountMap[item.postId] ?? 0}
                  </span>
                  <span style={{ fontSize: "12px", color: "#94A3B8", minWidth: 60, textAlign: "right" }}>
                    조회 {item.viewCount ?? 0}
                  </span>
                  <span style={{ fontSize: "13px", color: "#999", whiteSpace: "nowrap", minWidth: 94, textAlign: "right" }}>
                    {fmtDate(item.createdAt)}
                  </span>
                </div>
              ))}

              {pagedItems.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: "14px" }}>
                  {search.trim() ? "검색 결과가 없습니다." : "게시글이 없습니다."}
                </div>
              )}
            </div>

            <CommunityPagination
              currentPage={pageSafe}
              totalPages={totalPages}
              onChange={setPage}
            />
          </>
        )}
      </main>

      <DetailModal
        item={selected}
        loading={detailLoading}
        onClose={closeDetail}
        replies={replies}
        replyLoading={replyLoading}
        replyError={replyError}
        replyText={replyText}
        onReplyTextChange={setReplyText}
        onReplySubmit={submitReply}
        replySubmitting={replySubmitting}
        attachment={attachment}
        attachmentLoading={attachmentLoading}
        attachmentError={attachmentError}
      />

    </>
  );
}





