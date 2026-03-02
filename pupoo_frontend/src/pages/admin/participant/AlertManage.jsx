import { useState, useEffect } from "react";
import {
  Send,
  Users,
  X,
  Plus,
  Bell,
  Mail,
  ChevronDown,
  Pencil,
  Trash2,
  AlertTriangle,
  Check,
  Search,
} from "lucide-react";
import ds from "../shared/designTokens";
import DATA from "../shared/data";
import { eventApi } from "../../../app/http/eventApi";
import { adminNotificationApi } from "../../../app/http/adminNotificationApi";

/** 발송 대상(recipientScope) 옵션 — 백엔드 Enum 매핑 */
const RECIPIENT_SCOPE_OPTIONS = [
  { value: "INTEREST_SUBSCRIBERS", label: "관심 구독자" },
  { value: "EVENT_REGISTRANTS", label: "이벤트 신청자" },
  { value: "EVENT_PAYERS", label: "결제 완료자" },
];

const styles = `
@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
`;

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
function ConfirmModal({
  title,
  msg,
  onConfirm,
  onCancel,
  label = "삭제",
  danger = true,
}) {
  return (
    <Overlay onClose={onCancel}>
      <div style={{ padding: 28 }}>
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
              background: danger ? "#FEF2F2" : "#EFF6FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {danger ? (
              <AlertTriangle size={18} color="#EF4444" />
            ) : (
              <Send size={18} color={ds.brand} />
            )}
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
              background: danger ? "#EF4444" : ds.brand,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            {label}
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
        transition: "all .15s",
        flexShrink: 0,
      }}
    >
      {checked && <Check size={size - 6} color="#fff" strokeWidth={3} />}
    </div>
  );
}
function StatCard({ icon: I, label, value, sub }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #F1F5F9",
        padding: 16,
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
          background: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <I size={16} color="#64748B" />
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            color: "#94A3B8",
            fontWeight: 600,
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: ds.ink }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
function StatusDot({ status, label }) {
  const map = {
    sent: { bg: "#ECFDF5", color: "#059669", dot: "#10B981" },
    draft: { bg: "#FFF7ED", color: "#D97706", dot: "#F59E0B" },
  };
  const s = map[status] || map.draft;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
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
      {label}
    </span>
  );
}
const STATUS_LABEL = { sent: "발송완료", draft: "임시저장" };

/* ── 슬라이드 패널 ── */
function SlidePanel({ item, onSave, onClose, isEdit, events = [] }) {
  const [form, setForm] = useState(() => {
    if (item) {
      const scope = item.recipientScope || "INTEREST_SUBSCRIBERS";
      const scopeOpt = RECIPIENT_SCOPE_OPTIONS.find((o) => o.value === scope);
      return {
        eventId: item.eventId ?? "",
        title: item.title ?? "",
        content: item.content ?? "",
        recipientScope: scope,
        target: scopeOpt?.label ?? item.target ?? RECIPIENT_SCOPE_OPTIONS[0].label,
        targetCount: item.targetCount ?? 0,
        status: item.status ?? "draft",
      };
    }
    return {
      eventId: "",
      title: "",
      content: "",
      recipientScope: "INTEREST_SUBSCRIBERS",
      target: RECIPIENT_SCOPE_OPTIONS[0].label,
      targetCount: 0,
      status: "draft",
    };
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");
  const handleSave = () => {
    if (!form.title || !form.content) {
      setErr("제목과 내용은 필수입니다.");
      return;
    }
    if (!form.eventId && !isEdit) {
      setErr("대상 행사를 선택해 주세요.");
      return;
    }
    const scopeOpt = RECIPIENT_SCOPE_OPTIONS.find((o) => o.value === form.recipientScope);
    const eventName = events.find((e) => String(e.eventId) === String(form.eventId))?.eventName ?? "";
    onSave({
      ...form,
      eventId: form.eventId ? Number(form.eventId) : form.eventId,
      eventName,
      target: scopeOpt?.label ?? form.target,
      targetCount: form.targetCount ?? 0,
    });
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
              {isEdit ? "알림 수정" : "새 알림 작성"}
            </h3>
            <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "3px 0 0" }}>
              {isEdit ? "알림을 수정합니다" : "새 알림을 작성합니다"}
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
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
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
          <Field label="대상 행사" required>
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
                <option value="">행사 선택</option>
                {events.map((ev) => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.eventName ?? ev.eventTitle ?? `행사 ${ev.eventId}`}
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
          <Field label="제목" required>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="알림 제목"
            />
          </Field>
          <Field label="발송 대상">
            <div style={{ position: "relative" }}>
              <select
                value={form.recipientScope}
                onChange={(e) => {
                  const v = e.target.value;
                  const opt = RECIPIENT_SCOPE_OPTIONS.find((o) => o.value === v);
                  set("recipientScope", v);
                  if (opt) set("target", opt.label);
                }}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  paddingRight: 32,
                  cursor: "pointer",
                }}
              >
                {RECIPIENT_SCOPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
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
          <Field label="내용" required>
            <textarea
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="알림 내용을 작성하세요"
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
            {isEdit ? "수정 완료" : "저장하기"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════ */
export default function AlertManage() {
  const [items, setItems] = useState(() =>
    (DATA.alertHistory || []).map((e) => ({
      ...e,
      _visible: true,
      eventId: e.eventId ?? null,
      recipientScope: e.recipientScope ?? "INTEREST_SUBSCRIBERS",
      eventName: e.eventName ?? "",
    })),
  );
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(null);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const show = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    let cancelled = false;
    eventApi
      .getEvents({ page: 0, size: 200 })
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data ?? res?.data;
        const list = data?.content ?? data ?? [];
        setEvents(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => { cancelled = true; };
  }, []);

  const visible = items.filter((e) => e._visible);
  const sent = visible.filter((e) => e.status === "sent").length;
  const draft = visible.filter((e) => e.status === "draft").length;
  const totalTarget = visible
    .filter((e) => e.status === "sent")
    .reduce((a, b) => a + b.targetCount, 0);
  const rows = visible.filter((e) => !search || e.title.includes(search));

  const toggleAll = () =>
    setSelected(selected.length === rows.length ? [] : rows.map((r) => r.id));
  const toggle = (id) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const handleCreate = (f) => {
    setItems((p) => [
      {
        ...f,
        id: `AL-${String(p.length + 1).padStart(3, "0")}`,
        sentDate: null,
        _visible: true,
        status: f.status ?? "draft",
      },
      ...p,
    ]);
    setPanel(null);
    show("알림이 저장되었습니다.");
  };
  const handleUpdate = (f) => {
    setItems((p) => p.map((e) => (e.id === f.id ? { ...e, ...f } : e)));
    setPanel(null);
    show("알림이 수정되었습니다.");
  };
  const handleDelete = () => {
    const id = modal.item.id;
    setModal(null);
    setItems((p) =>
      p.map((e) => (e.id === id ? { ...e, _visible: false } : e)),
    );
    show("알림이 삭제되었습니다.");
  };
  const handleSend = (item) => {
    if (!item.eventId) {
      setModal(null);
      show("대상 행사를 선택해 주세요. 알림을 수정한 뒤 다시 발송해 주세요.", "error");
      return;
    }
    const payload = {
      type: "EVENT",
      title: item.title,
      content: item.content,
      targetType: "EVENT",
      targetId: Number(item.eventId),
      eventId: Number(item.eventId),
      channels: ["APP"],
      recipientScope: item.recipientScope || "INTEREST_SUBSCRIBERS",
    };
    adminNotificationApi
      .publishEvent(payload)
      .then(() => {
        const d = new Date();
        setItems((p) =>
          p.map((e) =>
            e.id === item.id
              ? {
                  ...e,
                  status: "sent",
                  sentDate: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`,
                }
              : e,
          ),
        );
        setModal(null);
        show("알림이 발송되었습니다.");
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.error?.message ||
          err?.message ||
          "발송에 실패했습니다.";
        show(msg, "error");
      });
  };

  return (
    <div>
      <style>{styles}</style>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatCard icon={Send} label="발송 완료" value={`${sent}건`} />
        <StatCard icon={Mail} label="임시 저장" value={`${draft}건`} />
        <StatCard
          icon={Users}
          label="총 발송 대상"
          value={`${totalTarget.toLocaleString()}명`}
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
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: ds.ink }}>
              알림 발송 내역
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>
              {rows.length}건
            </span>
            {selected.length > 0 && (
              <button
                onClick={() => {}}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#DC2626",
                  cursor: "pointer",
                  fontFamily: ds.ff,
                }}
              >
                {selected.length}건 삭제
              </button>
            )}
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
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> 알림 작성
            </button>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
              <th style={{ width: 44, padding: "10px 0", textAlign: "center" }}>
                <Checkbox
                  checked={rows.length > 0 && selected.length === rows.length}
                  onChange={toggleAll}
                />
              </th>
              {[
                "제목",
                "내용",
                "행사",
                "대상",
                "대상자수",
                "발송일",
                "상태",
                "액션",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 12px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#94A3B8",
                    textAlign: h === "대상자수" ? "right" : "left",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                style={{
                  borderBottom: "1px solid #F8FAFC",
                  transition: "background .1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#F4F6F8")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td
                  style={{ width: 44, textAlign: "center", padding: "10px 0" }}
                >
                  <Checkbox
                    checked={selected.includes(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: ds.ink,
                  }}
                >
                  {r.title}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span
                    style={{
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "block",
                      fontSize: 12,
                      color: "#94A3B8",
                    }}
                  >
                    {r.content}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748B" }}>
                  {r.eventName || "—"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "#EFF6FF",
                      color: ds.brand,
                    }}
                  >
                    {r.target}
                  </span>
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: ds.ink,
                    textAlign: "right",
                  }}
                >
                  {r.targetCount}명
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontSize: 12.5,
                    color: "#475569",
                  }}
                >
                  {r.sentDate || "—"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <StatusDot
                    status={r.status}
                    label={STATUS_LABEL[r.status] || r.status}
                  />
                </td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    {r.status === "draft" && (
                      <button
                        onClick={() => setModal({ type: "send", item: r })}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 5,
                          border: "1px solid #05966920",
                          background: "#ECFDF510",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#059669",
                          cursor: "pointer",
                          fontFamily: ds.ff,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Send size={10} /> 발송
                      </button>
                    )}
                    <button
                      onClick={() => setPanel({ type: "edit", item: r })}
                      style={{
                        padding: "4px 8px",
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
                    <button
                      onClick={() => setModal({ type: "delete", item: r })}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 5,
                        border: "1px solid transparent",
                        background: "transparent",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#EF4444",
                        cursor: "pointer",
                        fontFamily: ds.ff,
                        opacity: 0.5,
                        transition: "opacity .12s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = "1")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "0.5")
                      }
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Bell size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
              알림 내역이 없습니다
            </div>
          </div>
        )}
      </div>

      {panel?.type === "create" && (
        <SlidePanel
          events={events}
          onSave={handleCreate}
          onClose={() => setPanel(null)}
        />
      )}
      {panel?.type === "edit" && (
        <SlidePanel
          item={panel.item}
          isEdit
          events={events}
          onSave={handleUpdate}
          onClose={() => setPanel(null)}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title="알림 삭제"
          msg={`"${modal.item.title}" 알림을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === "send" && (
        <ConfirmModal
          title="알림 발송"
          msg={`"${modal.item.title}" 알림을 ${modal.item.target} 대상(${modal.item.targetCount}명)에게 발송하시겠습니까?`}
          label="발송"
          danger={false}
          onConfirm={() => handleSend(modal.item)}
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
