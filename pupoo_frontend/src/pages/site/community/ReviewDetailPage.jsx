import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { reviewApi } from "../../../app/http/reviewApi";
import { eventApi } from "../../../app/http/eventApi";
import { reviewReplyApi } from "../../../app/http/replyApi";
import { tokenStore } from "../../../app/http/tokenStore";
import CommunityDetailLayout from "./shared/CommunityDetailLayout";
import { normalizeEventTitle } from "../../../shared/utils/eventDisplay";

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function Stars({ value }) {
  return (
    <div style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={14}
          fill={index < value ? "#f59e0b" : "none"}
          color={index < value ? "#f59e0b" : "#cbd5e1"}
        />
      ))}
    </div>
  );
}

export default function ReviewDetailPage() {
  const navigate = useNavigate();
  const { reviewId } = useParams();
  const numericReviewId = Number(reviewId);

  const [review, setReview] = useState(null);
  const [eventName, setEventName] = useState("");
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
      const res = await reviewReplyApi.list(id, 0, 100);
      const rows = Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : [];
      setReplies(rows);
    } catch (err) {
      console.error("[ReviewDetailPage] replies load failed:", err);
      setReplyError("댓글을 불러오지 못했습니다.");
      setReplies([]);
    } finally {
      setReplyLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const detail = await reviewApi.get(numericReviewId);
        if (!mounted) return;
        setReview(detail);
        if (detail?.eventId) {
          try {
            const eventRes = await eventApi.getEventDetail(detail.eventId);
            if (mounted) {
              const eventDetail = eventRes?.data?.data || {};
              setEventName(normalizeEventTitle(eventDetail?.eventName || detail.eventName, eventDetail));
            }
          } catch {
            if (mounted) setEventName(detail.eventName || "");
          }
        }
        await loadReplies(numericReviewId);
      } catch (err) {
        console.error("[ReviewDetailPage] load failed:", err);
        if (mounted) setError(err?.response?.data?.message || "후기를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [loadReplies, numericReviewId]);

  const submitReply = async () => {
    if (!review?.reviewId) return;
    if (!tokenStore.getAccess()) {
      navigate("/auth/login", { state: { from: `/community/review/${review.reviewId}` } });
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
      await reviewReplyApi.create(review.reviewId, content);
      setReplyText("");
      await loadReplies(review.reviewId);
    } catch (err) {
      console.error("[ReviewDetailPage] reply create failed:", err);
      setReplyError(err?.response?.data?.message || "댓글 등록에 실패했습니다.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const metaItems = useMemo(() => {
    if (!review) return [];
    return [
      { label: "작성일", value: fmtDate(review.createdAt) },
      { label: "조회수", value: review.viewCount ?? 0 },
      { label: "행사명", value: eventName || review.eventName || "행사 정보 없음" },
    ];
  }, [eventName, review]);

  return (
    <CommunityDetailLayout
      pageTitle="행사후기"
      pageSubtitle="행사에 참여한 사용자의 실제 후기를 확인하세요"
      currentPath="/community/review"
      badgeType="REVIEW"
      articleTitle={loading ? "불러오는 중" : review?.reviewTitle || "행사 후기"}
      metaItems={metaItems}
      content={error ? `<p>${error}</p>` : review?.content || "<p>내용이 없습니다.</p>"}
      extraHead={!loading && review ? <div style={{ marginTop: 12 }}><Stars value={review.rating || 0} /></div> : null}
    >
      <section style={{ padding: "0 32px 32px" }}>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", background: "#f8fafc" }}>
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
      </section>
    </CommunityDetailLayout>
  );
}
