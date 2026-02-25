import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Search,
  Eye,
  Check,
  ChevronDown,
  AlertTriangle,
  PawPrint,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  CreditCard,
  QrCode,
  Users,
  Clock,
} from "lucide-react";
import ds from "../shared/designTokens";
import DATA from "../shared/data";

const styles = `
@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
`;

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
function Overlay({ children, onClose, wide }) {
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
          width: wide ? 600 : 520,
          maxHeight: "88vh",
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
    approved: { bg: "#ECFDF5", color: "#059669", dot: "#10B981" },
    pending: { bg: "#FFF7ED", color: "#D97706", dot: "#F59E0B" },
    cancelled: { bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
    paid: { bg: "#ECFDF5", color: "#059669", dot: "#10B981" },
    unpaid: { bg: "#FFF7ED", color: "#D97706", dot: "#F59E0B" },
    refunded: { bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
  };
  const s = map[status] || map.pending;
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
const STATUS_LABEL = { approved: "승인", pending: "대기", cancelled: "취소" };
const PAY_LABEL = { paid: "결제완료", unpaid: "미결제", refunded: "환불" };

/* ── 상세 모달 ── */
function DetailModal({ item, onClose, onEdit, onDelete }) {
  const sessions = (DATA.sessionParticipation || []).filter(
    (s) => s.participant === item.name,
  );
  return (
    <Overlay onClose={onClose} wide>
      <div>
        <div
          style={{
            background: "#F8FAFC",
            padding: "22px 28px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            borderRadius: "16px 16px 0 0",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "#fff",
              border: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              color: ds.brand,
            }}
          >
            {item.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: ds.ink }}>
              {item.name}
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
              {item.id} · {item.event}
            </div>
          </div>
          <StatusDot
            status={item.status}
            label={STATUS_LABEL[item.status] || item.status}
          />
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: "none",
              background: "#E2E8F0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={13} color="#64748B" />
          </button>
        </div>
        <div style={{ padding: "20px 28px 24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {[
              { icon: Phone, l: "연락처", v: item.phone },
              { icon: Mail, l: "이메일", v: item.email },
              {
                icon: PawPrint,
                l: "반려견",
                v: `${item.petName} (${item.petBreed}, ${item.petAge})`,
              },
              { icon: Calendar, l: "등록일", v: item.regDate },
              {
                icon: UserCheck,
                l: "체크인",
                v: item.checkedIn ? `${item.checkinTime} 완료` : "미체크인",
              },
              {
                icon: CreditCard,
                l: "결제",
                v: `${item.amount.toLocaleString()}원 (${item.payMethod})`,
              },
            ].map((x) => (
              <div
                key={x.l}
                style={{
                  padding: "10px 12px",
                  borderRadius: 9,
                  background: "#F8FAFC",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <x.icon
                  size={13}
                  color="#94A3B8"
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <div>
                  <div
                    style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}
                  >
                    {x.l}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: ds.ink }}>
                    {x.v}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 9,
                border: "1px solid #F1F5F9",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#94A3B8",
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                신청 상태
              </div>
              <StatusDot
                status={item.status}
                label={STATUS_LABEL[item.status] || item.status}
              />
            </div>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 9,
                border: "1px solid #F1F5F9",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#94A3B8",
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                결제 상태
              </div>
              <StatusDot
                status={item.payStatus}
                label={PAY_LABEL[item.payStatus] || item.payStatus}
              />
            </div>
          </div>
          {sessions.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: ds.ink,
                  marginBottom: 8,
                }}
              >
                참여 이력
              </div>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 0",
                    borderBottom: "1px solid #F8FAFC",
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 12, fontWeight: 600, color: ds.ink }}
                    >
                      {s.session}
                    </div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>
                      {s.pet} · {s.callTime}
                    </div>
                  </div>
                  <StatusDot
                    status={
                      s.result === "완료"
                        ? "approved"
                        : s.result === "진행중"
                          ? "pending"
                          : "cancelled"
                    }
                    label={s.result}
                  />
                </div>
              ))}
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
      name: "",
      phone: "",
      email: "",
      event: "반려견 페스티벌",
      petName: "",
      petBreed: "",
      petAge: "",
      status: "pending",
      payStatus: "unpaid",
      payMethod: "카드",
      amount: 0,
    },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");
  const handleSave = () => {
    if (!form.name || !form.phone) {
      setErr("이름과 연락처는 필수입니다.");
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
          width: 460,
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
              {isEdit ? "참가자 수정" : "새 참가자 등록"}
            </h3>
            <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "3px 0 0" }}>
              {isEdit ? "참가자 정보를 수정합니다" : "새 참가자를 등록합니다"}
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
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="이름" required>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="참가자명"
              />
            </Field>
            <Field label="연락처" required>
              <input
                style={inputStyle}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="010-0000-0000"
              />
            </Field>
          </div>
          <Field label="이메일">
            <input
              style={inputStyle}
              value={form.email || ""}
              onChange={(e) => set("email", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="email@example.com"
            />
          </Field>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <Field label="반려견 이름">
              <input
                style={inputStyle}
                value={form.petName}
                onChange={(e) => set("petName", e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="몽이"
              />
            </Field>
            <Field label="견종">
              <input
                style={inputStyle}
                value={form.petBreed}
                onChange={(e) => set("petBreed", e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="말티즈"
              />
            </Field>
            <Field label="나이">
              <input
                style={inputStyle}
                value={form.petAge}
                onChange={(e) => set("petAge", e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="3살"
              />
            </Field>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="행사">
              <input
                style={inputStyle}
                value={form.event}
                onChange={(e) => set("event", e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </Field>
            <Field label="참가비">
              <input
                type="number"
                style={inputStyle}
                value={form.amount}
                onChange={(e) => set("amount", +e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </Field>
          </div>
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

/* ═══════════════════════════════════════════
   서브탭: 참가자 목록
   ═══════════════════════════════════════════ */
function TabList({ items, setItems }) {
  const [modal, setModal] = useState(null);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const showToast = (msg, type = "success") => setToast({ msg, type });

  const visible = items.filter((e) => e._visible);
  const rows = visible.filter(
    (e) => !search || e.name.includes(search) || e.id.includes(search),
  );
  const total = visible.length;
  const approved = visible.filter((p) => p.status === "approved").length;
  const checked = visible.filter((p) => p.checkedIn).length;

  const toggleAll = () =>
    setSelected(selected.length === rows.length ? [] : rows.map((r) => r.id));
  const toggle = (id) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const handleCreate = (f) => {
    const d = new Date();
    setItems((p) => [
      {
        ...f,
        id: `PT-${String(p.length + 1).padStart(3, "0")}`,
        regDate: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`,
        checkedIn: false,
        checkinTime: null,
        _visible: true,
      },
      ...p,
    ]);
    setPanel(null);
    showToast("참가자가 등록되었습니다.");
  };
  const handleUpdate = (f) => {
    setItems((p) => p.map((e) => (e.id === f.id ? { ...e, ...f } : e)));
    setPanel(null);
    showToast("참가자 정보가 수정되었습니다.");
  };
  const handleDelete = () => {
    const id = modal.item.id;
    setModal(null);
    setItems((p) =>
      p.map((e) => (e.id === id ? { ...e, _visible: false } : e)),
    );
    showToast("참가자가 삭제되었습니다.");
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatCard icon={Users} label="전체 참가자" value={total} />
        <StatCard icon={UserCheck} label="승인 완료" value={approved} />
        <StatCard
          icon={QrCode}
          label="체크인 완료"
          value={checked}
          sub={`${total ? Math.round((checked / total) * 100) : 0}%`}
        />
        <StatCard icon={Clock} label="대기 중" value={total - approved} />
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
              참가자 목록
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>
              {rows.length}명
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
                {selected.length}명 삭제
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
              <Plus size={13} strokeWidth={2.5} /> 등록
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
                "이름",
                "연락처",
                "행사",
                "반려견",
                "체크인",
                "결제",
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
                    textAlign: "left",
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
                onClick={() => setModal({ type: "detail", item: r })}
                style={{
                  borderBottom: "1px solid #F8FAFC",
                  cursor: "pointer",
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
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ds.ink }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#94A3B8" }}>{r.id}</div>
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontSize: 12.5,
                    color: "#475569",
                  }}
                >
                  {r.phone}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontSize: 12.5,
                    color: "#475569",
                  }}
                >
                  {r.event}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      color: "#475569",
                    }}
                  >
                    <PawPrint size={11} color="#8B5CF6" />
                    {r.petName} ({r.petBreed})
                  </span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {r.checkedIn ? (
                    <StatusDot status="approved" label={r.checkinTime} />
                  ) : (
                    <StatusDot status="cancelled" label="미체크인" />
                  )}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <StatusDot
                    status={r.payStatus}
                    label={PAY_LABEL[r.payStatus] || r.payStatus}
                  />
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <StatusDot
                    status={r.status}
                    label={STATUS_LABEL[r.status] || r.status}
                  />
                </td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({ type: "detail", item: r });
                      }}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 5,
                        border: "1px solid #E2E8F0",
                        background: "#F8FAFC",
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({ type: "delete", item: r });
                      }}
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
            <Users size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
              참가자가 없습니다
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
          title="참가자 삭제"
          msg={`"${modal.item.name}" 참가자를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
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
    </>
  );
}

/* ═══════════════════════════════════════════
   서브탭: 체크인 관리
   ═══════════════════════════════════════════ */
function TabCheckin({ items }) {
  const total = items.filter((e) => e._visible).length;
  const checked = items.filter((e) => e._visible && e.checkedIn).length;
  const checkins = DATA.checkins || [];

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatCard icon={Users} label="전체 참가자" value={total} />
        <StatCard
          icon={UserCheck}
          label="체크인 완료"
          value={checked}
          sub={`${total ? Math.round((checked / total) * 100) : 0}% 완료`}
        />
        <StatCard icon={Clock} label="미체크인" value={total - checked} />
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
              체크인 내역
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>
              {checkins.length}건
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { icon: QrCode, label: "QR 스캔", c: ds.brand },
              { icon: UserCheck, label: "수동 체크인", c: "#059669" },
            ].map((a) => (
              <button
                key={a.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: `1px solid ${a.c}20`,
                  background: `${a.c}06`,
                  color: a.c,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: ds.ff,
                }}
              >
                <a.icon size={13} /> {a.label}
              </button>
            ))}
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
              {["ID", "참가자", "행사", "방식", "체크인 시간", "게이트"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#94A3B8",
                      textAlign: "left",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {checkins.map((r) => (
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
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    color: "#94A3B8",
                    fontFamily: "monospace",
                  }}
                >
                  {r.participantId}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: ds.ink,
                  }}
                >
                  {r.name}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    color: "#475569",
                  }}
                >
                  {r.event}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <StatusDot
                    status={r.method === "QR" ? "approved" : "pending"}
                    label={r.method}
                  />
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    color: "#475569",
                  }}
                >
                  {r.time}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 12.5,
                    color: "#475569",
                  }}
                >
                  {r.gate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   서브탭: 체험 세션
   ═══════════════════════════════════════════ */
function TabSession() {
  const sessions = DATA.sessionParticipation || [];
  return (
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
          gap: 10,
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 800, color: ds.ink }}>
          체험 세션 참여 이력
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>
          {sessions.length}건
        </span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
            {["참가자", "반려견", "세션", "호출", "시작", "종료", "결과"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 14px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#94A3B8",
                    textAlign: "left",
                  }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {sessions.map((r) => (
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
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: ds.ink,
                }}
              >
                {r.participant}
              </td>
              <td style={{ padding: "10px 14px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12.5,
                    color: "#475569",
                  }}
                >
                  <PawPrint size={11} color="#8B5CF6" />
                  {r.pet}
                </span>
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  fontSize: 12.5,
                  color: "#475569",
                }}
              >
                {r.session}
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  fontSize: 12.5,
                  color: "#475569",
                }}
              >
                {r.callTime}
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  fontSize: 12.5,
                  color: "#475569",
                }}
              >
                {r.startTime || "—"}
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  fontSize: 12.5,
                  color: "#475569",
                }}
              >
                {r.endTime || "—"}
              </td>
              <td style={{ padding: "10px 14px" }}>
                <StatusDot
                  status={
                    r.result === "완료"
                      ? "approved"
                      : r.result === "진행중"
                        ? "pending"
                        : "cancelled"
                  }
                  label={r.result}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════ */
export default function ParticipantList({ subTab = "list" }) {
  const [items, setItems] = useState(() =>
    (DATA.participants || []).map((e) => ({ ...e, _visible: true })),
  );

  return (
    <div>
      <style>{styles}</style>
      {subTab === "list" && <TabList items={items} setItems={setItems} />}
      {subTab === "checkin" && <TabCheckin items={items} />}
      {subTab === "session" && <TabSession />}
    </div>
  );
}
