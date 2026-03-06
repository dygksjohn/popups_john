import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, Paperclip } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { postApi } from "../../../app/http/postApi";
import { postReplyApi } from "../../../app/http/replyApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { fileApi } from "../../../app/http/fileApi";
import CommunityDetailLayout from "./shared/CommunityDetailLayout";

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

const sectionStyle = {
  padding: "0 32px 32px",
};

const blockStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: "18px 20px",
  background: "#f8fafc",
};

export default function CommunityPostDetailPage({
  pageTitle,
  pageSubtitle,
  currentPath,
  badgeType,
}) {
  const navigate = useNavigate();
  const { postId } = useParams();
  const numericPostId = Number(postId);

  const [post, setPost] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyLoading, setReplyLoading] = useState(true);
  const [replyError, setReplyError] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const loadReplies = useCallback(async (id) => {
    setReplyLoading(true);
    setReplyError("");
    try {
      const res = await postReplyApi.list(id, 0, 100);
      const rows = Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : [];
      setReplies(rows);
    } catch (err) {
      console.error("[CommunityPostDetailPage] replies load failed:", err);
      setReplyError("댓글을 불러오지 못했습니다.");
      setReplies([]);
    } finally {
      setReplyLoading(false);
    }
  }, []);

  const loadAttachment = useCallback(async (id) => {
    setAttachment(null);
    setAttachmentError("");
    try {
      const data = await fileApi.getByPostId(id);
      if (data?.fileId) {
        setAttachment(data);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status !== 404) {
        console.error("[CommunityPostDetailPage] attachment load failed:", err);
        setAttachmentError("첨부파일 정보를 불러오지 못했습니다.");
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!Number.isFinite(numericPostId)) {
        setError("잘못된 게시글 경로입니다.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const detail = await postApi.get(numericPostId);
        if (!mounted) return;
        setPost(detail);
        await Promise.all([loadReplies(numericPostId), loadAttachment(numericPostId)]);
      } catch (err) {
        console.error("[CommunityPostDetailPage] detail load failed:", err);
        if (!mounted) return;
        setError(err?.response?.data?.message || "게시글을 불러오지 못했습니다.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [loadAttachment, loadReplies, numericPostId]);

  const submitReply = async () => {
    if (!post?.postId) return;
    if (!tokenStore.getAccess()) {
      navigate("/auth/login", { state: { from: `${currentPath}/${post.postId}` } });
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
      await postReplyApi.create(post.postId, content);
      setReplyText("");
      await loadReplies(post.postId);
    } catch (err) {
      console.error("[CommunityPostDetailPage] reply create failed:", err);
      setReplyError(err?.response?.data?.message || "댓글 등록에 실패했습니다.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const metaItems = useMemo(() => {
    if (!post) return [];
    return [
      { label: "작성일", value: fmtDate(post.createdAt) },
      { label: "조회수", value: post.viewCount ?? 0 },
      { label: "작성자", value: post.writerEmail || `user#${post.userId || "-"}` },
    ];
  }, [post]);

  if (loading) {
    return (
      <CommunityDetailLayout
        pageTitle={pageTitle}
        pageSubtitle={pageSubtitle}
        currentPath={currentPath}
        badgeType={badgeType}
        articleTitle="불러오는 중"
        metaItems={[]}
        content="<p>게시글을 불러오고 있습니다.</p>"
      />
    );
  }

  if (error || !post) {
    return (
      <CommunityDetailLayout
        pageTitle={pageTitle}
        pageSubtitle={pageSubtitle}
        currentPath={currentPath}
        badgeType={badgeType}
        articleTitle="게시글을 찾을 수 없습니다."
        metaItems={[]}
        content={`<p>${error || "게시글을 찾을 수 없습니다."}</p>`}
      />
    );
  }

  return (
    <CommunityDetailLayout
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      currentPath={currentPath}
      badgeType={badgeType}
      articleTitle={post.postTitle}
      metaItems={metaItems}
      content={post.content}
    >
      <section style={sectionStyle}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={blockStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
              <Paperclip size={16} />
              첨부파일
            </div>
            {attachment ? (
              <a
                href={fileApi.getDownloadUrl(attachment.fileId)}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#1d4ed8", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
              >
                {attachment.originalName || "첨부파일 다운로드"}
              </a>
            ) : (
              <div style={{ fontSize: 13, color: attachmentError ? "#dc2626" : "#94a3b8" }}>
                {attachmentError || "첨부파일이 없습니다."}
              </div>
            )}
          </div>

          <div style={blockStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
              <MessageCircle size={16} />
              댓글 {replies.length}
            </div>

            <div style={{ marginBottom: 14 }}>
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="댓글을 입력해 주세요."
                rows={4}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  padding: 12,
                  resize: "vertical",
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  type="button"
                  onClick={submitReply}
                  disabled={replySubmitting}
                  style={{
                    border: "none",
                    borderRadius: 10,
                    background: "#1d4ed8",
                    color: "#fff",
                    padding: "10px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: replySubmitting ? "not-allowed" : "pointer",
                    opacity: replySubmitting ? 0.6 : 1,
                  }}
                >
                  {replySubmitting ? "등록 중..." : "댓글 등록"}
                </button>
              </div>
              {replyError ? <div style={{ marginTop: 10, fontSize: 12, color: "#dc2626" }}>{replyError}</div> : null}
            </div>

            {replyLoading ? (
              <div style={{ fontSize: 13, color: "#94a3b8" }}>댓글을 불러오는 중입니다.</div>
            ) : replies.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8" }}>등록된 댓글이 없습니다.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {replies.map((reply) => (
                  <div key={reply.replyId} style={{ borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", padding: "14px 16px" }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                      {reply.writerEmail || `user#${reply.userId || "-"}`} · {fmtDate(reply.createdAt)}
                    </div>
                    <div style={{ fontSize: 14, color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                      {reply.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </CommunityDetailLayout>
  );
}
