import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Search,
  Star,
  Eye,
  ChevronDown,
  AlertTriangle,
  Check,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import ds from "../shared/designTokens";
import DATA from "../shared/data";

const styles = `
@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes rowFadeOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-30px)}}
.row-removing{animation:rowFadeOut .3s ease forwards}
.board-row:hover .board-actions{opacity:1}
`;

/* ── 게시판 설정 ── */
const BOARD_CONFIG = {
  free: {
    dataKey: "boards",
    title: "자유게시판",
    writeLabel: "글쓰기",
    emptyMsg: "게시글이 없습니다",
    emptySub: "새 글을 작성해보세요",
    toastCreate: "게시글이 등록되었습니다.",
    toastUpdate: "게시글이 수정되었습니다.",
    toastDelete: "게시글이 삭제되었습니다.",
    deleteTitle: "게시글 삭제",
    detailTitle: "게시글 상세",
    formTitle: (edit) => (edit ? "게시글 수정" : "새 게시글 작성"),
    formSub: (edit) =>
      edit ? "게시글을 수정합니다" : "새 게시글을 작성합니다",
  },
  review: {
    dataKey: "reviews",
    title: "행사후기",
    writeLabel: "후기 작성",
    emptyMsg: "행사후기가 없습니다",
    emptySub: "새 후기를 작성해보세요",
    toastCreate: "후기가 등록되었습니다.",
    toastUpdate: "후기가 수정되었습니다.",
    toastDelete: "후기가 삭제되었습니다.",
    deleteTitle: "후기 삭제",
    detailTitle: "행사후기 상세",
    formTitle: (edit) => (edit ? "후기 수정" : "새 후기 작성"),
    formSub: (edit) => (edit ? "후기를 수정합니다" : "새 후기를 작성합니다"),
  },
  qna: {
    dataKey: "qna",
    title: "질문·답변",
    writeLabel: "질문 등록",
    emptyMsg: "질문이 없습니다",
    emptySub: "궁금한 점을 질문해보세요",
    toastCreate: "질문이 등록되었습니다.",
    toastUpdate: "질문이 수정되었습니다.",
    toastDelete: "질문이 삭제되었습니다.",
    deleteTitle: "질문 삭제",
    detailTitle: "질문·답변 상세",
    formTitle: (edit) => (edit ? "질문 수정" : "새 질문 등록"),
    formSub: (edit) => (edit ? "질문을 수정합니다" : "새 질문을 등록합니다"),
  },
};

/* ── 공통 컴포넌트 ── */
function Toast({ msg, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  const bg =
    type === "success" ? "#10B981" : type === "error" ? "#EF4444" : "#F59E0B";
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
        fontFamily: ds.ff,
        boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
        animation: "toastIn .25s ease",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {type === "success" ? "✓" : "✕"} {msg}
    </div>
  );
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
        animation: "fadeIn .15s ease",
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
          animation: "slideUp .2s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
function ConfirmModal({ title, msg, onConfirm, onCancel }) {
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
            style={{ fontSize: 16, fontWeight: 800, color: ds.ink, margin: 0 }}
          >
            {title}
          </h3>
        </div>
        <p
          style={{
            fontSize: 13.5,
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
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: ds.ff,
              color: "#64748B",
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: "#EF4444",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ── 입력 필드 ── */
function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#64748B",
          marginBottom: 7,
          display: "block",
        }}
      >
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 9,
  border: "1.5px solid #E2E8F0",
  fontSize: 13.5,
  fontFamily: ds.ff,
  color: ds.ink,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .15s, box-shadow .15s",
  background: "#fff",
};
const inputFocus = (e) => {
  e.target.style.borderColor = ds.brand;
  e.target.style.boxShadow = `0 0 0 3px ${ds.brand}15`;
};
const inputBlur = (e) => {
  e.target.style.borderColor = "#E2E8F0";
  e.target.style.boxShadow = "none";
};

/* ── 별점 ── */
function StarRating({ value, onChange, readonly }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          fill={i <= value ? "#F59E0B" : "none"}
          color={i <= value ? "#F59E0B" : "#CBD5E1"}
          style={{ cursor: readonly ? "default" : "pointer" }}
          onClick={() => !readonly && onChange?.(i)}
        />
      ))}
    </div>
  );
}

/* ── 상태 필 ── */
function StatusPill({ status }) {
  const map = {
    답변완료: { bg: "#ECFDF5", color: "#059669", dot: "#10B981" },
    대기중: { bg: "#FFF7ED", color: "#D97706", dot: "#F59E0B" },
  };
  const s = map[status] || map["대기중"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 99,
        background: s.bg,
        color: s.color,
      }}
    >
      <span
        style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }}
      />
      {status}
    </span>
  );
}

/* ══════════════════════════════════════════════
   상세 모달 (+ 운영자 답변)
   ══════════════════════════════════════════════ */
function DetailModal({
  item,
  boardType,
  config,
  onClose,
  onEdit,
  onDelete,
  onReply,
}) {
  const isQna = boardType === "qna";
  const isReview = boardType === "review";
  const [replyText, setReplyText] = useState(item.answer || "");
  const [isReplying, setIsReplying] = useState(false);
  const hasReply = !!item.answer;

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    onReply(item, replyText.trim());
    setIsReplying(false);
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "28px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3
            style={{ fontSize: 16, fontWeight: 800, color: ds.ink, margin: 0 }}
          >
            {config.detailTitle}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: "none",
              background: "#F1F5F9",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} color="#94A3B8" />
          </button>
        </div>
        <div
          style={{
            background: "#F8FAFC",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {item.pinned && <Star size={14} color="#F59E0B" fill="#F59E0B" />}
            {isQna && (
              <StatusPill
                status={item.status || (hasReply ? "답변완료" : "대기중")}
              />
            )}
            <h4
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: ds.ink,
                margin: 0,
                flex: 1,
              }}
            >
              {item.title}
            </h4>
          </div>
          {[
            { l: "작성자", v: item.author },
            isReview && { l: "행사", v: item.event },
            isReview && {
              l: "평점",
              v: null,
              render: () => <StarRating value={item.rating} readonly />,
            },
            { l: "작성일", v: item.date },
            { l: "조회수", v: `${item.views}회` },
          ]
            .filter(Boolean)
            .map((r) => (
              <div
                key={r.l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 0",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                <span
                  style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}
                >
                  {r.l}
                </span>
                {r.render ? (
                  r.render()
                ) : (
                  <span
                    style={{ fontSize: 13, color: ds.ink, fontWeight: 600 }}
                  >
                    {r.v}
                  </span>
                )}
              </div>
            ))}
          {item.content && (
            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>
                내용
              </span>
              <p
                style={{
                  fontSize: 13,
                  color: "#475569",
                  lineHeight: 1.65,
                  marginTop: 6,
                }}
              >
                {item.content}
              </p>
            </div>
          )}
        </div>

        {/* ── 운영자 답변 영역 ── */}
        <div style={{ marginBottom: 20 }}>
          {/* 기존 답변 표시 */}
          {hasReply && !isReplying && (
            <div
              style={{
                padding: "14px 16px",
                background: "#EFF6FF",
                borderRadius: 10,
                borderLeft: `3px solid ${ds.brand}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: ds.brand,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MessageCircle size={11} color="#fff" />
                  </div>
                  <span
                    style={{ fontSize: 12.5, fontWeight: 700, color: ds.brand }}
                  >
                    운영자 답변
                  </span>
                  {item.answerDate && (
                    <span
                      style={{ fontSize: 11, color: "#94A3B8", marginLeft: 4 }}
                    >
                      {item.answerDate}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsReplying(true);
                    setReplyText(item.answer);
                  }}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 5,
                    border: `1px solid ${ds.brand}20`,
                    background: `${ds.brand}06`,
                    fontSize: 11,
                    fontWeight: 600,
                    color: ds.brand,
                    cursor: "pointer",
                    fontFamily: ds.ff,
                  }}
                >
                  수정
                </button>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "#475569",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {item.answer}
              </p>
            </div>
          )}

          {/* 답변 작성/수정 폼 */}
          {(isReplying || !hasReply) && (
            <div
              style={{
                border: `1.5px solid ${isReplying ? ds.brand : "#E2E8F0"}`,
                borderRadius: 10,
                overflow: "hidden",
                transition: "border-color .15s",
              }}
            >
              <div
                style={{
                  padding: "10px 14px 8px",
                  background: "#F8FAFC",
                  borderBottom: "1px solid #F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: ds.brand,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageCircle size={10} color="#fff" />
                </div>
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}
                >
                  {hasReply ? "답변 수정" : "운영자 답변 작성"}
                </span>
              </div>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답변을 입력하세요..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "none",
                  fontSize: 13,
                  fontFamily: ds.ff,
                  color: ds.ink,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  lineHeight: 1.6,
                  background: "#fff",
                }}
                onFocus={(e) =>
                  e.target.closest("div[style]") &&
                  (e.target.parentElement.parentElement.style.borderColor =
                    ds.brand)
                }
              />
              <div
                style={{
                  padding: "8px 12px",
                  background: "#F8FAFC",
                  borderTop: "1px solid #F1F5F9",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 6,
                }}
              >
                {isReplying && (
                  <button
                    onClick={() => {
                      setIsReplying(false);
                      setReplyText(item.answer || "");
                    }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 6,
                      border: "1px solid #E2E8F0",
                      background: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: ds.ff,
                      color: "#64748B",
                    }}
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={handleSubmitReply}
                  disabled={!replyText.trim()}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: replyText.trim() ? ds.brand : "#CBD5E1",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: replyText.trim() ? "pointer" : "default",
                    fontFamily: ds.ff,
                    transition: "background .15s",
                  }}
                >
                  {hasReply ? "답변 수정" : "답변 등록"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={() => {
              onClose();
              onDelete(item);
            }}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid #FECACA",
              background: "#FEF2F2",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: ds.ff,
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Trash2 size={13} /> 삭제
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "none",
              background: ds.brand,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Pencil size={13} /> 수정하기
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ══════════════════════════════════════════════
   슬라이드 패널
   ══════════════════════════════════════════════ */
function SlidePanel({ item, boardType, config, onSave, onClose, isEdit }) {
  const defaults = {
    free: { title: "", author: "", content: "", pinned: false, views: 0 },
    review: {
      title: "",
      author: "",
      content: "",
      event: "",
      rating: 5,
      views: 0,
    },
    qna: {
      title: "",
      author: "",
      content: "",
      status: "대기중",
      answer: "",
      views: 0,
    },
  };
  const [form, setForm] = useState(item || defaults[boardType]);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");

  const handleSave = () => {
    if (!form.title || !form.author) {
      setErr("제목과 작성자는 필수입니다.");
      return;
    }
    onSave(form);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 4999,
          background: "rgba(0,0,0,0.15)",
          animation: "fadeIn .15s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 5000,
          width: 440,
          background: "#fff",
          boxShadow: "-4px 0 30px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          animation: "slideIn .25s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: ds.ink,
                margin: 0,
              }}
            >
              {config.formTitle(isEdit)}
            </h3>
            <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "3px 0 0" }}>
              {config.formSub(isEdit)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} color="#94A3B8" />
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {err && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 9,
                padding: "10px 14px",
                fontSize: 12.5,
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

          <Field label="제목" required>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="제목을 입력하세요"
            />
          </Field>
          <Field label="작성자" required>
            <input
              style={inputStyle}
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="작성자 이름"
            />
          </Field>

          {boardType === "free" && (
            <Field label="고정 글">
              <div
                onClick={() => set("pinned", !form.pinned)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: form.pinned ? "none" : "1.8px solid #CBD5E1",
                    background: form.pinned ? ds.brand : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all .15s",
                  }}
                >
                  {form.pinned && (
                    <Check size={12} color="#fff" strokeWidth={3} />
                  )}
                </div>
                <span style={{ fontSize: 13, color: "#475569" }}>
                  상단 고정
                </span>
              </div>
            </Field>
          )}

          {boardType === "review" && (
            <>
              <Field label="행사명">
                <input
                  style={inputStyle}
                  value={form.event || ""}
                  onChange={(e) => set("event", e.target.value)}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  placeholder="행사 이름"
                />
              </Field>
              <Field label="평점">
                <StarRating
                  value={form.rating || 5}
                  onChange={(v) => set("rating", v)}
                />
              </Field>
            </>
          )}

          {boardType === "qna" && (
            <>
              <Field label="답변 상태">
                <div style={{ position: "relative" }}>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      paddingRight: 32,
                      cursor: "pointer",
                    }}
                  >
                    <option value="대기중">대기중</option>
                    <option value="답변완료">답변완료</option>
                  </select>
                  <ChevronDown
                    size={14}
                    color="#94A3B8"
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </Field>
              <Field label="답변 내용">
                <textarea
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                  value={form.answer || ""}
                  onChange={(e) => set("answer", e.target.value)}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  placeholder="답변을 작성하세요"
                />
              </Field>
            </>
          )}

          <Field label="내용">
            <textarea
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
              value={form.content || ""}
              onChange={(e) => set("content", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="내용을 입력하세요"
            />
          </Field>
        </div>
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #F1F5F9",
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 9,
              border: "1px solid #E2E8F0",
              background: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: ds.ff,
              color: "#64748B",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 9,
              border: "none",
              background: ds.brand,
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            {isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   게시판 행
   ══════════════════════════════════════════════ */
function BoardRow({ item, boardType, removing, onDetail, onEdit, onDelete }) {
  const isQna = boardType === "qna";
  const isReview = boardType === "review";

  return (
    <div
      className={`board-row ${removing ? "row-removing" : ""}`}
      onClick={onDetail}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "13px 20px",
        borderBottom: "1px solid #F8FAFC",
        cursor: "pointer",
        transition: "background .1s",
        position: "relative",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: ds.ink,
          minWidth: 72,
          flexShrink: 0,
        }}
      >
        {item.author}
      </span>

      {boardType === "free" && item.pinned && (
        <Star
          size={12}
          color="#F59E0B"
          fill="#F59E0B"
          style={{ marginRight: 6, flexShrink: 0 }}
        />
      )}
      {isQna && (
        <span style={{ marginRight: 8, flexShrink: 0 }}>
          <StatusPill status={item.status} />
        </span>
      )}

      <span
        style={{
          flex: 1,
          fontSize: 13.5,
          color: "#475569",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {item.title}
        {item.answer && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10.5,
              color: ds.brand,
              fontWeight: 700,
              background: `${ds.brand}08`,
              padding: "1px 7px",
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            <MessageCircle size={9} /> 답변완료
          </span>
        )}
      </span>

      {isReview && item.event && (
        <span
          style={{
            fontSize: 11,
            color: "#94A3B8",
            background: "#F1F5F9",
            padding: "2px 8px",
            borderRadius: 4,
            marginRight: 10,
            flexShrink: 0,
            maxWidth: 140,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.event}
        </span>
      )}

      {isReview && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            marginRight: 10,
            flexShrink: 0,
          }}
        >
          <Star size={11} color="#F59E0B" fill="#F59E0B" />
          <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 700 }}>
            {item.rating}
          </span>
        </span>
      )}

      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: "#94A3B8",
          marginRight: 16,
          flexShrink: 0,
          minWidth: 50,
        }}
      >
        <Eye size={12} style={{ flexShrink: 0 }} />
        {item.views}
      </span>

      <span
        style={{
          fontSize: 13,
          color: "#94A3B8",
          flexShrink: 0,
          minWidth: 80,
          textAlign: "right",
        }}
      >
        {item.date}
      </span>

      <div
        className="board-actions"
        style={{
          opacity: 0,
          transition: "opacity .12s",
          display: "flex",
          gap: 3,
          marginLeft: 10,
          flexShrink: 0,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={{
            padding: "3px 8px",
            borderRadius: 5,
            border: `1px solid ${ds.brand}25`,
            background: `${ds.brand}06`,
            fontSize: 11,
            fontWeight: 600,
            color: ds.brand,
            cursor: "pointer",
            fontFamily: ds.ff,
            lineHeight: 1.2,
            transition: "all .12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${ds.brand}12`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${ds.brand}06`;
          }}
        >
          수정
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: "3px 8px",
            borderRadius: 5,
            border: "1px solid #FECACA50",
            background: "transparent",
            fontSize: 11,
            fontWeight: 600,
            color: "#EF4444",
            cursor: "pointer",
            fontFamily: ds.ff,
            lineHeight: 1.2,
            opacity: 0.7,
            transition: "all .12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#FEF2F2";
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.opacity = "0.7";
          }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════ */
export default function BoardManage({ subTab = "free" }) {
  const boardType = subTab || "free";
  const config = BOARD_CONFIG[boardType] || BOARD_CONFIG.free;

  const [allData, setAllData] = useState(() => ({
    free: (DATA.boards || []).map((e) => ({ ...e, _visible: true })),
    review: (DATA.reviews || []).map((e) => ({ ...e, _visible: true })),
    qna: (DATA.qna || []).map((e) => ({ ...e, _visible: true })),
  }));
  const [modal, setModal] = useState(null);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
    setModal(null);
    setPanel(null);
  }, [boardType]);

  const items = allData[boardType] || [];
  const rows = items
    .filter((e) => e._visible)
    .filter(
      (e) => !search || e.title.includes(search) || e.author.includes(search),
    );
  const showToast = (msg, type = "success") => setToast({ msg, type });

  const setBoard = (fn) =>
    setAllData((prev) => ({ ...prev, [boardType]: fn(prev[boardType]) }));

  const handleCreate = (f) => {
    const d = new Date();
    const newItem = {
      ...f,
      id: Math.max(0, ...items.map((x) => x.id)) + 1,
      date: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`,
      views: 0,
      _visible: true,
    };
    setBoard((p) => [newItem, ...p]);
    setPanel(null);
    showToast(config.toastCreate);
  };

  const handleUpdate = (f) => {
    setBoard((p) => p.map((e) => (e.id === f.id ? { ...e, ...f } : e)));
    setPanel(null);
    showToast(config.toastUpdate);
  };

  const handleReply = (item, replyText) => {
    const d = new Date();
    const answerDate = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    const updated = {
      ...item,
      answer: replyText,
      answerDate,
      ...(boardType === "qna" ? { status: "답변완료" } : {}),
    };
    setBoard((p) =>
      p.map((e) => (e.id === item.id ? { ...e, ...updated } : e)),
    );
    setModal({ type: "detail", item: { ...updated, _visible: true } });
    showToast("답변이 등록되었습니다.");
  };

  const handleDelete = () => {
    const id = modal.item.id;
    setModal(null);
    setRemoving(id);
    setTimeout(() => {
      setBoard((p) =>
        p.map((e) => (e.id === id ? { ...e, _visible: false } : e)),
      );
      setRemoving(null);
      showToast(config.toastDelete);
    }, 300);
  };

  return (
    <div>
      <style>{styles}</style>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #F1F5F9",
          overflow: "hidden",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: ds.ink }}>
              {config.title}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>
              총 {rows.length}개
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색어를 입력하세요."
                style={{
                  width: 220,
                  padding: "7px 14px 7px 34px",
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  fontSize: 13,
                  fontFamily: ds.ff,
                  color: ds.ink,
                  outline: "none",
                  transition: "border-color .15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = ds.brand)}
                onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
              />
              <Search
                size={14}
                color="#94A3B8"
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            </div>
            <button
              onClick={() => setPanel({ type: "create" })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 14px",
                borderRadius: 7,
                border: "none",
                background: ds.brand,
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: ds.ff,
                transition: "transform .1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-1px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <Plus size={13} strokeWidth={2.5} /> {config.writeLabel}
            </button>
          </div>
        </div>

        {/* 리스트 */}
        {rows.map((r) => (
          <BoardRow
            key={r.id}
            item={r}
            boardType={boardType}
            removing={removing === r.id}
            onDetail={() => setModal({ type: "detail", item: r })}
            onEdit={() => setPanel({ type: "edit", item: r })}
            onDelete={() => setModal({ type: "delete", item: r })}
          />
        ))}

        {rows.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            {boardType === "qna" ? (
              <HelpCircle
                size={36}
                color="#CBD5E1"
                style={{ marginBottom: 12 }}
              />
            ) : (
              <Search size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
            )}
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#64748B",
                marginBottom: 4,
              }}
            >
              {config.emptyMsg}
            </div>
            <div style={{ fontSize: 12.5, color: "#94A3B8" }}>
              {config.emptySub}
            </div>
          </div>
        )}
      </div>

      {panel?.type === "create" && (
        <SlidePanel
          boardType={boardType}
          config={config}
          onSave={handleCreate}
          onClose={() => setPanel(null)}
        />
      )}
      {panel?.type === "edit" && (
        <SlidePanel
          item={panel.item}
          boardType={boardType}
          config={config}
          isEdit
          onSave={handleUpdate}
          onClose={() => setPanel(null)}
        />
      )}
      {modal?.type === "detail" && (
        <DetailModal
          item={modal.item}
          boardType={boardType}
          config={config}
          onClose={() => setModal(null)}
          onEdit={(item) => {
            setModal(null);
            setPanel({ type: "edit", item });
          }}
          onDelete={(item) => setModal({ type: "delete", item })}
          onReply={handleReply}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title={config.deleteTitle}
          msg={`"${modal.item.title}" 을(를) 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
