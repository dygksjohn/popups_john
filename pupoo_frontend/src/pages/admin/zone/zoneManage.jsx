import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  Layers,
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
  transition: "border-color .15s",
  background: "#fff",
};
const inputFocus = (e) => {
  e.target.style.borderColor = ds.brand;
};
const inputBlur = (e) => {
  e.target.style.borderColor = "#E2E8F0";
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

const BOOTH_TYPES = [
  { v: "BOOTH_EXPERIENCE", l: "체험" },
  { v: "BOOTH_COMPANY", l: "기업" },
  { v: "BOOTH_FOOD", l: "푸드" },
  { v: "BOOTH_SALE", l: "판매" },
  { v: "BOOTH_INFO", l: "안내" },
  { v: "BOOTH_SPONSOR", l: "스폰서" },
  { v: "ETC", l: "기타" },
];
const ZONES = [
  { v: "ZONE_A", l: "A구역" },
  { v: "ZONE_B", l: "B구역" },
  { v: "ZONE_C", l: "C구역" },
  { v: "OTHER", l: "기타" },
];
const STATUSES = [
  { v: "OPEN", l: "운영 중" },
  { v: "CLOSED", l: "종료" },
  { v: "PAUSED", l: "일시중단" },
];
const typeLabel = (v) => BOOTH_TYPES.find((t) => t.v === v)?.l || v;
const zoneLabel = (v) => ZONES.find((z) => z.v === v)?.l || v;
const statusLabel = (v) => STATUSES.find((s) => s.v === v)?.l || v;
const statusColor = (v) =>
  v === "OPEN"
    ? { c: "#059669", bg: "#ECFDF5" }
    : v === "PAUSED"
      ? { c: "#D97706", bg: "#FFFBEB" }
      : { c: "#94A3B8", bg: "#F1F5F9" };

/* ═══ 부스 등록/수정 모달 ═══ */
function BoothFormModal({ item, onSave, onClose, isEdit, eventName }) {
  const [form, setForm] = useState(
    item
      ? { ...item }
      : {
          placeName: "",
          type: "BOOTH_EXPERIENCE",
          description: "",
          company: "",
          zone: "ZONE_A",
          status: "OPEN",
        },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 20);
  }, []);

  const handleSave = () => {
    if (!form.placeName) {
      setErr("장소명은 필수입니다.");
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
            width: 520,
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
                  {isEdit ? "체험존 수정" : "새 체험존 등록"}
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <Field label="장소명" required>
                <input
                  style={inputStyle}
                  value={form.placeName}
                  onChange={(e) => set("placeName", e.target.value)}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  placeholder="예: 반려동물 체험존"
                  autoFocus
                />
              </Field>
              <Field label="업체명">
                <input
                  style={inputStyle}
                  value={form.company || ""}
                  onChange={(e) => set("company", e.target.value)}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  placeholder="업체명"
                />
              </Field>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 14,
              }}
            >
              <Field label="유형" required>
                <div style={{ position: "relative" }}>
                  <select
                    value={form.type}
                    onChange={(e) => set("type", e.target.value)}
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      paddingRight: 32,
                      cursor: "pointer",
                    }}
                  >
                    {BOOTH_TYPES.map((t) => (
                      <option key={t.v} value={t.v}>
                        {t.l}
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
              <Field label="구역" required>
                <div style={{ position: "relative" }}>
                  <select
                    value={form.zone}
                    onChange={(e) => set("zone", e.target.value)}
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      paddingRight: 32,
                      cursor: "pointer",
                    }}
                  >
                    {ZONES.map((z) => (
                      <option key={z.v} value={z.v}>
                        {z.l}
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
              <Field label="상태">
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
                    {STATUSES.map((s) => (
                      <option key={s.v} value={s.v}>
                        {s.l}
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
            </div>
            <Field label="설명">
              <textarea
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                value={form.description || ""}
                onChange={(e) => set("description", e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="체험존 설명"
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

/* ═══ 부스 상세 모달 ═══ */
function BoothDetailModal({ item, onClose, onEdit, onDelete }) {
  const sc = statusColor(item.status);
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
            체험존 상세
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
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94A3B8",
                fontFamily: "monospace",
              }}
            >
              #{item.boothId}
            </span>
            <Pill color={sc.c} bg={sc.bg}>
              {statusLabel(item.status)}
            </Pill>
          </div>
          <h4
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: ds.ink,
              margin: "0 0 14px",
            }}
          >
            {item.placeName}
          </h4>
          {[
            { l: "유형", v: typeLabel(item.type) },
            { l: "구역", v: zoneLabel(item.zone) },
            { l: "업체", v: item.company || "-" },
          ].map((r) => (
            <div
              key={r.l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <span style={{ fontSize: 13, color: "#64748B" }}>{r.l}</span>
              <span style={{ fontSize: 13, color: ds.ink, fontWeight: 600 }}>
                {r.v}
              </span>
            </div>
          ))}
          {item.description && (
            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>
                설명
              </span>
              <p
                style={{
                  fontSize: 13,
                  color: "#475569",
                  lineHeight: 1.6,
                  marginTop: 6,
                }}
              >
                {item.description}
              </p>
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

/* ═══ 메인 ═══ */
export default function ZoneManage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [booths, setBooths] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingBooths, setLoadingBooths] = useState(false);
  const [modal, setModal] = useState(null);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const showToast = (msg, type = "success") => setToast({ msg, type });
  const calcStatus = (s, e) => {
    if (!s && !e) return "pending";
    const n = new Date();
    const start = s
      ? new Date(s.includes("T") ? s : s + "T00:00:00+09:00")
      : null;
    const end = e
      ? new Date(e.includes("T") ? e : e + "T23:59:59+09:00")
      : null;
    if (end && n > end) return "ended";
    if (start && n < start) return "pending";
    return "active";
  };

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
  const loadBooths = async (eventId) => {
    setLoadingBooths(true);
    try {
      const res = await axiosInstance.get(
        `/api/admin/dashboard/events/${eventId}/booths`,
        { headers: authHeaders() },
      );
      setBooths(
        (res.data?.data || res.data || []).map((b) => ({
          ...b,
          id: b.boothId,
        })),
      );
    } catch {
      setBooths([]);
    } finally {
      setLoadingBooths(false);
    }
  };
  useEffect(() => {
    loadEvents();
  }, []);

  const selectEvent = (ev) => {
    setSelectedEvent(ev);
    setSelected(new Set());
    loadBooths(ev.eventId || ev.id);
  };
  const goBack = () => {
    setSelectedEvent(null);
    setBooths([]);
    setSelected(new Set());
    setPanel(null);
  };
  const evId = () => selectedEvent?.eventId || selectedEvent?.id;

  const handleCreate = async (form) => {
    try {
      await axiosInstance.post(
        "/api/admin/dashboard/booths",
        { eventId: Number(evId()), ...form },
        { headers: authHeaders() },
      );
      await loadBooths(evId());
      setPanel(null);
      showToast("체험존이 등록되었습니다.");
    } catch {
      showToast("등록 실패", "error");
    }
  };
  const handleUpdate = async (form) => {
    try {
      await axiosInstance.patch(
        `/api/admin/dashboard/booths/${form.boothId}`,
        form,
        { headers: authHeaders() },
      );
      await loadBooths(evId());
      setPanel(null);
      showToast("체험존이 수정되었습니다.");
    } catch {
      showToast("수정 실패", "error");
    }
  };
  const handleDelete = async () => {
    const item = modal.item;
    setModal(null);
    setRemoving(item.boothId);
    try {
      await axiosInstance.delete(
        `/api/admin/dashboard/booths/${item.boothId}`,
        { headers: authHeaders() },
      );
      setTimeout(async () => {
        await loadBooths(evId());
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
      await axiosInstance.post(
        "/api/admin/dashboard/booths/bulk-delete",
        { boothIds: ids.map(Number) },
        { headers: authHeaders() },
      );
      await loadBooths(evId());
      setSelected(new Set());
      showToast(`${ids.length}건 삭제`);
    } catch {
      showToast("일괄 삭제 실패", "error");
    }
  };

  const rows = booths;
  const isAllSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.boothId));
  const hasSelected = selected.size > 0;
  const toggleAll = () => {
    if (isAllSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.boothId)));
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
              체험존 관리
            </h3>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
              체험존을 관리할 행사를 선택하세요
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
                        lineHeight: 1.3,
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
                    {ev.location && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: "#94A3B8",
                          marginTop: 4,
                        }}
                      >
                        <MapPin size={12} /> {ev.location}
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
                      <Layers size={13} /> 체험존 관리하기
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
              icon={Layers}
              label="전체 체험존"
              value={booths.length}
              color={ds.brand}
            />
            <StatCard
              icon={Clock}
              label="운영 중"
              value={booths.filter((b) => b.status === "OPEN").length}
              color="#10B981"
            />
            <StatCard
              icon={Users}
              label="일시중단"
              value={booths.filter((b) => b.status === "PAUSED").length}
              color="#F59E0B"
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
                  체험존 목록
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
                  <Plus size={13} strokeWidth={2.5} /> 체험존 등록
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
                    { label: "장소명", w: "30%" },
                    { label: "유형", w: 80 },
                    { label: "구역", w: 70 },
                    { label: "업체", w: 100 },
                    { label: "상태", w: 80 },
                    { label: "", w: 130 },
                  ].map((c, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "10px 14px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "#94A3B8",
                        textAlign: "left",
                        ...(c.w ? { width: c.w } : {}),
                      }}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingBooths ? (
                  <tr>
                    <td
                      colSpan={7}
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
                    <td colSpan={7} style={{ padding: "60px 0" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Layers size={36} color="#CBD5E1" strokeWidth={1.5} />
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#94A3B8",
                            marginTop: 12,
                          }}
                        >
                          등록된 체험존이 없습니다
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "#CBD5E1",
                            marginTop: 4,
                          }}
                        >
                          이 행사에 체험존을 등록해보세요
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const sc = statusColor(r.status);
                    const isChecked = selected.has(r.boothId);
                    return (
                      <tr
                        key={r.boothId}
                        className={removing === r.boothId ? "row-removing" : ""}
                        onClick={() => setModal({ type: "detail", item: r })}
                        style={{
                          borderBottom: "1px solid #F8FAFC",
                          cursor: "pointer",
                          transition: "background .1s",
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
                            onChange={() => toggleOne(r.boothId)}
                          />
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: ds.ink,
                            }}
                          >
                            {r.placeName}
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              color: "#94A3B8",
                              fontFamily: "monospace",
                            }}
                          >
                            #{r.boothId}
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <Pill color="#8B5CF6" bg="#8B5CF610">
                            {typeLabel(r.type)}
                          </Pill>
                        </td>
                        <td
                          style={{
                            padding: "11px 14px",
                            fontSize: 12.5,
                            color: "#475569",
                            fontWeight: 600,
                          }}
                        >
                          {zoneLabel(r.zone)}
                        </td>
                        <td
                          style={{
                            padding: "11px 14px",
                            fontSize: 12.5,
                            color: "#475569",
                          }}
                        >
                          {r.company || "-"}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <Pill color={sc.c} bg={sc.bg}>
                            {statusLabel(r.status)}
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
                                setModal({ type: "detail", item: r });
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
                              상세
                            </button>
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
                                background: "#FEF2F208",
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
        <BoothFormModal
          onSave={handleCreate}
          onClose={() => setPanel(null)}
          eventName={selectedEvent?.name || selectedEvent?.eventName}
        />
      )}
      {panel?.type === "edit" && (
        <BoothFormModal
          item={panel.item}
          isEdit
          onSave={handleUpdate}
          onClose={() => setPanel(null)}
          eventName={selectedEvent?.name || selectedEvent?.eventName}
        />
      )}
      {modal?.type === "detail" && (
        <BoothDetailModal
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
          title="체험존 삭제"
          msg={`"${modal.item.placeName}" 체험존을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
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
