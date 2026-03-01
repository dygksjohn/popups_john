import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  ChevronLeft,
  Trophy,
  Users,
  Clock,
  Check,
  CalendarDays,
  ImagePlus,
  BarChart3,
  Heart,
  Award,
  Crown,
  ChevronRight,
  Dog,
  Camera,
  Star,
  Medal,
  AlertCircle,
  Info,
} from "lucide-react";
import ds from "../shared/designTokens";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { getToken } from "../../../api/noticeApi";

/* ═══════════════════════════════════════════
   Styles
═══════════════════════════════════════════ */
const styles = `
@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulseGlow{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes cardIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
`;

/* ═══ 공통 ═══ */
const authHeaders = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};
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
  background: "#fff",
};
const inputFocus = (e) => {
  e.target.style.borderColor = "#8B5CF6";
};
const inputBlur = (e) => {
  e.target.style.borderColor = "#E2E8F0";
};
const calcStatus = (s, e) => {
  if (!s && !e) return "pending";
  const n = new Date();
  const start = s
    ? new Date(s.includes("T") ? s : s + "T00:00:00+09:00")
    : null;
  const end = e ? new Date(e.includes("T") ? e : e + "T23:59:59+09:00") : null;
  if (end && n > end) return "ended";
  if (start && n < start) return "pending";
  return "active";
};

function Toast({ msg, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        background: type === "success" ? "#10B981" : "#EF4444",
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
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9998,
        animation: "fadeIn .2s ease",
        padding: 20,
      }}
    >
      {children}
    </div>
  );
}
function ConfirmModal({ title, msg, onConfirm, onCancel }) {
  return (
    <Overlay onClose={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          width: 380,
          maxWidth: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          animation: "slideUp .25s ease",
        }}
      >
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: ds.ink,
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: "#64748B",
            lineHeight: 1.6,
            marginBottom: 22,
          }}
        >
          {msg}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: "1.5px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#64748B",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: "none",
              background: "#EF4444",
              color: "#fff",
              fontSize: 13.5,
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
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: "#475569",
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
      </div>
      {children}
    </div>
  );
}
const contestBadge = (status) => {
  const m = {
    pending: { l: "투표 예정", c: "#6B7280", bg: "#F3F4F6", dot: false },
    active: { l: "투표 진행 중", c: "#8B5CF6", bg: "#F3E8FF", dot: true },
    ended: { l: "투표 종료", c: "#94A3B8", bg: "#F1F5F9", dot: false },
  };
  return m[status] || m.pending;
};
const ICON_POOL = [
  { emoji: "🏆", bg: "#FFFBEB" },
  { emoji: "🎨", bg: "#EEF2FF" },
  { emoji: "🐾", bg: "#FDF2F8" },
  { emoji: "🎭", bg: "#F5F3FF" },
  { emoji: "⭐", bg: "#FEF3C7" },
  { emoji: "🎪", bg: "#ECFDF5" },
  { emoji: "🏅", bg: "#FFF7ED" },
  { emoji: "👑", bg: "#FFFBEB" },
];

/* ═══ Mock 참가자 (DB 연동 전) ═══ */
const MOCK_PARTICIPANTS = [
  {
    id: 1,
    petName: "별이",
    breedDetail: "포메라니안",
    imageUrl:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
    votes: 184,
    status: "APPROVED",
  },
  {
    id: 2,
    petName: "보리",
    breedDetail: "시바견",
    imageUrl:
      "https://images.unsplash.com/photo-1583337130417-13571f57e3d9?w=400&h=400&fit=crop",
    votes: 147,
    status: "APPROVED",
  },
  {
    id: 3,
    petName: "하루",
    breedDetail: "말티즈",
    imageUrl:
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=400&fit=crop",
    votes: 98,
    status: "APPROVED",
  },
  {
    id: 4,
    petName: "코코",
    breedDetail: "푸들",
    imageUrl:
      "https://images.unsplash.com/photo-1616567214565-ef020940b8e8?w=400&h=400&fit=crop",
    votes: 53,
    status: "APPROVED",
  },
  {
    id: 5,
    petName: "두부",
    breedDetail: "비숑 프리제",
    imageUrl:
      "https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=400&h=400&fit=crop",
    votes: 30,
    status: "APPLIED",
  },
];
const RANK_COLORS = ["#F59E0B", "#94A3B8", "#CD7F32", "#94A3B8"];
const CARD_COLORS = [
  "#8B5CF6",
  "#A78BFA",
  "#C4B5FD",
  "#7C3AED",
  "#6D28D9",
  "#DDD6FE",
];

/* ═══ 콘테스트 생성/수정 모달 ═══ */
function ContestFormModal({ item, onSave, onClose, isEdit }) {
  const [form, setForm] = useState(
    item
      ? {
          ...item,
          startAt: item.startAt?.split("T")[0] || "",
          endAt: item.endAt?.split("T")[0] || "",
        }
      : { name: "", description: "", startAt: "", endAt: "" },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");
  const [visible, setVisible] = useState(false);
  const [imagePreview, setImagePreview] = useState(item?.imageUrl || null);
  const fileInputRef = useRef(null);
  const handleImageFile = (file) => {
    if (
      !file ||
      !file.type.startsWith("image/") ||
      file.size > 10 * 1024 * 1024
    )
      return;
    const r = new FileReader();
    r.onload = (e) => setImagePreview(e.target.result);
    r.readAsDataURL(file);
  };
  const handleSave = () => {
    if (!form.name) {
      setErr("콘테스트명은 필수입니다.");
      return;
    }
    onSave({ ...form, imageUrl: imagePreview });
  };
  const autoStatus =
    form.startAt || form.endAt
      ? (() => {
          const s = calcStatus(form.startAt, form.endAt);
          const map = {
            pending: { l: "투표 예정", c: "#6B7280", bg: "#F3F4F6" },
            active: { l: "투표 진행 중", c: "#8B5CF6", bg: "#F3E8FF" },
            ended: { l: "투표 종료", c: "#94A3B8", bg: "#F1F5F9" },
          };
          return map[s];
        })()
      : null;
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);
  return (
    <Overlay onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 18,
          width: 440,
          maxWidth: "100%",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          transform: visible
            ? "scale(1) translateY(0)"
            : "scale(0.95) translateY(10px)",
          opacity: visible ? 1 : 0,
          transition: "all .25s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            padding: "22px 26px 18px",
            color: "#fff",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "rgba(255,255,255,.15)",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={15} />
          </button>
          <div style={{ fontSize: 17, fontWeight: 800 }}>
            {isEdit ? "콘테스트 수정" : "새 콘테스트"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
            {isEdit ? "정보를 수정합니다" : "새로운 콘테스트를 등록합니다"}
          </div>
          {autoStatus && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                marginTop: 10,
                padding: "3px 12px",
                borderRadius: 100,
                background: "rgba(255,255,255,.18)",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {autoStatus.l}
            </div>
          )}
        </div>
        <div
          style={{
            padding: "22px 26px 20px",
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleImageFile(e.dataTransfer.files[0]);
            }}
            style={{
              width: "100%",
              height: 140,
              borderRadius: 12,
              border: "2px dashed #E2E8F0",
              background: imagePreview
                ? `url(${imagePreview}) center/cover`
                : "#F8FAFC",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              marginBottom: 18,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {!imagePreview && (
              <>
                <ImagePlus size={24} color="#94A3B8" />
                <div
                  style={{
                    fontSize: 12,
                    color: "#94A3B8",
                    marginTop: 6,
                    fontWeight: 600,
                  }}
                >
                  이미지 업로드 (선택)
                </div>
              </>
            )}
            {imagePreview && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity .2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
              >
                <Camera size={20} color="#fff" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleImageFile(e.target.files[0])}
            />
          </div>
          <Field label="콘테스트명" required>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="예: 베스트 드레서 콘테스트"
            />
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="시작일">
              <input
                type="date"
                value={form.startAt}
                onChange={(e) => set("startAt", e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </Field>
            <Field label="종료일">
              <input
                type="date"
                value={form.endAt}
                onChange={(e) => set("endAt", e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </Field>
          </div>
          <Field label="설명">
            <textarea
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="콘테스트 설명"
            />
          </Field>
          {err && (
            <div
              style={{
                fontSize: 12,
                color: "#EF4444",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {err}
            </div>
          )}
        </div>
        <div style={{ padding: "14px 26px 20px", display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: "1.5px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#64748B",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg,#7C3AED,#A78BFA)",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            저장
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ═══ 참가자 등록/수정 모달 ═══ */
function ParticipantFormModal({ item, onSave, onClose, isEdit }) {
  const [form, setForm] = useState(
    item || { petName: "", breedDetail: "", imageUrl: "" },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");
  const [imagePreview, setImagePreview] = useState(item?.imageUrl || null);
  const fileInputRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const handleImageFile = (file) => {
    if (
      !file ||
      !file.type.startsWith("image/") ||
      file.size > 10 * 1024 * 1024
    )
      return;
    const r = new FileReader();
    r.onload = (e) => {
      setImagePreview(e.target.result);
      set("imageUrl", e.target.result);
    };
    r.readAsDataURL(file);
  };
  const handleSave = () => {
    if (!form.petName) {
      setErr("반려동물 이름은 필수입니다.");
      return;
    }
    onSave({ ...form, imageUrl: imagePreview });
  };
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);
  return (
    <Overlay onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 18,
          width: 400,
          maxWidth: "100%",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          transform: visible
            ? "scale(1) translateY(0)"
            : "scale(0.95) translateY(10px)",
          opacity: visible ? 1 : 0,
          transition: "all .25s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            padding: "22px 26px 18px",
            color: "#fff",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "rgba(255,255,255,.15)",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={15} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Dog size={18} />
            <span style={{ fontSize: 17, fontWeight: 800 }}>
              {isEdit ? "참가자 수정" : "참가자 등록"}
            </span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
            콘테스트에 참가할 반려동물 정보
          </div>
        </div>
        <div style={{ padding: "22px 26px 10px" }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleImageFile(e.dataTransfer.files[0]);
            }}
            style={{
              width: "100%",
              aspectRatio: "1/1",
              maxHeight: 220,
              borderRadius: 14,
              border: "2px dashed #DDD6FE",
              background: imagePreview
                ? `url(${imagePreview}) center/cover`
                : "linear-gradient(135deg, #FAF5FF, #EDE9FE)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              marginBottom: 18,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {!imagePreview && (
              <>
                <Camera size={28} color="#8B5CF6" />
                <div
                  style={{
                    fontSize: 13,
                    color: "#7C3AED",
                    marginTop: 8,
                    fontWeight: 700,
                  }}
                >
                  반려동물 사진 업로드
                </div>
                <div style={{ fontSize: 11, color: "#A78BFA", marginTop: 2 }}>
                  정사각형 이미지 권장
                </div>
              </>
            )}
            {imagePreview && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity .2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
              >
                <Camera size={24} color="#fff" />
                <span
                  style={{
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    marginLeft: 6,
                  }}
                >
                  변경
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleImageFile(e.target.files[0])}
            />
          </div>
          <Field label="반려동물 이름" required>
            <input
              value={form.petName}
              onChange={(e) => set("petName", e.target.value)}
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="예: 별이"
            />
          </Field>
          <Field label="상세 견종">
            <input
              value={form.breedDetail || ""}
              onChange={(e) => set("breedDetail", e.target.value)}
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="예: 포메라니안"
            />
          </Field>
          {err && (
            <div
              style={{
                fontSize: 12,
                color: "#EF4444",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {err}
            </div>
          )}
        </div>
        <div style={{ padding: "8px 26px 20px", display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: "1.5px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#64748B",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg,#7C3AED,#A78BFA)",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            {isEdit ? "수정" : "등록"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ═══ 콘테스트 카드 (좌측) ═══ */
function ContestCard({ item, idx, isSelected, onClick, participantCount }) {
  const badge = contestBadge(item.status);
  const icon = ICON_POOL[idx % ICON_POOL.length];
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        border: isSelected ? "1.5px solid #8B5CF6" : "1.5px solid #ECEEF3",
        borderRadius: 12,
        background: isSelected ? "#F5F0FF" : "#fff",
        boxShadow: isSelected ? "0 0 0 3px rgba(139,92,246,0.08)" : "none",
        cursor: "pointer",
        transition: "all .18s",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          background: icon.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {icon.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: ds.ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#A0A7B5",
            marginTop: 3,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Users size={11} /> {participantCount}팀
          </span>
          {item.startAt && (
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <CalendarDays size={11} /> {item.startAt.split("T")[0]}
            </span>
          )}
        </div>
      </div>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 10px",
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 600,
          background: badge.bg,
          color: badge.c,
        }}
      >
        {badge.dot && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: badge.c,
              animation: "pulseGlow 2s infinite",
            }}
          />
        )}
        {badge.l}
      </span>
      <ChevronRight size={16} style={{ color: "#D1D5DB" }} />
    </div>
  );
}

/* ═══ 참가자 카드 (우측 그리드) ═══ */
function ParticipantCard({ p, rank, totalVotes, onEdit, onDelete }) {
  const pct = totalVotes > 0 ? Math.round((p.votes / totalVotes) * 100) : 0;
  const barPct = totalVotes > 0 ? (p.votes / totalVotes) * 100 : 0;
  const rankColor = RANK_COLORS[rank - 1] || "#94A3B8";
  const cardColor = CARD_COLORS[(rank - 1) % CARD_COLORS.length];
  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #ECEEF3",
        borderRadius: 16,
        overflow: "hidden",
        transition: "all .22s",
        animation: `cardIn .35s ease ${(rank - 1) * 0.07}s both`,
        position: "relative",
      }}
    >
      {/* 정사각형 이미지 */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1/1",
          position: "relative",
          overflow: "hidden",
          background: p.imageUrl
            ? "#F1F3F6"
            : `linear-gradient(135deg, ${cardColor}20, ${cardColor}08)`,
        }}
      >
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.petName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Dog size={40} color={cardColor} />
          </div>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.35) 100%)",
            pointerEvents: "none",
          }}
        />
        {/* 순위 */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 30,
            height: 30,
            borderRadius: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            color: "#fff",
            background:
              rank <= 3
                ? `linear-gradient(135deg, ${rankColor}, ${rankColor}cc)`
                : "rgba(0,0,0,0.4)",
            zIndex: 2,
          }}
        >
          {rank}
        </div>
        {/* 투표수 */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 12,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 100,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(6px)",
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          <Heart size={11} fill="#fff" /> {p.votes.toLocaleString()}표
        </div>
        {/* 관리 버튼 */}
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            gap: 4,
            zIndex: 2,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(p);
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "rgba(255,255,255,0.9)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pencil size={12} color="#6B7280" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(p);
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "rgba(255,255,255,0.9)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash2 size={12} color="#EF4444" />
          </button>
        </div>
      </div>
      {/* 하단 */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800, color: ds.ink }}>
            {p.petName}
          </span>
          {totalVotes > 0 && (
            <span style={{ fontSize: 14, fontWeight: 800, color: "#6D28D9" }}>
              {pct}%
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#868E9C",
            fontWeight: 500,
            marginBottom: 10,
          }}
        >
          {p.breedDetail || "미등록"}
        </div>
        {totalVotes > 0 && (
          <div
            style={{
              height: 6,
              background: "#F1F3F6",
              borderRadius: 100,
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${barPct}%`,
                borderRadius: 100,
                background: cardColor,
                transition: "width .6s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 100,
              background: p.status === "APPROVED" ? "#ECFDF5" : "#FEF3C7",
              color: p.status === "APPROVED" ? "#059669" : "#D97706",
            }}
          >
            {p.status === "APPROVED" ? "승인됨" : "대기 중"}
          </span>
          {rank === 1 && totalVotes > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#F59E0B",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Crown size={11} /> 1위
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   메인 컴포넌트
═══════════════════════════════════════════ */
export default function ContestManage({ subTab = "all" }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedContest, setSelectedContest] = useState(null);
  const [participantModal, setParticipantModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteParticipant, setDeleteParticipant] = useState(null);
  const imageMapRef = useRef({});
  const [participantsMap, setParticipantsMap] = useState({});
  const showToast = (msg, type = "success") => setToast({ msg, type });

  const getParticipants = useCallback(
    (contestId) => participantsMap[contestId] || [],
    [participantsMap],
  );

  const selectContest = useCallback(
    (contest) => {
      setSelectedContest(contest);
      if (!participantsMap[contest.programId]) {
        // 첫 번째 콘테스트만 mock 데이터
        setParticipantsMap((prev) => {
          if (prev[contest.programId]) return prev;
          const isFirst =
            items.length > 0 && items[0].programId === contest.programId;
          return {
            ...prev,
            [contest.programId]: isFirst ? MOCK_PARTICIPANTS : [],
          };
        });
      }
    },
    [participantsMap, items],
  );

  /* ── API ── */
  const loadEvents = async () => {
    try {
      const res = await axiosInstance.get("/api/admin/dashboard/events", {
        headers: authHeaders(),
      });
      const list = res.data?.data || res.data || [];
      setEvents(
        list.map((e) => ({
          ...e,
          status: calcStatus(
            e.startAt || e.date?.split("~")[0]?.trim()?.replace(/\./g, "-"),
            e.endAt || e.date?.split("~")[1]?.trim()?.replace(/\./g, "-"),
          ),
        })),
      );
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };
  const loadItems = async (eventId) => {
    setLoadingItems(true);
    try {
      const res = await axiosInstance.get(
        `/api/admin/dashboard/events/${eventId}/programs`,
        { params: { category: "CONTEST" }, headers: authHeaders() },
      );
      const list = (res.data?.data || res.data || []).map((p) => ({
        ...p,
        status: calcStatus(p.startAt, p.endAt),
        imageUrl: imageMapRef.current[p.programId] || p.imageUrl || null,
      }));
      setItems(list);
      if (list.length > 0) selectContest(list[0]);
      else setSelectedContest(null);
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };
  useEffect(() => {
    loadEvents();
  }, []);

  /* ── 콘테스트 CRUD ── */
  const saveContest = async (form) => {
    const isEdit = !!modal?.item;
    const eventId = selectedEvent?.eventId || selectedEvent?.id;
    try {
      if (isEdit) {
        await axiosInstance.put(
          `/api/admin/dashboard/programs/${modal.item.programId}`,
          {
            name: form.name,
            description: form.description || "",
            startAt: form.startAt || null,
            endAt: form.endAt || null,
            category: "CONTEST",
          },
          { headers: authHeaders() },
        );
        if (form.imageUrl)
          imageMapRef.current[modal.item.programId] = form.imageUrl;
      } else {
        const res = await axiosInstance.post(
          `/api/admin/dashboard/events/${eventId}/programs`,
          {
            name: form.name,
            description: form.description || "",
            startAt: form.startAt || null,
            endAt: form.endAt || null,
            category: "CONTEST",
          },
          { headers: authHeaders() },
        );
        const newId = res.data?.data?.programId || res.data?.data;
        if (form.imageUrl && newId) imageMapRef.current[newId] = form.imageUrl;
      }
      showToast(
        isEdit ? "콘테스트가 수정되었습니다" : "콘테스트가 등록되었습니다",
      );
      setModal(null);
      await loadItems(eventId);
    } catch (e) {
      showToast(e.response?.data?.message || "저장 실패", "error");
    }
  };
  const handleDeleteContest = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(
        `/api/admin/dashboard/programs/${deleteTarget.programId}`,
        { headers: authHeaders() },
      );
      showToast("삭제되었습니다");
      setDeleteTarget(null);
      if (selectedContest?.programId === deleteTarget.programId)
        setSelectedContest(null);
      await loadItems(selectedEvent.eventId || selectedEvent.id);
    } catch (e) {
      showToast(e.response?.data?.message || "삭제 실패", "error");
    }
  };

  /* ── 참가자 CRUD (mock) ── */
  const saveParticipant = (form) => {
    const cid = selectedContest.programId;
    setParticipantsMap((prev) => {
      const list = [...(prev[cid] || [])];
      if (participantModal?.item) {
        const idx = list.findIndex((p) => p.id === participantModal.item.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...form };
      } else {
        list.push({ ...form, id: Date.now(), votes: 0, status: "APPLIED" });
      }
      return { ...prev, [cid]: list };
    });
    showToast(
      participantModal?.item ? "수정되었습니다" : "참가자가 등록되었습니다",
    );
    setParticipantModal(null);
  };
  const handleDeleteParticipant = () => {
    if (!deleteParticipant) return;
    const cid = selectedContest.programId;
    setParticipantsMap((prev) => ({
      ...prev,
      [cid]: (prev[cid] || []).filter((p) => p.id !== deleteParticipant.id),
    }));
    showToast("참가자가 삭제되었습니다");
    setDeleteParticipant(null);
  };

  /* ── 통계 ── */
  const participants = selectedContest
    ? getParticipants(selectedContest.programId)
    : [];
  const sortedP = [...participants].sort((a, b) => b.votes - a.votes);
  const totalVotes = participants.reduce((a, b) => a + b.votes, 0);
  const liveCount = items.filter((i) => i.status === "active").length;
  const allP = items.reduce(
    (s, it) => s + getParticipants(it.programId).length,
    0,
  );

  /* ═══ 이벤트 선택 화면 ═══ */
  if (!selectedEvent) {
    return (
      <div style={{ fontFamily: ds.ff }}>
        <style>{styles}</style>
        {toast && (
          <Toast
            msg={toast.msg}
            type={toast.type}
            onDone={() => setToast(null)}
          />
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: ds.brand,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trophy size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: ds.ink }}>
              콘테스트 관리
            </div>
            <div style={{ fontSize: 13, color: "#94A3B8" }}>
              행사를 선택해 콘테스트를 관리하세요
            </div>
          </div>
        </div>
        {loadingEvents ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>
            로딩 중...
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <Trophy size={22} color="#94A3B8" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#6B7280" }}>
              등록된 행사가 없습니다
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 14,
            }}
          >
            {events.map((ev) => (
              <div
                key={ev.eventId || ev.id}
                onClick={() => {
                  setSelectedEvent(ev);
                  loadItems(ev.eventId || ev.id);
                }}
                style={{
                  background: "#fff",
                  border: "1.5px solid #ECEEF3",
                  borderRadius: 14,
                  padding: "20px 22px",
                  cursor: "pointer",
                  transition: "all .18s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = ds.brand;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#ECEEF3";
                  e.currentTarget.style.transform = "";
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: ds.ink,
                    marginBottom: 6,
                  }}
                >
                  {ev.name}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <CalendarDays size={12} /> {ev.date || "날짜 미정"}
                  </span>
                  {ev.location && (
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      📍 {ev.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ═══ 콘테스트 대시보드 (3단계) ═══ */
  return (
    <div style={{ fontFamily: ds.ff }}>
      <style>{styles}</style>
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
      {modal && (
        <ContestFormModal
          item={modal.item}
          onSave={saveContest}
          onClose={() => setModal(null)}
          isEdit={!!modal.item}
        />
      )}
      {participantModal && (
        <ParticipantFormModal
          item={participantModal.item}
          onSave={saveParticipant}
          onClose={() => setParticipantModal(null)}
          isEdit={!!participantModal.item}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="콘테스트 삭제"
          msg={`"${deleteTarget.name}" 삭제하시겠습니까?`}
          onConfirm={handleDeleteContest}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {deleteParticipant && (
        <ConfirmModal
          title="참가자 삭제"
          msg={`"${deleteParticipant.petName}" 삭제하시겠습니까?`}
          onConfirm={handleDeleteParticipant}
          onCancel={() => setDeleteParticipant(null)}
        />
      )}

      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => {
              setSelectedEvent(null);
              setSelectedContest(null);
              setItems([]);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              borderRadius: 10,
              border: "none",
              background: ds.brand,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
              boxShadow: "0 2px 8px rgba(67,97,238,.25)",
            }}
          >
            <ChevronLeft size={15} /> 행사 목록
          </button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: ds.ink }}>
              {selectedEvent.name}
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>
              콘테스트 {items.length}개 · 참가자 {allP}팀
            </div>
          </div>
        </div>
        <button
          onClick={() => setModal({ item: null })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: ds.brand,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: ds.ff,
            boxShadow: "0 2px 10px rgba(67,97,238,.25)",
          }}
        >
          <Plus size={15} /> 콘테스트 추가
        </button>
      </div>

      {/* 통계 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "전체 콘테스트",
            value: `${items.length}개`,
            icon: <Trophy size={18} color="#F59E0B" />,
            bg: "#FFFBEB",
          },
          {
            label: "투표 진행 중",
            value: `${liveCount}개`,
            icon: <Heart size={18} color="#8B5CF6" />,
            bg: "#F5F3FF",
          },
          {
            label: "총 참가팀",
            value: `${allP}팀`,
            icon: <Users size={18} color="#10B981" />,
            bg: "#ECFDF5",
          },
          {
            label: "총 투표수",
            value: `${totalVotes}표`,
            icon: <BarChart3 size={18} color="#D97706" />,
            bg: "#FFFBEB",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              border: "1px solid #ECEEF3",
              borderRadius: 14,
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: s.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#868E9C", fontWeight: 500 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: ds.ink }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 메인 2열 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedContest ? "380px 1fr" : "1fr",
          gap: 16,
        }}
      >
        {/* 좌: 콘테스트 목록 */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #ECEEF3",
            borderRadius: 14,
            padding: "20px 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              paddingBottom: 12,
              borderBottom: "1px solid #F1F3F6",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 15,
                fontWeight: 700,
                color: ds.ink,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: "#FFFBEB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trophy size={13} color="#F59E0B" />
              </div>
              콘테스트 목록
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#868E9C",
                background: "#F3F4F7",
                padding: "4px 10px",
                borderRadius: 100,
              }}
            >
              총 {items.length}개
            </span>
          </div>
          {loadingItems ? (
            <div style={{ textAlign: "center", padding: 30, color: "#94A3B8" }}>
              로딩 중...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#F3F4F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px",
                }}
              >
                <Trophy size={20} color="#94A3B8" />
              </div>
              <div style={{ fontSize: 13, color: "#94A3B8" }}>
                등록된 콘테스트가 없습니다
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((it, idx) => (
                <div key={it.programId} style={{ position: "relative" }}>
                  <ContestCard
                    item={it}
                    idx={idx}
                    isSelected={selectedContest?.programId === it.programId}
                    onClick={() => selectContest(it)}
                    participantCount={getParticipants(it.programId).length}
                  />
                  {selectedContest?.programId === it.programId && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 38,
                        display: "flex",
                        gap: 3,
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({ item: it });
                        }}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          background: "#F5F3FF",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Pencil size={11} color="#8B5CF6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(it);
                        }}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          background: "#FEF2F2",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={11} color="#EF4444" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 우: 참가자 그리드 */}
        {selectedContest && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #ECEEF3",
              borderRadius: 14,
              padding: "20px 24px",
            }}
          >
            {/* 배너 */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, #6D28D9 0%, #A855F7 50%, #C084FC 100%)",
                borderRadius: 14,
                padding: "22px 24px 18px",
                color: "#fff",
                marginBottom: 18,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -50,
                  right: -30,
                  width: 160,
                  height: 160,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 12px",
                    background: "rgba(255,255,255,0.18)",
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {contestBadge(selectedContest.status).dot && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#FBBF24",
                        animation: "pulseGlow 2s infinite",
                      }}
                    />
                  )}
                  {contestBadge(selectedContest.status).l}
                </div>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {totalVotes}표 참여
                </span>
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Trophy size={20} />
                {selectedContest.name}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 18,
                  marginTop: 10,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 13,
                    opacity: 0.85,
                  }}
                >
                  <Users size={13} /> {participants.length}팀
                </span>
                {selectedContest.startAt && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 13,
                      opacity: 0.85,
                    }}
                  >
                    <CalendarDays size={13} />{" "}
                    {selectedContest.startAt.split("T")[0]}
                  </span>
                )}
              </div>
            </div>

            {/* 참가자 헤더 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: "#F5F0FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Dog size={13} color="#7C3AED" />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: ds.ink }}>
                  참가자 관리
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#868E9C",
                    background: "#F3F4F7",
                    padding: "3px 10px",
                    borderRadius: 100,
                  }}
                >
                  {participants.length}팀
                </span>
              </div>
              <button
                onClick={() => setParticipantModal({ item: null })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "8px 16px",
                  borderRadius: 9,
                  border: "none",
                  background: ds.brand,
                  color: "#fff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: ds.ff,
                  boxShadow: "0 2px 8px rgba(67,97,238,.2)",
                }}
              >
                <Plus size={14} /> 참가자 등록
              </button>
            </div>

            {/* 카드 그리드 */}
            {participants.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#F5F0FF,#EDE9FE)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                  }}
                >
                  <Dog size={26} color="#8B5CF6" />
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#6B7280",
                    marginBottom: 6,
                  }}
                >
                  아직 참가자가 없습니다
                </div>
                <div
                  style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}
                >
                  참가자를 등록해 콘테스트를 시작하세요
                </div>
                <button
                  onClick={() => setParticipantModal({ item: null })}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 22px",
                    borderRadius: 10,
                    border: "none",
                    background: ds.brand,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: ds.ff,
                  }}
                >
                  <Plus size={14} /> 첫 참가자 등록하기
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 14,
                }}
              >
                {sortedP.map((p, i) => (
                  <ParticipantCard
                    key={p.id}
                    p={p}
                    rank={i + 1}
                    totalVotes={totalVotes}
                    onEdit={(item) => setParticipantModal({ item })}
                    onDelete={(item) => setDeleteParticipant(item)}
                  />
                ))}
                {/* 추가 카드 */}
                <div
                  onClick={() => setParticipantModal({ item: null })}
                  style={{
                    border: "2px dashed #DDD6FE",
                    borderRadius: 16,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    minHeight: 260,
                    background: "#FAFAFE",
                    transition: "all .18s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#8B5CF6";
                    e.currentTarget.style.background = "#F5F0FF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#DDD6FE";
                    e.currentTarget.style.background = "#FAFAFE";
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "#EDE9FE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Plus size={20} color="#8B5CF6" />
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED" }}
                  >
                    참가자 추가
                  </div>
                </div>
              </div>
            )}

            {/* 투표 안내 */}
            {participants.length > 0 && (
              <div
                style={{
                  marginTop: 18,
                  background: "linear-gradient(135deg, #FAF8FF, #F5F0FF)",
                  border: "1.5px solid #EDE9FE",
                  borderRadius: 12,
                  padding: "16px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#4C1D95",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <Info size={15} color="#7C3AED" /> 투표 안내
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 6,
                  }}
                >
                  {[
                    {
                      icon: <Heart size={12} color="#7C3AED" />,
                      text: "콘테스트별 1회 투표",
                    },
                    {
                      icon: <AlertCircle size={12} color="#7C3AED" />,
                      text: "투표 후 변경 불가",
                    },
                    {
                      icon: <Star size={12} color="#7C3AED" />,
                      text: "결과 실시간 반영",
                    },
                    {
                      icon: <Medal size={12} color="#7C3AED" />,
                      text: "홈페이지에서 투표",
                    },
                  ].map((it, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: "#5B21B6",
                        fontWeight: 500,
                      }}
                    >
                      {it.icon} {it.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {!selectedContest && items.length > 0 && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #ECEEF3",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 60,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#F5F0FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <ChevronLeft size={22} color="#8B5CF6" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#6B7280" }}>
                콘테스트를 선택하세요
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
                좌측에서 선택하면 참가자를 관리할 수 있습니다
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
