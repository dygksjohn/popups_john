import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  Layers,
  Users,
  Clock,
  UserCheck,
  AlertTriangle,
  Check,
} from "lucide-react";
import ds, { statusMap } from "../shared/designTokens";
import { Pill } from "../shared/Components";
import DATA from "../shared/data";

/* ═══════════════════════════════════════════
   전역 스타일
   ═══════════════════════════════════════════ */
const styles = `
@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes rowFadeOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-30px)}}
.row-removing{animation:rowFadeOut .3s ease forwards}
`;

/* ═══════════════════════════════════════════
   체크박스
   ═══════════════════════════════════════════ */
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
        transition: "all .15s ease",
        flexShrink: 0,
      }}
    >
      {checked && <Check size={size - 6} color="#fff" strokeWidth={3} />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   토스트
   ═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   오버레이 / 확인 모달
   ═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   입력 필드
   ═══════════════════════════════════════════ */
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
          letterSpacing: 0.2,
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

/* ═══════════════════════════════════════════
   슬라이드 패널 (등록 / 수정)
   ═══════════════════════════════════════════ */
function SlidePanel({ item, onSave, onClose, isEdit }) {
  const [form, setForm] = useState(
    item || {
      name: "",
      type: "체험",
      capacity: 100,
      operator: "",
      date: "",
      status: "pending",
      description: "",
    },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");

  const handleSave = () => {
    if (!form.name || !form.operator) {
      setErr("체험존명과 운영자는 필수입니다.");
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
              {isEdit ? "체험존 수정" : "새 체험존 등록"}
            </h3>
            <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "3px 0 0" }}>
              {isEdit
                ? "체험존 정보를 수정합니다"
                : "새로운 체험존을 등록합니다"}
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

          <Field label="체험존명" required>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="예: 어질리티 체험"
            />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
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
                  {["체험", "전시", "교육", "휴게", "판매"].map((c) => (
                    <option key={c} value={c}>
                      {c}
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
            <Field label="수용 인원">
              <input
                type="number"
                style={inputStyle}
                value={form.capacity}
                onChange={(e) => set("capacity", +e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </Field>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="운영자" required>
              <input
                style={inputStyle}
                value={form.operator}
                onChange={(e) => set("operator", e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="운영자명"
              />
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
                  <option value="pending">대기</option>
                  <option value="active">운영 중</option>
                  <option value="ended">종료</option>
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
   상세 모달
   ═══════════════════════════════════════════ */
function DetailModal({ item, onClose, onEdit, onDelete }) {
  const st = statusMap[item.status];
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
              {item.id}
            </span>
            <Pill color={st.c} bg={st.bg}>
              {st.l}
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
            {item.name}
          </h4>
          {[
            { l: "유형", v: item.type },
            { l: "수용 인원", v: `${item.capacity}명` },
            { l: "운영자", v: item.operator },
            { l: "등록일", v: item.date },
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
              <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>
                {r.l}
              </span>
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

/* ═══════════════════════════════════════════
   요약 통계 카드
   ═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════ */
export default function ZoneManage() {
  const [items, setItems] = useState(() =>
    DATA.zoneManage.map((e) => ({ ...e, _visible: true })),
  );
  const [modal, setModal] = useState(null);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const rows = items.filter((e) => e._visible);
  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* 통계 */
  const totalZones = rows.length;
  const activeZones = rows.filter((e) => e.status === "active").length;
  const totalCapacity = rows.reduce((a, b) => a + b.capacity, 0);
  const pendingZones = rows.filter((e) => e.status === "pending").length;

  /* 선택 */
  const isAllSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id));
  const hasSelected = selected.size > 0;
  const toggleAll = () => {
    if (isAllSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };
  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* CRUD */
  const handleCreate = (f) => {
    const d = new Date();
    setItems((p) => [
      {
        ...f,
        id: `ZN-${String(p.length + 1).padStart(3, "0")}`,
        date: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`,
        _visible: true,
      },
      ...p,
    ]);
    setPanel(null);
    showToast("새 체험존이 등록되었습니다.");
  };
  const handleUpdate = (f) => {
    setItems((p) => p.map((e) => (e.id === f.id ? { ...e, ...f } : e)));
    setPanel(null);
    showToast("체험존이 수정되었습니다.");
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
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      showToast("체험존이 삭제되었습니다.");
    }, 300);
  };
  const handleBulkDelete = () => {
    const ids = new Set(selected);
    setModal(null);
    setItems((p) =>
      p.map((e) => (ids.has(e.id) ? { ...e, _visible: false } : e)),
    );
    setSelected(new Set());
    showToast(`${ids.size}건의 체험존이 삭제되었습니다.`);
  };
  const handleDeleteAll = () => {
    setModal(null);
    const ids = new Set(rows.map((r) => r.id));
    setItems((p) =>
      p.map((e) => (ids.has(e.id) ? { ...e, _visible: false } : e)),
    );
    setSelected(new Set());
    showToast(`${ids.size}건의 체험존이 삭제되었습니다.`);
  };

  return (
    <div>
      <style>{styles}</style>

      {/* ── 상단 통계 ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatCard
          icon={Layers}
          label="전체 체험존"
          value={totalZones}
          color={ds.brand}
        />
        <StatCard
          icon={Clock}
          label="운영 중"
          value={activeZones}
          color="#10B981"
        />
        <StatCard
          icon={Users}
          label="총 수용 인원"
          value={totalCapacity}
          color="#8B5CF6"
        />
        <StatCard
          icon={UserCheck}
          label="대기 중"
          value={pendingZones}
          color="#F59E0B"
        />
      </div>

      {/* ── 테이블 카드 ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #F1F5F9",
          overflow: "hidden",
        }}
      >
        {/* 헤더 바 */}
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
                  animation: "fadeIn .15s ease",
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
                  animation: "fadeIn .15s ease",
                }}
              >
                <Trash2 size={12} /> 선택 삭제 ({selected.size})
              </button>
            )}
            {hasSelected && rows.length > 0 && (
              <button
                onClick={() => setModal({ type: "deleteAll" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: "1px solid #E2E8F0",
                  background: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#64748B",
                  cursor: "pointer",
                  fontFamily: ds.ff,
                  transition: "all .1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#FECACA";
                  e.currentTarget.style.color = "#DC2626";
                  e.currentTarget.style.background = "#FEF2F2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.color = "#64748B";
                  e.currentTarget.style.background = "#fff";
                }}
              >
                <Trash2 size={12} /> 전체 삭제
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
                transition: "transform .1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-1px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <Plus size={13} strokeWidth={2.5} /> 체험존 등록
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
              <th style={{ width: 44, padding: "10px 14px" }}>
                <Checkbox checked={isAllSelected} onChange={toggleAll} />
              </th>
              {[
                { label: "체험존명", w: "26%" },
                { label: "유형", w: 90 },
                { label: "수용 인원", w: 90, align: "right" },
                { label: "운영자", w: 110 },
                { label: "등록일", w: 100 },
                { label: "상태", w: 72 },
                { label: "", w: 150 },
              ].map((c, i) => (
                <th
                  key={i}
                  style={{
                    padding: "10px 14px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#94A3B8",
                    textAlign: c.align || "left",
                    letterSpacing: 0.3,
                    ...(c.w ? { width: c.w } : {}),
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = statusMap[r.status];
              const isRemoving = removing === r.id;
              const isChecked = selected.has(r.id);
              return (
                <tr
                  key={r.id}
                  className={isRemoving ? "row-removing" : ""}
                  onClick={() => setModal({ type: "detail", item: r })}
                  style={{
                    borderBottom: "1px solid #F8FAFC",
                    cursor: "pointer",
                    transition: "background .1s",
                    background: isChecked ? `${ds.brand}06` : "transparent",
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
                      style={{ fontSize: 13, fontWeight: 700, color: ds.ink }}
                    >
                      {r.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#94A3B8",
                        fontFamily: "monospace",
                        marginTop: 1,
                      }}
                    >
                      {r.id}
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <Pill color="#0EA5E9" bg="#0EA5E910">
                      {r.type}
                    </Pill>
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
                    {r.capacity}명
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      fontSize: 13,
                      color: "#475569",
                    }}
                  >
                    {r.operator}
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      fontSize: 13,
                      color: "#475569",
                    }}
                  >
                    {r.date}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <Pill color={st.c} bg={st.bg}>
                      {st.l}
                    </Pill>
                  </td>
                  <td style={{ padding: "11px 10px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 3 }}
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
                          transition: "all .12s",
                          lineHeight: 1.2,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#F1F5F9";
                          e.currentTarget.style.borderColor = "#CBD5E1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.borderColor = "#E2E8F0";
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
                          border: `1px solid ${ds.brand}25`,
                          background: `${ds.brand}06`,
                          fontSize: 11,
                          fontWeight: 600,
                          color: ds.brand,
                          cursor: "pointer",
                          fontFamily: ds.ff,
                          transition: "all .12s",
                          lineHeight: 1.2,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${ds.brand}12`;
                          e.currentTarget.style.borderColor = `${ds.brand}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${ds.brand}06`;
                          e.currentTarget.style.borderColor = `${ds.brand}25`;
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
                          border: "1px solid #FECACA50",
                          background: "#FEF2F208",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#EF4444",
                          cursor: "pointer",
                          fontFamily: ds.ff,
                          transition: "all .12s",
                          lineHeight: 1.2,
                          opacity: 0.7,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FEF2F2";
                          e.currentTarget.style.borderColor = "#FECACA";
                          e.currentTarget.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#FEF2F208";
                          e.currentTarget.style.borderColor = "#FECACA50";
                          e.currentTarget.style.opacity = "0.7";
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Layers size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#64748B",
                marginBottom: 4,
              }}
            >
              등록된 체험존이 없습니다
            </div>
            <div style={{ fontSize: 12.5, color: "#94A3B8" }}>
              새 체험존을 등록해보세요
            </div>
          </div>
        )}
      </div>

      {/* 슬라이드 패널 */}
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

      {/* 모달 */}
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
          title="체험존 삭제"
          msg={`"${modal.item.name}" 체험존을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === "bulkDelete" && (
        <ConfirmModal
          title="선택 체험존 삭제"
          msg={`선택한 ${selected.size}건의 체험존을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === "deleteAll" && (
        <ConfirmModal
          title="전체 체험존 삭제"
          msg={`현재 목록의 ${rows.length}건 체험존을 모두 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
          onConfirm={handleDeleteAll}
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
