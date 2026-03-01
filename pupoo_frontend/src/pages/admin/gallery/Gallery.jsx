import { useState, useEffect, useCallback, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ImageOff,
  Users,
  Film,
} from "lucide-react";
import ds from "../shared/designTokens";
import { Pill } from "../shared/Components";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { getToken } from "../../../api/noticeApi";
import { eventApi } from "../../../app/http/eventApi";

/* ══════════════════════════════════════════
   인라인 API
   ══════════════════════════════════════════ */
function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const api = {
  list: (uiPage = 1, size = 20) =>
    axiosInstance.get("/api/galleries", {
      params: { page: uiPage - 1, size },
      headers: authHeaders(),
    }),
  create: (data) =>
    axiosInstance.post("/api/admin/galleries", data, {
      headers: authHeaders(),
    }),
  update: (id, data) =>
    axiosInstance.patch(`/api/admin/galleries/${id}`, data, {
      headers: authHeaders(),
    }),
  delete: (id) =>
    axiosInstance.delete(`/api/admin/galleries/${id}`, {
      headers: authHeaders(),
    }),
};

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? null;
}
function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/* ── meta 태그 파싱 ──
   DB: "배콩아<!--meta:{"galleryType":"현장"}-->"
   → { text: "배콩아", type: "현장" }
*/
const META_RE = /<!--meta:(.*?)-->/;
function parseMeta(desc) {
  if (!desc) return { text: "", type: null };
  const m = desc.match(META_RE);
  const text = desc.replace(META_RE, "").trim();
  let type = null;
  if (m) {
    try {
      type = JSON.parse(m[1]).galleryType;
    } catch {}
  }
  return { text, type };
}
function isSketch(item) {
  return parseMeta(item.description).type === "현장";
}
function cleanDesc(item) {
  return parseMeta(item.description).text;
}
function appendMeta(desc, galleryType) {
  return `${desc || ""}<!--meta:${JSON.stringify({ galleryType })}-->`;
}

/* ── 이미지 URL 해석 ──
   DB에 "/uploads/gallery/xxx.jpg" 형태로 저장됨
   → 백엔드 baseURL 붙여서 실제 접근 가능한 URL로 변환 */
const API_BASE = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:8080"
).replace(/\/+$/, "");

function resolveImgUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return API_BASE + url;
  return url;
}

/* ── 이미지 헬퍼 ── */
function getThumbUrl(item) {
  const url = item.imageUrls?.[0] || null;
  return resolveImgUrl(url);
}
function getImageCount(item) {
  return item.imageUrls?.length || 0;
}
function resolveImageUrls(item) {
  return (item.imageUrls || []).map(resolveImgUrl);
}

const styles = `
@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.gal-card2{transition:transform .18s,box-shadow .18s}
.gal-card2:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.08)}
.gal-tab{position:relative;padding:10px 20px;font-size:14px;font-weight:700;border:none;background:none;cursor:pointer;color:#94A3B8;transition:color .15s}
.gal-tab.active{color:${ds.brand}}
.gal-tab.active::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2.5px;background:${ds.brand};border-radius:2px 2px 0 0}
`;

function Spinner({ size = 20 }) {
  return (
    <Loader2
      size={size}
      color={ds.brand}
      style={{ animation: "spin 1s linear infinite" }}
    />
  );
}

/* ═══════ 공통 UI ═══════ */
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

function Overlay({ children, onClose, wide }) {
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
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: wide ? 860 : 540,
          maxWidth: "95vw",
          maxHeight: "90vh",
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
            disabled={loading}
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
              fontFamily: ds.ff,
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

function NoImagePlaceholder({ height = 240 }) {
  return (
    <div
      style={{
        height,
        background: "#F1F5F9",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <ImageOff size={32} color="#CBD5E1" />
      <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
        이미지 없음
      </span>
    </div>
  );
}

function useEventMap(events) {
  const map = {};
  (events || []).forEach((ev) => {
    map[ev.eventId] = ev.eventName || ev.title || `행사 #${ev.eventId}`;
  });
  return map;
}

/* ═══════ 상세 모달 (사진 왼쪽 / 설명 오른쪽) ═══════ */
function DetailModal({ item, onClose, onEdit, onDelete, eventMap }) {
  const imgCount = getImageCount(item);
  const resolvedUrls = resolveImageUrls(item);
  const [imgIdx, setImgIdx] = useState(0);
  const currentImg = resolvedUrls[imgIdx] || null;
  const [imgErr, setImgErr] = useState(false);
  const desc = cleanDesc(item);
  const sketch = isSketch(item);

  return (
    <Overlay onClose={onClose} wide>
      <div style={{ display: "flex", minHeight: 420 }}>
        {/* 왼쪽: 이미지 */}
        <div
          style={{
            flex: "0 0 55%",
            position: "relative",
            background: "#F1F5F9",
            borderRadius: "16px 0 0 16px",
            overflow: "hidden",
          }}
        >
          {currentImg && !imgErr ? (
            <img
              src={currentImg}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ImageOff size={40} color="#CBD5E1" />
              <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600 }}>
                이미지 없음
              </span>
            </div>
          )}
          {imgCount > 1 && (
            <>
              {/* 인디케이터 점 */}
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 6,
                }}
              >
                {resolvedUrls.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setImgIdx(i);
                      setImgErr(false);
                    }}
                    style={{
                      width: i === imgIdx ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      border: "none",
                      background:
                        i === imgIdx ? "#fff" : "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      transition: "all .15s",
                      padding: 0,
                    }}
                  />
                ))}
              </div>
              {/* 카운터 */}
              <span
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: 20,
                }}
              >
                {imgIdx + 1} / {imgCount}
              </span>
              {/* 좌우 화살표 */}
              {imgIdx > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImgIdx(imgIdx - 1);
                    setImgErr(false);
                  }}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.35)",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {imgIdx < imgCount - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImgIdx(imgIdx + 1);
                    setImgErr(false);
                  }}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.35)",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </>
          )}
        </div>

        {/* 오른쪽: 정보 */}
        <div
          style={{
            flex: 1,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* 닫기 */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 8,
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                border: "1px solid #E2E8F0",
                background: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={13} color="#94A3B8" />
            </button>
          </div>

          {/* 유저/운영팀 정보 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: sketch ? `${ds.brand}12` : "#F3E8FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                  color: sketch ? ds.brand : "#8B5CF6",
                }}
              >
                {sketch ? "운" : (item.title || "?")[0]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: ds.ink }}>
                  {sketch ? "운영팀" : item.title}
                </div>
                {item.eventId && eventMap[item.eventId] && (
                  <div style={{ fontSize: 11.5, color: "#94A3B8" }}>
                    🐾 {eventMap[item.eventId]}
                  </div>
                )}
              </div>
            </div>
            <span style={{ fontSize: 12, color: "#CBD5E1" }}>
              {fmtDate(item.createdAt)}
            </span>
          </div>

          {/* 제목 (현장 스케치) */}
          {sketch && (
            <h4
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: ds.ink,
                margin: "0 0 8px",
              }}
            >
              {item.title}
            </h4>
          )}

          {/* 설명 */}
          <p
            style={{
              fontSize: 13.5,
              color: "#334155",
              lineHeight: 1.7,
              margin: "0 0 16px",
              flex: 1,
            }}
          >
            {desc || "설명이 없습니다."}
          </p>

          {/* 상태 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <Pill
              color={
                item.status === "PUBLIC"
                  ? "#10B981"
                  : item.status === "BLINDED"
                    ? "#F59E0B"
                    : "#94A3B8"
              }
              bg={
                item.status === "PUBLIC"
                  ? "#10B98110"
                  : item.status === "BLINDED"
                    ? "#F59E0B10"
                    : "#94A3B810"
              }
            >
              {item.status || "PUBLIC"}
            </Pill>
            <Pill
              color={sketch ? ds.brand : "#8B5CF6"}
              bg={sketch ? `${ds.brand}10` : "#8B5CF610"}
            >
              {sketch ? "현장 스케치" : "참가자"}
            </Pill>
          </div>

          {/* 좋아요 / 조회수 */}
          <div
            style={{
              display: "flex",
              gap: 16,
              padding: "12px 0",
              borderTop: "1px solid #F1F5F9",
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
              <Heart size={14} color="#EF4444" /> {item.likeCount ?? 0}
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
              <Eye size={14} color="#94A3B8" /> {item.viewCount ?? 0}
            </span>
          </div>

          {/* 버튼 */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              paddingTop: 12,
              borderTop: "1px solid #F1F5F9",
            }}
          >
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

/* ═══════ 등록/수정 모달 ═══════ */
function FormModal({
  item,
  onSave,
  onClose,
  isEdit,
  saving,
  events,
  galleryType,
}) {
  const [form, setForm] = useState(
    item
      ? {
          title: item.title || "",
          description: cleanDesc(item),
          eventId: item.eventId ? String(item.eventId) : "",
        }
      : { title: "", description: "", eventId: "" },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");
  const [imageUrls, setImageUrls] = useState(item?.imageUrls || []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  /* 파일 선택 → 즉시 서버 업로드 → URL 수집 */
  const addFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await axiosInstance.post(
        "/api/admin/galleries/images/upload",
        formData,
        {
          headers: { ...authHeaders() },
        },
      );

      const uploaded = res?.data?.data?.urls || [];
      setImageUrls((prev) => [...prev, ...uploaded]);
    } catch (e) {
      console.error("[Gallery] image upload error:", e);
      console.error(
        "[Gallery] response:",
        e?.response?.status,
        e?.response?.data,
      );
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        e.message;
      setErr("이미지 업로드 실패: " + msg);
    } finally {
      setUploading(false);
    }
  };

  const removeUrl = (idx) => setImageUrls((p) => p.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (!form.title.trim()) {
      setErr("제목은 필수입니다.");
      return;
    }
    if (!isEdit && !form.eventId) {
      setErr("행사를 선택해주세요.");
      return;
    }

    // description에 meta 태그 append
    const descWithMeta = appendMeta(form.description, galleryType);

    if (isEdit) {
      onSave({ title: form.title, description: descWithMeta });
    } else {
      onSave({
        eventId: Number(form.eventId),
        title: form.title,
        description: descWithMeta,
        imageUrls: imageUrls.length > 0 ? imageUrls : null,
      });
    }
  };

  const label = galleryType === "현장" ? "현장 스케치" : "참가자 갤러리";

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
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
              {isEdit ? `${label} 수정` : `${label} 등록`}
            </h3>
            <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "3px 0 0" }}>
              {isEdit ? "정보를 수정합니다" : `새 ${label}를 등록합니다`}
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

        {!isEdit && (
          <Field label="행사 선택" required>
            <div style={{ position: "relative" }}>
              <select
                value={form.eventId}
                onChange={(e) => set("eventId", e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  paddingRight: 32,
                  cursor: "pointer",
                }}
              >
                <option value="">행사를 선택하세요</option>
                {(events || []).map((ev) => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.eventName || ev.title || `행사 #${ev.eventId}`}
                  </option>
                ))}
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
        )}

        <Field label="설명">
          <textarea
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            onFocus={inputFocus}
            onBlur={inputBlur}
            placeholder="갤러리 설명을 입력하세요"
          />
        </Field>

        {!isEdit && (
          <Field label="이미지">
            {/* 파일 선택 → 서버 업로드 */}
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = ds.brand;
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "#E2E8F0";
                addFiles(e.dataTransfer.files);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "20px",
                borderRadius: 9,
                border: "2px dashed #E2E8F0",
                cursor: uploading ? "wait" : "pointer",
                transition: "border-color .15s",
                background: "#FAFBFC",
                opacity: uploading ? 0.6 : 1,
              }}
              onMouseEnter={(e) =>
                !uploading && (e.currentTarget.style.borderColor = ds.brand)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#E2E8F0")
              }
            >
              {uploading ? (
                <>
                  <Spinner size={24} />
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}
                  >
                    업로드 중...
                  </span>
                </>
              ) : (
                <>
                  <Camera size={24} color="#94A3B8" />
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}
                  >
                    클릭 또는 드래그하여 이미지 업로드
                  </span>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>
                    JPG, PNG, GIF, WebP · 10MB 이하 · 최대 10장
                  </span>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
                style={{ display: "none" }}
              />
            </div>

            {/* 업로드된 이미지 미리보기 */}
            {imageUrls.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                {imageUrls.map((url, i) => (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      overflow: "hidden",
                      border:
                        i === 0 ? `2px solid ${ds.brand}` : "1px solid #E2E8F0",
                    }}
                  >
                    <img
                      src={resolveImgUrl(url)}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    {i === 0 && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: ds.brand,
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 700,
                          textAlign: "center",
                          padding: "2px 0",
                        }}
                      >
                        대표
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeUrl(i);
                      }}
                      style={{
                        position: "absolute",
                        top: 3,
                        right: 3,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.5)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Field>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            onClick={onClose}
            disabled={saving || uploading}
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
            disabled={saving || uploading}
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
              opacity: saving || uploading ? 0.5 : 1,
            }}
          >
            {uploading
              ? "업로드 중..."
              : saving
                ? "저장 중..."
                : isEdit
                  ? "수정 완료"
                  : "등록하기"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ═══════ 참가자 갤러리 카드 (정사각형) ═══════ */
function UserGalleryCard({ item, onClick, eventMap }) {
  const thumbUrl = getThumbUrl(item);
  const imgCount = getImageCount(item);
  const [imgErr, setImgErr] = useState(false);
  const desc = cleanDesc(item);

  return (
    <div
      className="gal-card2"
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #F1F5F9",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "relative",
          paddingBottom: "100%",
          overflow: "hidden",
          background: "#F1F5F9",
        }}
      >
        {thumbUrl && !imgErr ? (
          <img
            src={thumbUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <ImageOff size={28} color="#CBD5E1" />
            <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>
              이미지 없음
            </span>
          </div>
        )}
        {imgCount > 1 && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 20,
            }}
          >
            1 / {imgCount}
          </span>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#F3E8FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                color: "#8B5CF6",
              }}
            >
              {(item.title || "?")[0]}
            </div>
            <div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: ds.ink }}>
                {item.title}
              </span>
              {item.eventId && eventMap[item.eventId] && (
                <div style={{ fontSize: 10.5, color: "#94A3B8" }}>
                  🐾 {eventMap[item.eventId]}
                </div>
              )}
            </div>
          </div>
          <span style={{ fontSize: 10.5, color: "#CBD5E1" }}>
            {fmtDate(item.createdAt)}
          </span>
        </div>
        <p
          style={{
            fontSize: 12.5,
            color: "#334155",
            lineHeight: 1.5,
            margin: "0 0 10px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {desc || ""}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
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
            <Heart size={13} /> {item.likeCount ?? 0}
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
            <Eye size={13} /> {item.viewCount ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════ 현장 스케치 카드 ═══════ */
function SketchCard({ item, onClick, eventMap }) {
  const thumbUrl = getThumbUrl(item);
  const imgCount = getImageCount(item);
  const [imgErr, setImgErr] = useState(false);
  const desc = cleanDesc(item);

  return (
    <div
      className="gal-card2"
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #F1F5F9",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "relative",
          paddingBottom: "75%",
          overflow: "hidden",
          background: "#F1F5F9",
        }}
      >
        {thumbUrl && !imgErr ? (
          <img
            src={thumbUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <ImageOff size={28} color="#CBD5E1" />
            <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>
              이미지 없음
            </span>
          </div>
        )}
        {imgCount > 1 && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 20,
            }}
          >
            1 / {imgCount}
          </span>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <Pill color={ds.brand} bg={`${ds.brand}10`}>
          {eventMap[item.eventId] || "현장 스케치"}
        </Pill>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 800,
            color: ds.ink,
            margin: "8px 0 4px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </h4>
        <p
          style={{
            fontSize: 12.5,
            color: "#64748B",
            lineHeight: 1.5,
            margin: "0 0 10px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {desc || ""}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 8,
            borderTop: "1px solid #F8FAFC",
          }}
        >
          <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>
            운영팀
          </span>
          <span style={{ fontSize: 11, color: "#CBD5E1" }}>
            {fmtDate(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════ */
export default function Gallery() {
  const [tab, setTab] = useState("sketch");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 40;

  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(null);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const eventMap = useEventMap(events);
  const showToast = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    eventApi
      .getEvents({ page: 0, size: 100 })
      .then((res) => {
        const d = res?.data?.data ?? res?.data ?? {};
        setEvents(d.content || (Array.isArray(d) ? d : []));
      })
      .catch((e) => console.error("[Gallery] 행사 목록 조회 실패:", e));
  }, []);

  const fetchList = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.list(p, PAGE_SIZE);
      const d = unwrap(res);
      setItems(d.content || []);
      setTotalPages(d.totalPages || 0);
      setPage(p);
    } catch (err) {
      console.error("[Gallery] fetch error:", err);
      setError(
        err?.response?.status === 401
          ? "로그인이 필요합니다."
          : "갤러리를 불러오는데 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(1);
  }, [fetchList]);

  /* 탭별 필터링 (meta 태그 기반) */
  const filtered = items
    .filter((g) => {
      const s = isSketch(g);
      if (tab === "sketch") return s;
      return !s;
    })
    .filter(
      (g) =>
        !search ||
        (g.title || "").includes(search) ||
        cleanDesc(g).includes(search),
    );

  /* CRUD */
  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await api.create(form);
      setPanel(null);
      showToast(
        tab === "sketch"
          ? "현장 스케치가 등록되었습니다."
          : "갤러리가 등록되었습니다.",
      );
      fetchList(1);
    } catch (err) {
      console.error("[Gallery] create error:", err);
      showToast(
        err?.response?.data?.message || "등록에 실패했습니다.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      await api.update(panel.item.galleryId, form);
      setPanel(null);
      showToast("갤러리가 수정되었습니다.");
      fetchList(page);
    } catch (err) {
      console.error("[Gallery] update error:", err);
      showToast(
        err?.response?.data?.message || "수정에 실패했습니다.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(modal.item.galleryId);
      setModal(null);
      showToast("갤러리가 삭제되었습니다.");
      fetchList(page);
    } catch (err) {
      console.error("[Gallery] delete error:", err);
      setModal(null);
      showToast("삭제에 실패했습니다.", "error");
    } finally {
      setSaving(false);
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
        {/* 탭 + 헤더 */}
        <div style={{ borderBottom: "1px solid #F1F5F9" }}>
          <div
            style={{
              display: "flex",
              gap: 0,
              padding: "0 20px",
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <button
              className={`gal-tab ${tab === "user" ? "active" : ""}`}
              onClick={() => setTab("user")}
              style={{ fontFamily: ds.ff }}
            >
              <Users size={14} style={{ marginRight: 5, verticalAlign: -2 }} />
              참가자 갤러리
            </button>
            <button
              className={`gal-tab ${tab === "sketch" ? "active" : ""}`}
              onClick={() => setTab("sketch")}
              style={{ fontFamily: ds.ff }}
            >
              <Film size={14} style={{ marginRight: 5, verticalAlign: -2 }} />
              현장 스케치
            </button>
          </div>
          <div
            style={{
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: ds.ink,
                  margin: 0,
                }}
              >
                {tab === "sketch" ? "현장 스케치" : "참가자 갤러리"}
              </h3>
              {!loading && (
                <span
                  style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}
                >
                  총 {filtered.length}개
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="검색"
                  style={{
                    width: 150,
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
                onClick={() => fetchList(page)}
                title="새로고침"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  border: "1px solid #E2E8F0",
                  background: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RefreshCw size={14} color="#64748B" />
              </button>
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
                }}
              >
                <Plus size={13} strokeWidth={2.5} /> 등록
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Spinner size={28} />
            <span style={{ fontSize: 13, color: "#94A3B8" }}>
              불러오는 중...
            </span>
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: "60px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#64748B",
                marginBottom: 8,
              }}
            >
              {error}
            </div>
            <button
              onClick={() => fetchList(page)}
              style={{
                padding: "8px 20px",
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
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div
            style={{
              padding: 20,
              display: "grid",
              gridTemplateColumns:
                tab === "user"
                  ? "repeat(auto-fill, minmax(220px, 1fr))"
                  : "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((g) =>
              tab === "user" ? (
                <UserGalleryCard
                  key={g.galleryId}
                  item={g}
                  eventMap={eventMap}
                  onClick={() => setModal({ type: "detail", item: g })}
                />
              ) : (
                <SketchCard
                  key={g.galleryId}
                  item={g}
                  eventMap={eventMap}
                  onClick={() => setModal({ type: "detail", item: g })}
                />
              ),
            )}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
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
              {tab === "sketch"
                ? "등록된 현장 스케치가 없습니다"
                : "참가자 갤러리가 없습니다"}
            </div>
            <div style={{ fontSize: 12.5, color: "#94A3B8" }}>
              {tab === "sketch"
                ? "새 현장 스케치를 등록해보세요"
                : "참가자들의 갤러리가 여기에 표시됩니다"}
            </div>
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <button
              disabled={page <= 1}
              onClick={() => fetchList(page - 1)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                border: "1px solid #E2E8F0",
                background: "#fff",
                cursor: page <= 1 ? "default" : "pointer",
                opacity: page <= 1 ? 0.4 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={14} color="#64748B" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => fetchList(i + 1)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  border: page === i + 1 ? "none" : "1px solid #E2E8F0",
                  background: page === i + 1 ? ds.brand : "#fff",
                  color: page === i + 1 ? "#fff" : "#64748B",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: ds.ff,
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page >= totalPages}
              onClick={() => fetchList(page + 1)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                border: "1px solid #E2E8F0",
                background: "#fff",
                cursor: page >= totalPages ? "default" : "pointer",
                opacity: page >= totalPages ? 0.4 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={14} color="#64748B" />
            </button>
          </div>
        )}
      </div>

      {/* 모달 */}
      {panel?.type === "create" && (
        <FormModal
          onSave={handleCreate}
          onClose={() => setPanel(null)}
          saving={saving}
          events={events}
          galleryType={tab === "sketch" ? "현장" : "참가자"}
        />
      )}
      {panel?.type === "edit" && (
        <FormModal
          item={panel.item}
          isEdit
          onSave={handleUpdate}
          onClose={() => setPanel(null)}
          saving={saving}
          events={events}
          galleryType={isSketch(panel.item) ? "현장" : "참가자"}
        />
      )}
      {modal?.type === "detail" && (
        <DetailModal
          item={modal.item}
          onClose={() => setModal(null)}
          eventMap={eventMap}
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
          loading={saving}
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
