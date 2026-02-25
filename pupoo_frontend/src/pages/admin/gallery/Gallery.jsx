import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Camera,
  Heart,
  Eye,
  Search,
  ChevronDown,
  AlertTriangle,
  Check,
  Image,
} from "lucide-react";
import ds from "../shared/designTokens";
import { Pill } from "../shared/Components";
import { galleryApi } from "../../../app/http/galleryApi";
import { eventApi } from "../../../app/http/eventApi";

const styles = `
@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
.gal-card{transition:transform .15s,box-shadow .15s}
.gal-card:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,0.1)}
.gal-card:hover .gal-overlay{opacity:1}
`;

const GRADIENTS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
  "linear-gradient(135deg, #fa709a, #fee140)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #fccb90, #d57eeb)",
  "linear-gradient(135deg, #e0c3fc, #8ec5fc)",
];

/** API GalleryResponse → 카드/모달용 item */
function mapApiToItem(api) {
  const createdAt = api.createdAt
    ? new Date(api.createdAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .replace(/\. /g, ".")
        .trim()
    : "";
  return {
    id: api.galleryId,
    galleryId: api.galleryId,
    eventId: api.eventId,
    title: api.title,
    content: api.description ?? "",
    tab: "참가자",
    author: "운영팀",
    date: createdAt,
    photos: api.imageUrls?.length ?? 0,
    likes: 0,
    views: api.viewCount ?? 0,
    thumbnail: "📸",
    imageUrls: api.imageUrls ?? [],
    tags: [],
    _visible: true,
  };
}

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

/* ── 상세 모달 ── */
function DetailModal({ item, onClose, onEdit, onDelete }) {
  const isP = item.tab === "참가자";
  const idx = parseInt(item.id.replace(/\D/g, "")) % GRADIENTS.length;
  return (
    <Overlay onClose={onClose}>
      <div>
        {/* 썸네일 */}
        <div
          style={{
            height: 200,
            background: GRADIENTS[idx],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
            borderRadius: "16px 16px 0 0",
            position: "relative",
          }}
        >
          {item.thumbnail}
          <span
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 12,
            }}
          >
            1 / {item.photos}
          </span>
        </div>
        <div style={{ padding: "20px 28px 28px" }}>
          <Pill color={ds.brand} bg={`${ds.brand}10`}>
            {item.tab === "현장" ? "현장 스케치" : "참가자 후기"}
          </Pill>
          <h4
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: ds.ink,
              margin: "10px 0 6px",
            }}
          >
            {item.title}
          </h4>
          <p
            style={{
              fontSize: 13,
              color: "#64748B",
              lineHeight: 1.6,
              margin: "0 0 14px",
            }}
          >
            {item.content}
          </p>

          {isP && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                  }}
                >
                  {item.thumbnail}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ds.ink }}>
                    {item.author}
                  </div>
                  {item.petInfo && (
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>
                      {item.petInfo}
                    </div>
                  )}
                </div>
                <span
                  style={{ marginLeft: "auto", fontSize: 12, color: "#94A3B8" }}
                >
                  {item.date}
                </span>
              </div>
              {item.tags?.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 5,
                    marginBottom: 12,
                  }}
                >
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 11,
                        color: ds.brand,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 5,
                        background: `${ds.brand}08`,
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  padding: "10px 0",
                  borderTop: "1px solid #F1F5F9",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 13,
                    color: "#64748B",
                  }}
                >
                  <Heart size={14} color="#EF4444" /> {item.likes}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 13,
                    color: "#64748B",
                  }}
                >
                  <Eye size={14} color="#94A3B8" /> {item.views}
                </span>
              </div>
            </>
          )}

          {!isP && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12.5,
                color: "#94A3B8",
                marginBottom: 14,
                paddingTop: 8,
                borderTop: "1px solid #F1F5F9",
              }}
            >
              <span>{item.author || "운영팀"}</span>
              <span>{item.date}</span>
            </div>
          )}

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
      </div>
    </Overlay>
  );
}

/* ── 슬라이드 패널 ── */
function SlidePanel({ item, onSave, onClose, isEdit }) {
  const [form, setForm] = useState(
    item || {
      title: "",
      content: "",
      tab: "참가자",
      author: "",
      petInfo: "",
      photos: 3,
      thumbnail: "📸",
      tags: [],
      likes: 0,
      views: 0,
    },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");
  const [tagInput, setTagInput] = useState("");

  const handleSave = () => {
    if (!form.title) {
      setErr("제목은 필수입니다.");
      return;
    }
    onSave(form);
  };
  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      set("tags", [...form.tags, tagInput.trim()]);
      setTagInput("");
    }
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
              {isEdit ? "갤러리 수정" : "새 갤러리 등록"}
            </h3>
            <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "3px 0 0" }}>
              {isEdit ? "갤러리를 수정합니다" : "새 갤러리를 등록합니다"}
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
              placeholder="갤러리 제목"
            />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="분류">
              <div style={{ position: "relative" }}>
                <select
                  value={form.tab}
                  onChange={(e) => set("tab", e.target.value)}
                  style={{
                    ...inputStyle,
                    appearance: "none",
                    paddingRight: 32,
                    cursor: "pointer",
                  }}
                >
                  <option value="참가자">참가자 갤러리</option>
                  <option value="현장">현장 스케치</option>
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
            <Field label="사진 수">
              <input
                type="number"
                style={inputStyle}
                value={form.photos}
                onChange={(e) => set("photos", +e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </Field>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="작성자">
              <input
                style={inputStyle}
                value={form.author}
                onChange={(e) => set("author", e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="작성자 / 운영팀"
              />
            </Field>
            <Field label="반려동물 정보">
              <input
                style={inputStyle}
                value={form.petInfo || ""}
                onChange={(e) => set("petInfo", e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="몽이 (말티즈 3살)"
              />
            </Field>
          </div>
          <Field label="내용">
            <textarea
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
              value={form.content || ""}
              onChange={(e) => set("content", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="갤러리 설명"
            />
          </Field>
          <Field label="태그">
            <div style={{ display: "flex", gap: 6 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="#태그 입력 후 Enter"
              />
            </div>
            {form.tags?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                  marginTop: 8,
                }}
              >
                {form.tags.map((t) => (
                  <span
                    key={t}
                    onClick={() =>
                      set(
                        "tags",
                        form.tags.filter((x) => x !== t),
                      )
                    }
                    style={{
                      fontSize: 11,
                      color: ds.brand,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 5,
                      background: `${ds.brand}08`,
                      cursor: "pointer",
                    }}
                  >
                    #{t} ✕
                  </span>
                ))}
              </div>
            )}
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

/* ── 갤러리 카드 ── */
function GalleryCard({ item, onClick, onEdit, onDelete }) {
  const idx = parseInt(item.id.replace(/\D/g, "")) % GRADIENTS.length;
  const isP = item.tab === "참가자";

  return (
    <div
      className="gal-card"
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #F1F5F9",
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {/* 썸네일 */}
      <div
        style={{
          height: 170,
          background: GRADIENTS[idx],
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 44,
        }}
      >
        {item.thumbnail}
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            fontSize: 10.5,
            fontWeight: 700,
            padding: "2px 9px",
            borderRadius: 10,
          }}
        >
          1 / {item.photos}
        </span>

        {/* 호버 오버레이 */}
        <div
          className="gal-overlay"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            opacity: 0,
            transition: "opacity .15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(4px)",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
              fontFamily: ds.ff,
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
              padding: "6px 14px",
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.4)",
              background: "rgba(239,68,68,0.7)",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            삭제
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ padding: "14px 16px 16px" }}>
        <Pill color={ds.brand} bg={`${ds.brand}10`}>
          {item.tab === "현장" ? "현장 스케치" : "참가자 후기"}
        </Pill>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: ds.ink,
            margin: "8px 0 4px",
            lineHeight: 1.35,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </div>
        <p
          style={{
            fontSize: 12,
            color: "#94A3B8",
            lineHeight: 1.5,
            margin: "0 0 10px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.content}
        </p>

        {/* 참가자: 작성자 + 좋아요/조회 */}
        {isP ? (
          <>
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
                    borderRadius: "50%",
                    background: "#F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                  }}
                >
                  {item.thumbnail}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: ds.ink }}>
                  {item.author}
                </span>
              </div>
              <span style={{ fontSize: 11.5, color: "#94A3B8" }}>
                {item.date}
              </span>
            </div>
            {item.tags?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  marginBottom: 8,
                }}
              >
                {item.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 10.5,
                      color: ds.brand,
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: `${ds.brand}08`,
                    }}
                  >
                    #{t}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span style={{ fontSize: 10.5, color: "#94A3B8" }}>
                    +{item.tags.length - 3}
                  </span>
                )}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 12,
                paddingTop: 8,
                borderTop: "1px solid #F8FAFC",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "#94A3B8",
                }}
              >
                <Heart size={12} /> {item.likes}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "#94A3B8",
                }}
              >
                <Eye size={12} /> {item.views}
              </span>
            </div>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#94A3B8",
              paddingTop: 8,
              borderTop: "1px solid #F8FAFC",
            }}
          >
            <span>{item.author || "운영팀"}</span>
            <span>{item.date}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════ */
export default function Gallery() {
  const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [events, setEvents] = useState([]);
const [modal, setModal] = useState(null);
const [panel, setPanel] = useState(null);
const [toast, setToast] = useState(null);
const [tab, setTab] = useState("전체");
const [search, setSearch] = useState("");
const showToast = (msg, type = "success") => setToast({ msg, type });

const fetchGalleries = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await galleryApi.getList({ page: 0, size: 500 });
    const list = res.data?.content ?? res.data ?? [];
    setItems(list.map(mapApiToItem));
  } catch (e) {
    const msg = e?.response?.data?.message ?? e?.message ?? "갤러리 목록 조회 실패";
    setError(msg);
    setItems([]);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchGalleries();
}, []);

useEffect(() => {
  let cancelled = false;
  eventApi
    .getEvents({ page: 0, size: 200 })
    .then((res) => {
      if (cancelled) return;
      const list = res.data?.data?.content ?? res.data?.content ?? [];
      setEvents(Array.isArray(list) ? list : []);
    })
    .catch(() => {
      if (!cancelled) setEvents([]);
    });
  return () => { cancelled = true; };
}, []);

  const tabs = ["전체", "참가자", "현장"];
  const rows = items
    .filter((e) => e._visible)
    .filter((e) => tab === "전체" || e.tab === tab)
    .filter((e) => !search || e.title.includes(search));

    const handleCreate = async (f) => {
      if (f.eventId == null) {
        showToast("행사를 선택해 주세요.", "error");
        return;
      }
      try {
        const payload = {
          eventId: Number(f.eventId),
          title: (f.title || "").trim(),
          description: (f.content ?? f.description ?? "").trim() || null,
          imageUrls: f.imageUrls?.length ? f.imageUrls : [],
        };
        const res = await galleryApi.create(payload);
        const created = res.data?.data ?? res.data;
        if (created) setItems((p) => [mapApiToItem(created), ...p]);
        setPanel(null);
        showToast("갤러리가 등록되었습니다.");
      } catch (e) {
        const msg = e?.response?.data?.message ?? e?.message ?? "등록에 실패했습니다.";
        showToast(msg, "error");
      }
    };

  const handleUpdate = async (f) => {
  const galleryId = f.galleryId ?? f.id;
  if (galleryId == null) return;
  try {
    const payload = {
      title: (f.title || "").trim(),
      description: (f.content ?? f.description ?? "").trim() || null,
    };
    const res = await galleryApi.update(galleryId, payload);
    const updated = res.data?.data ?? res.data;
    if (updated) {
      setItems((p) =>
        p.map((e) => (e.galleryId === galleryId ? mapApiToItem(updated) : e))
      );
    }
    setPanel(null);
    showToast("갤러리가 수정되었습니다.");
  } catch (e) {
    const msg = e?.response?.data?.message ?? e?.message ?? "수정에 실패했습니다.";
    showToast(msg, "error");
  }
};
  const handleDelete = async () => {
  const galleryId = modal.item.galleryId ?? modal.item.id;
  setModal(null);
  if (galleryId == null) return;
  try {
    await galleryApi.delete(galleryId);
    setItems((p) => p.filter((e) => (e.galleryId ?? e.id) !== galleryId));
    showToast("갤러리가 삭제되었습니다.");
  } catch (e) {
    const msg = e?.response?.data?.message ?? e?.message ?? "삭제에 실패했습니다.";
    showToast(msg, "error");
  }
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
        {/* 헤더: 탭 + 검색 + 등록 */}
        <div
          style={{
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          {/* 탭 */}
          <div style={{ display: "flex", gap: 0 }}>
            {tabs.map((t) => {
              const cnt = items
                .filter((e) => e._visible)
                .filter((e) => t === "전체" || e.tab === t).length;
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: "14px 18px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    fontFamily: ds.ff,
                    color: active ? ds.brand : "#94A3B8",
                    borderBottom: active
                      ? `2px solid ${ds.brand}`
                      : "2px solid transparent",
                    transition: "all .15s",
                  }}
                >
                  {t} ({cnt})
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색"
                style={{
                  width: 160,
                  padding: "6px 12px 6px 30px",
                  borderRadius: 7,
                  border: "1px solid #E2E8F0",
                  fontSize: 12.5,
                  fontFamily: ds.ff,
                  color: ds.ink,
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = ds.brand)}
                onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
              />
              <Search
                size={13}
                color="#94A3B8"
                style={{
                  position: "absolute",
                  left: 10,
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
                padding: "6px 14px",
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
              <Plus size={13} strokeWidth={2.5} /> 등록
            </button>
          </div>
        </div>

        {/* 카드 그리드 */}
        <div
          style={{
            padding: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {rows.map((g) => (
            <GalleryCard
              key={g.id}
              item={g}
              onClick={() => setModal({ type: "detail", item: g })}
              onEdit={() => setPanel({ type: "edit", item: g })}
              onDelete={() => setModal({ type: "delete", item: g })}
            />
          ))}
        </div>

        {rows.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Camera size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#64748B",
                marginBottom: 4,
              }}
            >
              등록된 갤러리가 없습니다
            </div>
            <div style={{ fontSize: 12.5, color: "#94A3B8" }}>
              새 갤러리를 등록해보세요
            </div>
          </div>
        )}
      </div>

      {panel?.type === "create" && (
        <SlidePanel onSave={handleCreate} onClose={() => setPanel(null)} />
      )}
      {panel?.type === "edit" && (
        <SlidePanel
          item={panel.item}
          isEdit
          onSave={handleUpdate}
          onClose={() => setPanel(null)}
        />
      )}
      {modal?.type === "detail" && (
        <DetailModal
          item={modal.item}
          onClose={() => setModal(null)}
          onEdit={(item) => {
            setModal(null);
            setPanel({ type: "edit", item });
          }}
          onDelete={(item) => setModal({ type: "delete", item })}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title="갤러리 삭제"
          msg={`"${modal.item.title}" 갤러리를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
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
