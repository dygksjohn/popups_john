import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  PawPrint,
  ChevronDown,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  CreditCard,
  QrCode,
  Check,
  Clock,
} from "lucide-react";
import ds, { cardStyle, statusMap } from "../shared/designTokens";
import { Pill, DataTable, Td, Bar2 } from "../shared/Components";
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
          width: 600,
          maxHeight: "88vh",
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

/* ── 미니 KPI 카드 ── */
function Kpi({ label, value, sub, color }) {
  return (
    <div style={{ ...cardStyle, padding: "16px 18px" }}>
      <div
        style={{
          fontSize: 11.5,
          color: ds.ink4,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: ds.ink4, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

function ActionMenu({ onEdit, onDelete, onDetail }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const c = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", c);
    return () => document.removeEventListener("mousedown", c);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MoreHorizontal size={16} color={ds.ink4} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 4,
            zIndex: 100,
            background: "#fff",
            borderRadius: 10,
            border: `1px solid ${ds.line}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 130,
            overflow: "hidden",
            animation: "fadeIn .12s ease",
          }}
        >
          {[
            { label: "상세보기", icon: Eye, color: ds.ink2, fn: onDetail },
            { label: "수정하기", icon: Pencil, color: ds.brand, fn: onEdit },
            { label: "삭제", icon: Trash2, color: "#EF4444", fn: onDelete },
          ].map((a) => (
            <button
              key={a.label}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                a.fn();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                border: "none",
                background: "none",
                fontSize: 13,
                fontWeight: 600,
                color: a.color,
                cursor: "pointer",
                fontFamily: ds.ff,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ds.bg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <a.icon size={14} /> {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 참가자 상세 모달 ── */
function DetailModal({ item, onClose, onEdit, onDelete }) {
  const st = statusMap[item.status];
  const ps = statusMap[item.payStatus] || {
    c: ds.ink4,
    bg: ds.lineSoft,
    l: item.payStatus,
  };
  const sessions = DATA.sessionParticipation.filter(
    (s) => s.participant === item.name,
  );

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: 0, overflow: "hidden" }}>
        {/* 헤더 */}
        <div
          style={{
            background: `linear-gradient(135deg, ${ds.brandSoft}, ${ds.violetSoft})`,
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 800,
              color: ds.brand,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {item.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: ds.ink }}>
              {item.name}
            </div>
            <div style={{ fontSize: 12, color: ds.ink3, marginTop: 3 }}>
              {item.id} · {item.event}
            </div>
          </div>
          <Pill color={st.c} bg={st.bg}>
            {st.l}
          </Pill>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "none",
              background: "rgba(0,0,0,0.06)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} color={ds.ink3} />
          </button>
        </div>

        <div style={{ padding: "20px 28px 24px" }}>
          {/* 정보 그리드 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {[
              { icon: Phone, label: "연락처", value: item.phone },
              { icon: Mail, label: "이메일", value: item.email },
              {
                icon: PawPrint,
                label: "반려견",
                value: `${item.petName} (${item.petBreed}, ${item.petAge})`,
              },
              { icon: Calendar, label: "등록일", value: item.regDate },
              {
                icon: UserCheck,
                label: "체크인",
                value: item.checkedIn ? `${item.checkinTime} 완료` : "미체크인",
              },
              {
                icon: CreditCard,
                label: "결제",
                value: `${item.amount.toLocaleString()}원 (${item.payMethod})`,
              },
            ].map((x) => (
              <div
                key={x.label}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: ds.bg,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <x.icon
                  size={14}
                  color={ds.ink4}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <div>
                  <div
                    style={{ fontSize: 10.5, color: ds.ink4, marginBottom: 2 }}
                  >
                    {x.label}
                  </div>
                  <div
                    style={{ fontSize: 12.5, fontWeight: 600, color: ds.ink }}
                  >
                    {x.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 신청 상태 & 결제 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: `1px solid ${ds.line}`,
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  color: ds.ink4,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                신청 상태
              </div>
              <Pill color={st.c} bg={st.bg}>
                {st.l}
              </Pill>
            </div>
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: `1px solid ${ds.line}`,
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  color: ds.ink4,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                결제 상태
              </div>
              <Pill color={ps.c} bg={ps.bg}>
                {ps.l}
              </Pill>
            </div>
          </div>

          {/* 참여 이력 */}
          {sessions.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: ds.ink,
                  marginBottom: 10,
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
                    padding: "10px 0",
                    borderBottom: `1px solid ${ds.lineSoft}`,
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 12.5, fontWeight: 600, color: ds.ink }}
                    >
                      {s.session}
                    </div>
                    <div style={{ fontSize: 11, color: ds.ink4 }}>
                      {s.pet} · {s.callTime}
                    </div>
                  </div>
                  <Pill
                    color={
                      s.result === "완료"
                        ? "#059669"
                        : s.result === "진행중"
                          ? ds.brand
                          : ds.amber
                    }
                    bg={
                      s.result === "완료"
                        ? ds.greenSoft
                        : s.result === "진행중"
                          ? ds.brandSoft
                          : ds.amberSoft
                    }
                  >
                    {s.result}
                  </Pill>
                </div>
              ))}
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

/* ── 폼 모달 ── */
function FormModal({ item, onSave, onClose, isEdit }) {
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
  const save = () => {
    if (!form.name || !form.phone) {
      setErr("이름과 연락처는 필수입니다.");
      return;
    }
    onSave(form);
  };
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
            {isEdit ? "참가자 수정" : "새 참가자 등록"}
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
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field label="이름" required>
            <input
              style={iS}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onFocus={focus}
              onBlur={blur}
              placeholder="참가자명"
            />
          </Field>
          <Field label="연락처" required>
            <input
              style={iS}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              onFocus={focus}
              onBlur={blur}
              placeholder="010-0000-0000"
            />
          </Field>
        </div>
        <Field label="이메일">
          <input
            style={iS}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            onFocus={focus}
            onBlur={blur}
            placeholder="email@example.com"
          />
        </Field>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 14,
          }}
        >
          <Field label="반려견 이름">
            <input
              style={iS}
              value={form.petName}
              onChange={(e) => set("petName", e.target.value)}
              onFocus={focus}
              onBlur={blur}
              placeholder="몽이"
            />
          </Field>
          <Field label="견종">
            <input
              style={iS}
              value={form.petBreed}
              onChange={(e) => set("petBreed", e.target.value)}
              onFocus={focus}
              onBlur={blur}
              placeholder="말티즈"
            />
          </Field>
          <Field label="나이">
            <input
              style={iS}
              value={form.petAge}
              onChange={(e) => set("petAge", e.target.value)}
              onFocus={focus}
              onBlur={blur}
              placeholder="3살"
            />
          </Field>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field label="행사">
            <input
              style={iS}
              value={form.event}
              onChange={(e) => set("event", e.target.value)}
              onFocus={focus}
              onBlur={blur}
            />
          </Field>
          <Field label="참가비">
            <input
              type="number"
              style={iS}
              value={form.amount}
              onChange={(e) => set("amount", +e.target.value)}
              onFocus={focus}
              onBlur={blur}
            />
          </Field>
        </div>
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

/* ═══════════════════════════════════════════════
   서브탭: 참가자 목록
   ═══════════════════════════════════════════════ */
function TabList({
  items,
  modal,
  setModal,
  removing,
  show,
  setItems,
  setRemoving,
}) {
  const total = items.length;
  const approved = items.filter((p) => p.status === "approved").length;
  const checked = items.filter((p) => p.checkedIn).length;

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
    setModal(null);
    show("참가자가 등록되었습니다.");
  };
  const handleUpdate = (f) => {
    setItems((p) => p.map((e) => (e.id === f.id ? { ...e, ...f } : e)));
    setModal(null);
    show("참가자 정보가 수정되었습니다.");
  };
  const handleDelete = () => {
    const id = modal.item.id;
    setModal(null);
    setRemoving(id);
    setTimeout(() => {
      setItems((p) =>
        p.map((e) => (e.id === id ? { ...e, _visible: false } : e)),
      );
      setRemoving(null);
      show("참가자가 삭제되었습니다.");
    }, 300);
  };

  const rows = items.filter((e) => e._visible);
  const cols = [
    { label: "" },
    { label: "ID" },
    { label: "이름" },
    { label: "연락처" },
    { label: "행사" },
    { label: "반려견" },
    { label: "체크인" },
    { label: "결제" },
    { label: "상태" },
    { label: "" },
  ];

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <Kpi label="전체 참가자" value={total} color={ds.brand} />
        <Kpi label="승인 완료" value={approved} color={ds.green} />
        <Kpi
          label="체크인 완료"
          value={checked}
          sub={`${total ? Math.round((checked / total) * 100) : 0}%`}
          color={ds.violet}
        />
        <Kpi label="대기 중" value={total - approved} color={ds.amber} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 14,
        }}
      >
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
          <Plus size={16} strokeWidth={2.5} /> 참가자 등록
        </button>
      </div>
      <DataTable
        title="참가자 목록"
        count={rows.length}
        columns={cols}
        rows={rows}
        renderRow={(r) => {
          const st = statusMap[r.status] || statusMap.approved;
          const ps = statusMap[r.payStatus] || statusMap.paid;
          return (
            <tr
              key={r.id}
              className={removing === r.id ? "row-removing" : ""}
              onClick={() => setModal({ type: "detail", item: r })}
              style={{
                borderBottom: `1px solid ${ds.lineSoft}`,
                cursor: "pointer",
                transition: "background .1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(67,97,238,0.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Td>
                <input
                  type="checkbox"
                  style={{ accentColor: ds.brand }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Td>
              <Td mono>{r.id}</Td>
              <Td bold>{r.name}</Td>
              <Td>{r.phone}</Td>
              <Td>{r.event}</Td>
              <Td>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <PawPrint size={11} color={ds.violet} />
                  {r.petName} ({r.petBreed})
                </span>
              </Td>
              <Td>
                {r.checkedIn ? (
                  <Pill color="#059669" bg={ds.greenSoft}>
                    ✓ {r.checkinTime}
                  </Pill>
                ) : (
                  <Pill color={ds.ink4} bg={ds.lineSoft}>
                    미체크인
                  </Pill>
                )}
              </Td>
              <Td>
                <Pill color={ps.c} bg={ps.bg}>
                  {ps.l}
                </Pill>
              </Td>
              <Td>
                <Pill color={st.c} bg={st.bg}>
                  {st.l}
                </Pill>
              </Td>
              <Td>
                <ActionMenu
                  onDetail={() => setModal({ type: "detail", item: r })}
                  onEdit={() => setModal({ type: "edit", item: r })}
                  onDelete={() => setModal({ type: "delete", item: r })}
                />
              </Td>
            </tr>
          );
        }}
      />
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
          title="참가자 삭제"
          msg={`"${modal.item.name}" 참가자를 삭제하시겠습니까?`}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════
   서브탭: 체크인 관리
   ═══════════════════════════════════════════════ */
function TabCheckin({ items }) {
  const total = items.length;
  const checked = items.filter((p) => p.checkedIn).length;
  const cols = [
    { label: "ID" },
    { label: "참가자" },
    { label: "행사" },
    { label: "방식" },
    { label: "체크인 시간" },
    { label: "게이트" },
  ];

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <Kpi label="전체 참가자" value={total} color={ds.brand} />
        <Kpi
          label="체크인 완료"
          value={checked}
          sub={`${total ? Math.round((checked / total) * 100) : 0}% 완료`}
          color={ds.green}
        />
        <Kpi label="미체크인" value={total - checked} color={ds.red} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { icon: QrCode, label: "QR 스캔", c: ds.brand, b: ds.brandSoft },
          {
            icon: UserCheck,
            label: "수동 체크인",
            c: "#059669",
            b: ds.greenSoft,
          },
        ].map((a) => (
          <button
            key={a.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${a.c}22`,
              background: a.b,
              color: a.c,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            <a.icon size={14} /> {a.label}
          </button>
        ))}
      </div>
      <DataTable
        title="체크인 내역"
        count={DATA.checkins.length}
        columns={cols}
        rows={DATA.checkins}
        renderRow={(r) => (
          <tr
            key={r.id}
            style={{
              borderBottom: `1px solid ${ds.lineSoft}`,
              transition: "background .1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = ds.bg)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Td mono>{r.participantId}</Td>
            <Td bold>{r.name}</Td>
            <Td>{r.event}</Td>
            <Td>
              <Pill
                color={r.method === "QR" ? ds.brand : ds.amber}
                bg={r.method === "QR" ? ds.brandSoft : ds.amberSoft}
              >
                {r.method}
              </Pill>
            </Td>
            <Td>{r.time}</Td>
            <Td>{r.gate}</Td>
          </tr>
        )}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════
   서브탭: 체험 세션 참여
   ═══════════════════════════════════════════════ */
function TabSession() {
  const cols = [
    { label: "참가자" },
    { label: "반려견" },
    { label: "세션" },
    { label: "호출" },
    { label: "시작" },
    { label: "종료" },
    { label: "결과" },
  ];
  return (
    <DataTable
      title="체험 세션 참여 이력"
      count={DATA.sessionParticipation.length}
      columns={cols}
      rows={DATA.sessionParticipation}
      renderRow={(r) => (
        <tr
          key={r.id}
          style={{
            borderBottom: `1px solid ${ds.lineSoft}`,
            transition: "background .1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = ds.bg)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <Td bold>{r.participant}</Td>
          <Td>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <PawPrint size={11} color={ds.violet} />
              {r.pet}
            </span>
          </Td>
          <Td>{r.session}</Td>
          <Td>{r.callTime}</Td>
          <Td>{r.startTime || "—"}</Td>
          <Td>{r.endTime || "—"}</Td>
          <Td>
            <Pill
              color={
                r.result === "완료"
                  ? "#059669"
                  : r.result === "진행중"
                    ? ds.brand
                    : ds.amber
              }
              bg={
                r.result === "완료"
                  ? ds.greenSoft
                  : r.result === "진행중"
                    ? ds.brandSoft
                    : ds.amberSoft
              }
            >
              {r.result}
            </Pill>
          </Td>
        </tr>
      )}
    />
  );
}

/* ═══════════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════════ */
export default function ParticipantList() {
  const [items, setItems] = useState(() =>
    DATA.participants.map((e) => ({ ...e, _visible: true })),
  );
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [subTab, setSubTab] = useState("list");
  const show = (msg, type = "success") => setToast({ msg, type });

  const tabs = [
    {
      id: "list",
      label: "참가자 목록",
      count: items.filter((e) => e._visible).length,
    },
    { id: "checkin", label: "체크인 관리", count: DATA.checkins.length },
    {
      id: "session",
      label: "체험 세션 참여",
      count: DATA.sessionParticipation.length,
    },
  ];

  return (
    <div>
      <style>{`@keyframes rowFadeOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-30px)}} .row-removing{animation:rowFadeOut .3s ease forwards;}`}</style>

      {/* 서브 탭 */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: `2px solid ${ds.lineSoft}`,
          marginBottom: 20,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding: "10px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: subTab === t.id ? 700 : 500,
              fontFamily: ds.ff,
              color: subTab === t.id ? ds.brand : ds.ink4,
              borderBottom:
                subTab === t.id
                  ? `2px solid ${ds.brand}`
                  : "2px solid transparent",
              marginBottom: -2,
              transition: "all .15s",
            }}
          >
            {t.label}
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: 8,
                background: subTab === t.id ? ds.brandSoft : ds.lineSoft,
                color: subTab === t.id ? ds.brand : ds.ink4,
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {subTab === "list" && (
        <TabList
          items={items}
          modal={modal}
          setModal={setModal}
          removing={removing}
          show={show}
          setItems={setItems}
          setRemoving={setRemoving}
        />
      )}
      {subTab === "checkin" && <TabCheckin items={items} />}
      {subTab === "session" && <TabSession />}

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
