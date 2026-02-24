import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Camera,
  Heart,
  Eye,
  ChevronDown,
} from "lucide-react";
import ds, { cardStyle } from "../shared/designTokens";
import { Pill } from "../shared/Components";
import DATA from "../shared/data";

/* ── 공통 UI ── */
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
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}`}</style>
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
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn .15s ease",
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: 540,
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "slideUp .2s ease",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(30,30,40,0.12) transparent",
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
      <div style={{ padding: 28 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: ds.ink, margin: 0 }}>
          {title}
        </h3>
        <p
          style={{
            fontSize: 13.5,
            color: ds.ink3,
            marginTop: 10,
            lineHeight: 1.6,
          }}
        >
          {msg}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 22,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: `1px solid ${ds.line}`,
              background: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: ds.ff,
              color: ds.ink2,
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
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: ds.ink2,
          marginBottom: 6,
          display: "block",
        }}
      >
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
const iS = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: `1px solid ${ds.line}`,
  fontSize: 13.5,
  fontFamily: ds.ff,
  color: ds.ink,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .15s",
};
const focus = (e) => (e.target.style.borderColor = ds.brand);
const blur = (e) => (e.target.style.borderColor = ds.line);

/* ── 갤러리 카드 (스크린샷 스타일) ── */
function GalleryCard({ item, onClick, isParticipant }) {
  const gradients = [
    "linear-gradient(135deg, #667eea, #764ba2)",
    "linear-gradient(135deg, #f093fb, #f5576c)",
    "linear-gradient(135deg, #4facfe, #00f2fe)",
    "linear-gradient(135deg, #43e97b, #38f9d7)",
    "linear-gradient(135deg, #fa709a, #fee140)",
    "linear-gradient(135deg, #a18cd1, #fbc2eb)",
    "linear-gradient(135deg, #fccb90, #d57eeb)",
    "linear-gradient(135deg, #e0c3fc, #8ec5fc)",
  ];
  const idx = parseInt(item.id.replace(/\D/g, "")) % gradients.length;

  return (
    <div
      onClick={onClick}
      style={{
        ...cardStyle,
        cursor: "pointer",
        padding: 0,
        overflow: "hidden",
        transition: "transform .15s, box-shadow .15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = ds.sh2;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = ds.sh;
      }}
    >
      {/* 썸네일 */}
      <div
        style={{
          height: 180,
          background: gradients[idx],
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
        }}
      >
        {item.thumbnail}
        {/* 사진 수 뱃지 */}
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(0,0,0,0.55)",
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

      <div style={{ padding: "16px 18px 18px" }}>
        {/* 카테고리 태그 */}
        <div style={{ marginBottom: 10 }}>
          <Pill color={ds.brand} bg={ds.brandSoft}>
            {item.tab === "현장" ? "현장 스케치" : "참가자 후기"}
          </Pill>
        </div>

        {/* 제목 */}
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 800,
            color: ds.ink,
            marginBottom: 6,
            lineHeight: 1.35,
          }}
        >
          {item.title}
        </div>

        {/* 본문 미리보기 */}
        <p
          style={{
            fontSize: 12.5,
            color: ds.ink3,
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

        {/* 작성자 + 반려동물 정보 */}
        {isParticipant ? (
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
                background: `linear-gradient(135deg, ${ds.brandSoft}, ${ds.violetSoft})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: ds.brand,
              }}
            >
              {item.author[0]}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: ds.ink }}>
                {item.author}
              </div>
              {item.pet && (
                <div style={{ fontSize: 11, color: ds.ink4 }}>
                  🐾 {item.pet}
                </div>
              )}
            </div>
            <span style={{ marginLeft: "auto", fontSize: 11, color: ds.ink4 }}>
              {item.date}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12, color: ds.ink3, fontWeight: 600 }}>
              {item.author}
            </span>
            <span style={{ fontSize: 11, color: ds.ink4 }}>{item.date}</span>
          </div>
        )}

        {/* 해시태그 */}
        {item.tags?.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
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
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: ds.brandSoft,
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 하단: 좋아요 + 조회 */}
        {isParticipant && (
          <div
            style={{
              display: "flex",
              gap: 16,
              borderTop: `1px solid ${ds.lineSoft}`,
              paddingTop: 10,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: ds.ink4,
              }}
            >
              <Heart size={13} /> {item.likes}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: ds.ink4,
              }}
            >
              <Eye size={13} /> {item.views}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 폼 모달 ── */
function FormModal({ item, onSave, onClose, isEdit }) {
  const [form, setForm] = useState(
    item || {
      title: "",
      author: "",
      pet: "",
      tab: "참가자",
      date: "",
      photos: 1,
      content: "",
      tags: [],
      likes: 0,
      views: 0,
      status: "active",
      thumbnail: "🐕",
    },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const t = tagInput.trim().replace("#", "");
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
      setTagInput("");
    }
  };
  const removeTag = (t) =>
    set(
      "tags",
      form.tags.filter((x) => x !== t),
    );

  const save = () => {
    if (!form.title || !form.author) {
      setErr("제목과 작성자는 필수입니다.");
      return;
    }
    onSave(form);
  };

  const emojis = ["🐕", "🐶", "🐩", "🦮", "🐾", "📸", "🏟️", "🎤", "🏆", "🎪"];

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h3
            style={{ fontSize: 17, fontWeight: 800, color: ds.ink, margin: 0 }}
          >
            {isEdit ? "갤러리 수정" : "새 갤러리 등록"}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "none",
              background: ds.bg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} color={ds.ink3} />
          </button>
        </div>
        {err && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 12.5,
              color: "#DC2626",
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            {err}
          </div>
        )}

        <Field label="제목" required>
          <input
            style={iS}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            onFocus={focus}
            onBlur={blur}
            placeholder="갤러리 제목"
          />
        </Field>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field label="분류">
            <div style={{ position: "relative" }}>
              <select
                value={form.tab}
                onChange={(e) => set("tab", e.target.value)}
                style={{
                  ...iS,
                  appearance: "none",
                  paddingRight: 32,
                  cursor: "pointer",
                  background: "#fff",
                }}
              >
                <option value="참가자">참가자 갤러리</option>
                <option value="현장">현장 스케치</option>
              </select>
              <ChevronDown
                size={14}
                color={ds.ink4}
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
              min={1}
              style={iS}
              value={form.photos}
              onChange={(e) => set("photos", +e.target.value)}
              onFocus={focus}
              onBlur={blur}
            />
          </Field>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field label="작성자" required>
            <input
              style={iS}
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
              onFocus={focus}
              onBlur={blur}
              placeholder="작성자명"
            />
          </Field>
          <Field label="반려동물 정보">
            <input
              style={iS}
              value={form.pet}
              onChange={(e) => set("pet", e.target.value)}
              onFocus={focus}
              onBlur={blur}
              placeholder="예: 몽이 (말티즈 3살)"
            />
          </Field>
        </div>

        <Field label="썸네일 이모지">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {emojis.map((e) => (
              <button
                key={e}
                onClick={() => set("thumbnail", e)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  border:
                    form.thumbnail === e
                      ? `2px solid ${ds.brand}`
                      : `1px solid ${ds.line}`,
                  background: form.thumbnail === e ? ds.brandSoft : "#fff",
                  cursor: "pointer",
                  fontSize: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </Field>

        <Field label="내용">
          <textarea
            rows={3}
            style={{ ...iS, resize: "vertical" }}
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            onFocus={focus}
            onBlur={blur}
            placeholder="갤러리 내용"
          />
        </Field>

        <Field label="해시태그">
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...iS, flex: 1 }}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onFocus={focus}
              onBlur={blur}
              placeholder="#태그 입력 후 Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <button
              onClick={addTag}
              style={{
                padding: "0 14px",
                borderRadius: 8,
                border: "none",
                background: ds.brand,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: ds.ff,
              }}
            >
              추가
            </button>
          </div>
          {form.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 8,
              }}
            >
              {form.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11.5,
                    color: ds.brand,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: ds.brandSoft,
                  }}
                >
                  #{t}{" "}
                  <X
                    size={10}
                    style={{ cursor: "pointer" }}
                    onClick={() => removeTag(t)}
                  />
                </span>
              ))}
            </div>
          )}
        </Field>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: `1px solid ${ds.line}`,
              background: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: ds.ff,
              color: ds.ink2,
            }}
          >
            취소
          </button>
          <button
            onClick={save}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: "none",
              background: ds.brand,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            {isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ── 상세 모달 ── */
function DetailModal({ item, onClose, onEdit, onDelete }) {
  const isP = item.tab === "참가자";
  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: 0, overflow: "hidden" }}>
        {/* 썸네일 헤더 */}
        <div
          style={{
            height: 160,
            background: `linear-gradient(135deg, ${ds.brandSoft}, ${ds.violetSoft})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
            position: "relative",
          }}
        >
          {item.thumbnail}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "none",
              background: "rgba(0,0,0,0.3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} color="#fff" />
          </button>
          <span
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 12,
            }}
          >
            <Camera size={11} style={{ marginRight: 4 }} />
            {item.photos}장
          </span>
        </div>

        <div style={{ padding: "20px 28px 24px" }}>
          <Pill color={ds.brand} bg={ds.brandSoft}>
            {item.tab === "현장" ? "현장 스케치" : "참가자 후기"}
          </Pill>
          <h4
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: ds.ink,
              margin: "12px 0 8px",
            }}
          >
            {item.title}
          </h4>

          {/* 작성자 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              padding: "10px 0",
              borderBottom: `1px solid ${ds.lineSoft}`,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${ds.brandSoft}, ${ds.violetSoft})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 800,
                color: ds.brand,
              }}
            >
              {item.author[0]}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: ds.ink }}>
                {item.author}
              </div>
              {item.pet && (
                <div style={{ fontSize: 11.5, color: ds.ink4 }}>
                  🐾 {item.pet}
                </div>
              )}
            </div>
            <span style={{ marginLeft: "auto", fontSize: 12, color: ds.ink4 }}>
              {item.date}
            </span>
          </div>

          {/* 본문 */}
          <p
            style={{
              fontSize: 13.5,
              color: ds.ink2,
              lineHeight: 1.65,
              margin: "0 0 14px",
            }}
          >
            {item.content}
          </p>

          {/* 태그 */}
          {item.tags?.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 14,
              }}
            >
              {item.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 11.5,
                    color: ds.brand,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: ds.brandSoft,
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* 좋아요/조회 */}
          {isP && (
            <div
              style={{
                display: "flex",
                gap: 16,
                padding: "10px 0",
                borderTop: `1px solid ${ds.lineSoft}`,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 13,
                  color: ds.ink3,
                }}
              >
                <Heart size={14} /> {item.likes}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 13,
                  color: ds.ink3,
                }}
              >
                <Eye size={14} /> {item.views}
              </span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => {
                onClose();
                onDelete(item);
              }}
              style={{
                padding: "9px 18px",
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
              <Trash2 size={14} /> 삭제
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              style={{
                padding: "9px 18px",
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
              <Pencil size={14} /> 수정하기
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

/* ═══════════════════════════════════════════════ */
export default function Gallery() {
  const [items, setItems] = useState(() =>
    DATA.gallery.map((e) => ({ ...e, _visible: true })),
  );
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("전체");
  const show = (msg, type = "success") => setToast({ msg, type });

  const tabs = ["전체", "참가자", "현장"];
  const rows = items
    .filter((e) => e._visible)
    .filter((e) => tab === "전체" || e.tab === tab);

  const handleCreate = (f) => {
    const d = new Date();
    setItems((p) => [
      {
        ...f,
        id: `GL-${String(p.length + 1).padStart(3, "0")}`,
        date: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`,
        _visible: true,
      },
      ...p,
    ]);
    setModal(null);
    show("갤러리가 등록되었습니다.");
  };
  const handleUpdate = (f) => {
    setItems((p) => p.map((e) => (e.id === f.id ? { ...e, ...f } : e)));
    setModal(null);
    show("갤러리가 수정되었습니다.");
  };
  const handleDelete = () => {
    const id = modal.item.id;
    setModal(null);
    setItems((p) =>
      p.map((e) => (e.id === id ? { ...e, _visible: false } : e)),
    );
    show("갤러리가 삭제되었습니다.");
  };

  return (
    <div>
      {/* 상단: 탭 + 등록 버튼 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: `2px solid ${ds.lineSoft}`,
          }}
        >
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "10px 20px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 13.5,
                fontWeight: tab === t ? 700 : 500,
                fontFamily: ds.ff,
                color: tab === t ? ds.brand : ds.ink4,
                borderBottom:
                  tab === t ? `2px solid ${ds.brand}` : "2px solid transparent",
                marginBottom: -2,
                transition: "all .15s",
              }}
            >
              {t} (
              {
                items
                  .filter((e) => e._visible)
                  .filter((e) => t === "전체" || e.tab === t).length
              }
              )
            </button>
          ))}
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 18px",
            borderRadius: 9,
            border: "none",
            background: ds.brand,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: ds.ff,
            boxShadow: "0 2px 8px rgba(67,97,238,0.25)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(67,97,238,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(67,97,238,0.25)";
          }}
        >
          <Plus size={16} strokeWidth={2.5} /> 갤러리 등록
        </button>
      </div>

      {/* 카드 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {rows.map((g) => (
          <GalleryCard
            key={g.id}
            item={g}
            isParticipant={g.tab === "참가자"}
            onClick={() => setModal({ type: "detail", item: g })}
          />
        ))}
      </div>

      {rows.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: ds.ink4 }}>
          <Camera size={40} strokeWidth={1.2} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            등록된 갤러리가 없습니다
          </div>
        </div>
      )}

      {/* 모달 */}
      {modal?.type === "create" && (
        <FormModal onSave={handleCreate} onClose={() => setModal(null)} />
      )}
      {modal?.type === "edit" && (
        <FormModal
          item={modal.item}
          isEdit
          onSave={handleUpdate}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "detail" && (
        <DetailModal
          item={modal.item}
          onClose={() => setModal(null)}
          onEdit={(item) => setModal({ type: "edit", item })}
          onDelete={(item) => setModal({ type: "delete", item })}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title="갤러리 삭제"
          msg={`"${modal.item.title}" 갤러리를 삭제하시겠습니까?`}
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
