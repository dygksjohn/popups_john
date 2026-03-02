import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  Mic,
  Users,
  Clock,
  AlertTriangle,
  Check,
  CalendarDays,
  MapPin,
  ArrowRight,
  ImagePlus,
} from "lucide-react";
import ds, { statusMap } from "../shared/designTokens";
import { Pill } from "../shared/Components";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { getToken } from "../../../api/noticeApi";

const styles = `
@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes rowFadeOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-30px)}}
@keyframes spin{to{transform:rotate(360deg)}}
.row-removing{animation:rowFadeOut .3s ease forwards}
`;

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
  e.target.style.borderColor = ds.brand;
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

function Checkbox({ checked, onChange, size = 18 }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange?.();
      }}
      style={{
        width: size,
        height: size,
        borderRadius: 5,
        border: checked ? "none" : "1.8px solid #CBD5E1",
        background: checked ? ds.brand : "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {checked && <Check size={size - 6} color="#fff" strokeWidth={3} />}
    </div>
  );
}
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
          width: 500,
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
        <h3
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: ds.ink,
            margin: "0 0 10px",
          }}
        >
          {title}
        </h3>
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
    <div style={{ marginBottom: 18 }}>
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
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "14px 16px",
        border: "1px solid #F1F5F9",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: `${color}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={color} strokeWidth={2.2} />
      </div>
      <div>
        <div
          style={{
            fontSize: 10.5,
            color: "#94A3B8",
            fontWeight: 600,
            marginBottom: 1,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: ds.ink,
            letterSpacing: -0.5,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* ═══ 등록/수정 모달 ═══ */
function SessionFormModal({ item, onSave, onClose, isEdit, eventName }) {
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
  const [imageFile, setImageFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  useEffect(() => {
    setTimeout(() => setVisible(true), 20);
  }, []);

  const handleImageFile = (file) => {
    if (
      !file ||
      !file.type.startsWith("image/") ||
      file.size > 10 * 1024 * 1024
    )
      return;
    setImageFile(file);
    const r = new FileReader();
    r.onload = (e) => setImagePreview(e.target.result);
    r.readAsDataURL(file);
  };
  const handleSave = () => {
    if (!form.name) {
      setErr("세션명은 필수입니다.");
      return;
    }
    onSave({ ...form, imageUrl: imagePreview });
  };

  const autoStatus =
    form.startAt || form.endAt
      ? (() => {
          const s = calcStatus(form.startAt, form.endAt);
          const map = {
            pending: { l: "대기", c: "#D97706", bg: "#FFFBEB", icon: "⏳" },
            active: { l: "진행 중", c: "#059669", bg: "#ECFDF5", icon: "🟢" },
            ended: { l: "종료", c: "#94A3B8", bg: "#F1F5F9", icon: "⏹" },
          };
          return map[s];
        })()
      : null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 4999,
          background: visible ? "rgba(15,16,23,0.45)" : "rgba(15,16,23,0)",
          transition: "background .3s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 5000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            width: 540,
            maxWidth: "95vw",
            maxHeight: "90vh",
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transform: visible
              ? "translateY(0) scale(1)"
              : "translateY(24px) scale(0.97)",
            opacity: visible ? 1 : 0,
            transition: "all .35s cubic-bezier(.16,1,.3,1)",
          }}
        >
          <div
            style={{ padding: "22px 28px", borderBottom: "1px solid #F1F5F9" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: ds.ink,
                    margin: 0,
                  }}
                >
                  {isEdit ? "세션 수정" : "새 세션/강연 등록"}
                </h3>
                <p
                  style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0" }}
                >
                  <span style={{ color: ds.brand, fontWeight: 700 }}>
                    {eventName}
                  </span>{" "}
                  행사
                </p>
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
                }}
              >
                <X size={15} color="#94A3B8" />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
            {err && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 10,
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
            <Field label="포스터 이미지">
              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleImageFile(e.dataTransfer.files?.[0]);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  style={{
                    border: `2px dashed ${dragOver ? ds.brand : "#E2E8F0"}`,
                    borderRadius: 14,
                    padding: "28px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: dragOver ? `${ds.brand}08` : "#FAFBFC",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      background: `${ds.brand}10`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px",
                    }}
                  >
                    <ImagePlus size={20} color={ds.brand} />
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}
                  >
                    클릭하거나 이미지를 드래그하세요
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>
                    JPG, PNG, WEBP · 최대 10MB
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    position: "relative",
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={imagePreview}
                    alt=""
                    style={{
                      width: "100%",
                      maxHeight: 180,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        border: "none",
                        background: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        border: "none",
                        background: "rgba(239,68,68,0.8)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleImageFile(e.target.files?.[0])}
              />
            </Field>
            <Field label="세션/강연명" required>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="예: 반려동물 건강관리 강연"
                autoFocus
              />
            </Field>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <Field label="시작일">
                <input
                  type="date"
                  style={inputStyle}
                  value={form.startAt || ""}
                  onChange={(e) => set("startAt", e.target.value)}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                />
              </Field>
              <Field label="종료일">
                <input
                  type="date"
                  style={inputStyle}
                  value={form.endAt || ""}
                  onChange={(e) => set("endAt", e.target.value)}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                />
              </Field>
            </div>
            {autoStatus && (
              <div
                style={{
                  marginBottom: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  background: autoStatus.bg,
                  borderRadius: 9,
                }}
              >
                <span style={{ fontSize: 14 }}>{autoStatus.icon}</span>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: autoStatus.c,
                  }}
                >
                  상태: {autoStatus.l} (일정 기준 자동)
                </span>
              </div>
            )}
            <Field label="설명">
              <textarea
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                value={form.description || ""}
                onChange={(e) => set("description", e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="세션/강연 설명"
              />
            </Field>
          </div>
          <div
            style={{
              padding: "16px 28px",
              borderTop: "1px solid #F1F5F9",
              display: "flex",
              gap: 10,
            }}
          >
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px 0",
                borderRadius: 10,
                border: "1px solid #E2E8F0",
                background: "#fff",
                fontSize: 14,
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
                padding: "12px 0",
                borderRadius: 10,
                border: "none",
                background: ds.brand,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: ds.ff,
              }}
            >
              {isEdit ? "수정 완료" : "등록하기"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══ 메인 ═══ */
export default function SessionManage({ subTab = "all" }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [modal, setModal] = useState(null);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const imageMapRef = useRef({});
  const showToast = (msg, type = "success") => setToast({ msg, type });

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
            e.startAt || e.date?.split("~")[0]?.trim(),
            e.endAt || e.date?.split("~")[1]?.trim(),
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
        `/api/admin/dashboard/events/${eventId}/programs?category=SESSION`,
        { headers: authHeaders() },
      );
      setItems(
        (res.data?.data || res.data || []).map((p) => ({
          ...p,
          status: calcStatus(p.startAt, p.endAt),
          imageUrl:
            imageMapRef.current[p.programId || p.id] || p.imageUrl || null,
        })),
      );
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };
  useEffect(() => {
    loadEvents();
  }, []);

  const selectEvent = (ev) => {
    setSelectedEvent(ev);
    setSelected(new Set());
    loadItems(ev.eventId || ev.id);
  };
  const goBack = () => {
    setSelectedEvent(null);
    setItems([]);
    setSelected(new Set());
    setPanel(null);
  };
  const evId = () => selectedEvent?.eventId || selectedEvent?.id;

  const handleCreate = async (form) => {
    try {
      const body = {
        eventId: Number(evId()),
        category: "SESSION",
        programTitle: form.name,
        description: form.description || "",
        startAt: form.startAt
          ? `${form.startAt}T00:00:00`
          : new Date().toISOString().slice(0, 19),
        endAt: form.endAt
          ? `${form.endAt}T23:59:59`
          : new Date().toISOString().slice(0, 19),
        imageUrl: null,
      };
      const res = await axiosInstance.post(
        "/api/admin/dashboard/programs",
        body,
        { headers: authHeaders() },
      );
      const created = res.data?.data || res.data;
      if (form.imageUrl && created?.programId)
        imageMapRef.current[created.programId] = form.imageUrl;
      await loadItems(evId());
      setPanel(null);
      showToast("세션이 등록되었습니다.");
    } catch {
      showToast("등록 실패", "error");
    }
  };
  const handleUpdate = async (form) => {
    const pid = form.programId || form.id;
    try {
      const body = {
        category: "SESSION",
        programTitle: form.name,
        description: form.description || "",
        startAt: form.startAt ? `${form.startAt}T00:00:00` : null,
        endAt: form.endAt ? `${form.endAt}T23:59:59` : null,
        imageUrl: null,
      };
      await axiosInstance.patch(`/api/admin/dashboard/programs/${pid}`, body, {
        headers: authHeaders(),
      });
      if (form.imageUrl) imageMapRef.current[pid] = form.imageUrl;
      else delete imageMapRef.current[pid];
      await loadItems(evId());
      setPanel(null);
      showToast("세션이 수정되었습니다.");
    } catch {
      showToast("수정 실패", "error");
    }
  };
  const handleDelete = async () => {
    const item = modal.item;
    const pid = item.programId || item.id;
    setModal(null);
    setRemoving(item.id);
    try {
      await axiosInstance.delete(`/api/admin/dashboard/programs/${pid}`, {
        headers: authHeaders(),
      });
      setTimeout(async () => {
        await loadItems(evId());
        setRemoving(null);
        showToast("삭제되었습니다.");
      }, 300);
    } catch {
      setRemoving(null);
      showToast("삭제 실패", "error");
    }
  };
  const handleBulkDelete = async () => {
    const ids = [...selected];
    setModal(null);
    try {
      const programIds = ids.map((fid) => {
        const it = items.find((e) => e.id === fid);
        return it?.programId || Number(String(fid).replace("PG-", ""));
      });
      await axiosInstance.post(
        "/api/admin/dashboard/programs/bulk-delete",
        { programIds },
        { headers: authHeaders() },
      );
      await loadItems(evId());
      setSelected(new Set());
      showToast(`${ids.length}건 삭제`);
    } catch {
      showToast("일괄 삭제 실패", "error");
    }
  };

  const filterFn =
    {
      all: () => true,
      active: (e) => e.status === "active",
      ended: (e) => e.status === "ended",
      pending: (e) => e.status === "pending",
    }[subTab] || (() => true);
  const rows = items.filter(filterFn);
  const isAllSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id));
  const hasSelected = selected.size > 0;
  const toggleAll = () => {
    if (isAllSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };
  const toggleOne = (id) => {
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div>
      <style>{styles}</style>
      {!selectedEvent && (
        <>
          <div style={{ marginBottom: 20 }}>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: ds.ink,
                margin: "0 0 6px",
              }}
            >
              세션/강연 관리
            </h3>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
              세션/강연을 관리할 행사를 선택하세요
            </p>
          </div>
          {loadingEvents ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "80px 0",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: `3px solid ${ds.brand}20`,
                  borderTopColor: ds.brand,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <div
                style={{
                  fontSize: 13,
                  color: "#94A3B8",
                  fontWeight: 600,
                  marginTop: 14,
                }}
              >
                행사 목록 로딩 중...
              </div>
            </div>
          ) : events.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "80px 0",
              }}
            >
              <CalendarDays size={42} color="#CBD5E1" strokeWidth={1.5} />
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#94A3B8",
                  marginTop: 14,
                }}
              >
                등록된 행사가 없습니다
              </div>
              <div style={{ fontSize: 13, color: "#CBD5E1", marginTop: 4 }}>
                먼저 행사 관리에서 행사를 등록해주세요
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {events.map((ev) => {
                const st = statusMap[ev.status] || statusMap.pending;
                return (
                  <div
                    key={ev.eventId || ev.id}
                    onClick={() => selectEvent(ev)}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      border: "1px solid #F1F5F9",
                      padding: "20px",
                      cursor: "pointer",
                      transition: "all .2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = ds.brand;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#F1F5F9";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <Pill color={st.c} bg={st.bg}>
                        {st.l}
                      </Pill>
                      <ArrowRight size={16} color="#CBD5E1" />
                    </div>
                    <h4
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: ds.ink,
                        margin: "0 0 8px",
                      }}
                    >
                      {ev.name || ev.eventName}
                    </h4>
                    {ev.date && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: "#94A3B8",
                        }}
                      >
                        <CalendarDays size={12} /> {ev.date}
                      </div>
                    )}
                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 12,
                        borderTop: "1px solid #F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: ds.brand,
                        fontWeight: 700,
                      }}
                    >
                      <Mic size={13} /> 세션/강연 관리하기
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {selectedEvent && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={goBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px 8px 12px",
                borderRadius: 10,
                border: "none",
                background: `${ds.brand}0F`,
                fontSize: 13.5,
                fontWeight: 700,
                color: ds.brand,
                cursor: "pointer",
                fontFamily: ds.ff,
                marginBottom: 14,
                transition: "all .2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${ds.brand}1A`;
                e.currentTarget.style.transform = "translateX(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${ds.brand}0F`;
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <ChevronLeft size={16} strokeWidth={2.5} /> 행사 목록으로
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: ds.ink,
                  margin: 0,
                }}
              >
                {selectedEvent.name || selectedEvent.eventName}
              </h3>
              <Pill
                color={(statusMap[selectedEvent.status] || statusMap.pending).c}
                bg={(statusMap[selectedEvent.status] || statusMap.pending).bg}
              >
                {(statusMap[selectedEvent.status] || statusMap.pending).l}
              </Pill>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <StatCard
              icon={Mic}
              label="전체 세션"
              value={items.length}
              color={ds.brand}
            />
            <StatCard
              icon={Clock}
              label="진행 중"
              value={items.filter((e) => e.status === "active").length}
              color="#10B981"
            />
            <StatCard
              icon={Users}
              label="총 참가자"
              value={items.reduce((a, b) => a + (b.enrolled || 0), 0)}
              color="#8B5CF6"
            />
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #F1F5F9",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: ds.ink }}>
                  세션/강연 목록
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#94A3B8",
                    background: "#F1F5F9",
                    padding: "2px 8px",
                    borderRadius: 5,
                  }}
                >
                  {rows.length}
                </span>
                {hasSelected && (
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: ds.brand,
                      background: `${ds.brand}0C`,
                      padding: "4px 10px",
                      borderRadius: 6,
                    }}
                  >
                    {selected.size}건 선택됨
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {hasSelected && (
                  <button
                    onClick={() => setModal({ type: "bulkDelete" })}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 12px",
                      borderRadius: 7,
                      border: "1px solid #FECACA",
                      background: "#FEF2F2",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#DC2626",
                      cursor: "pointer",
                      fontFamily: ds.ff,
                    }}
                  >
                    <Trash2 size={12} /> 선택 삭제
                  </button>
                )}
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
                  <Plus size={13} strokeWidth={2.5} /> 세션 등록
                </button>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <th style={{ width: 44, padding: "10px 14px" }}>
                    <Checkbox checked={isAllSelected} onChange={toggleAll} />
                  </th>
                  {[
                    { label: "세션/강연명", w: "40%" },
                    { label: "참가자", w: 80, align: "right" },
                    { label: "상태", w: 72 },
                    { label: "", w: 130 },
                  ].map((c, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "10px 14px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "#94A3B8",
                        textAlign: c.align || "left",
                        ...(c.w ? { width: c.w } : {}),
                      }}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingItems ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: "60px 0", textAlign: "center" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            border: `3px solid ${ds.brand}20`,
                            borderTopColor: ds.brand,
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            color: "#94A3B8",
                            fontWeight: 600,
                          }}
                        >
                          로딩 중...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "60px 0" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Mic size={36} color="#CBD5E1" strokeWidth={1.5} />
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#94A3B8",
                            marginTop: 12,
                          }}
                        >
                          등록된 세션/강연이 없습니다
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "#CBD5E1",
                            marginTop: 4,
                          }}
                        >
                          이 행사에 세션/강연을 등록해보세요
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const st = statusMap[r.status] || statusMap.pending;
                    const isChecked = selected.has(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={removing === r.id ? "row-removing" : ""}
                        onClick={() => setModal({ type: "detail", item: r })}
                        style={{
                          borderBottom: "1px solid #F8FAFC",
                          cursor: "pointer",
                          background: isChecked
                            ? `${ds.brand}06`
                            : "transparent",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = isChecked
                            ? `${ds.brand}0A`
                            : "#F4F6F8")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = isChecked
                            ? `${ds.brand}06`
                            : "transparent")
                        }
                      >
                        <td style={{ width: 44, padding: "11px 14px" }}>
                          <Checkbox
                            checked={isChecked}
                            onChange={() => toggleOne(r.id)}
                          />
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            {r.imageUrl && (
                              <img
                                src={r.imageUrl}
                                alt=""
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 8,
                                  objectFit: "cover",
                                  flexShrink: 0,
                                  border: "1px solid #F1F5F9",
                                }}
                              />
                            )}
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: ds.ink,
                                }}
                              >
                                {r.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 10.5,
                                  color: "#94A3B8",
                                  fontFamily: "monospace",
                                }}
                              >
                                {r.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "11px 14px",
                            fontSize: 13,
                            fontWeight: 700,
                            color: ds.ink,
                            textAlign: "right",
                          }}
                        >
                          {r.enrolled || 0}명
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <Pill color={st.c} bg={st.bg}>
                            {st.l}
                          </Pill>
                        </td>
                        <td style={{ padding: "11px 10px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPanel({ type: "edit", item: r });
                              }}
                              style={{
                                padding: "4px 9px",
                                borderRadius: 6,
                                border: "1px solid #E2E8F0",
                                background: "#fff",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#64748B",
                                cursor: "pointer",
                                fontFamily: ds.ff,
                              }}
                            >
                              수정
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModal({ type: "delete", item: r });
                              }}
                              style={{
                                padding: "4px 9px",
                                borderRadius: 6,
                                border: "1px solid #FECACA60",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#DC2626",
                                cursor: "pointer",
                                fontFamily: ds.ff,
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {panel?.type === "create" && (
        <SessionFormModal
          onSave={handleCreate}
          onClose={() => setPanel(null)}
          eventName={selectedEvent?.name || selectedEvent?.eventName}
        />
      )}
      {panel?.type === "edit" && (
        <SessionFormModal
          item={panel.item}
          isEdit
          onSave={handleUpdate}
          onClose={() => setPanel(null)}
          eventName={selectedEvent?.name || selectedEvent?.eventName}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title="세션 삭제"
          msg={`"${modal.item.name}" 세션을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === "bulkDelete" && (
        <ConfirmModal
          title="선택 삭제"
          msg={`선택한 ${selected.size}건을 삭제하시겠습니까?`}
          onConfirm={handleBulkDelete}
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
