import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import ds, { statusMap } from "../shared/designTokens";
import { Pill, DataTable, Td } from "../shared/Components";
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
          width: 520,
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

/* ── 폼 모달 ── */
function FormModal({ item, onSave, onClose, isEdit }) {
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
  const save = () => {
    if (!form.name || !form.operator) {
      setErr("체험존명과 운영자는 필수입니다.");
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
            {isEdit ? "체험존 수정" : "새 체험존 등록"}
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
        <Field label="체험존명" required>
          <input
            style={iS}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            onFocus={focus}
            onBlur={blur}
            placeholder="예: 반려견 놀이터"
          />
        </Field>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field label="유형" required>
            <div style={{ position: "relative" }}>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                style={{
                  ...iS,
                  appearance: "none",
                  paddingRight: 32,
                  cursor: "pointer",
                  background: "#fff",
                }}
              >
                {["체험", "포토", "의료", "공연", "푸드"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
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
          <Field label="수용 인원">
            <input
              type="number"
              style={iS}
              value={form.capacity}
              onChange={(e) => set("capacity", +e.target.value)}
              onFocus={focus}
              onBlur={blur}
            />
          </Field>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field label="운영자" required>
            <input
              style={iS}
              value={form.operator}
              onChange={(e) => set("operator", e.target.value)}
              onFocus={focus}
              onBlur={blur}
              placeholder="담당자명"
            />
          </Field>
          <Field label="상태">
            <div style={{ position: "relative" }}>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                style={{
                  ...iS,
                  appearance: "none",
                  paddingRight: 32,
                  cursor: "pointer",
                  background: "#fff",
                }}
              >
                <option value="pending">대기</option>
                <option value="active">운영 중</option>
                <option value="ended">종료</option>
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
        </div>
        <Field label="설명">
          <textarea
            rows={3}
            style={{ ...iS, resize: "vertical" }}
            value={form.description || ""}
            onChange={(e) => set("description", e.target.value)}
            onFocus={focus}
            onBlur={blur}
            placeholder="체험존 설명"
          />
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
  const st = statusMap[item.status];
  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3
            style={{ fontSize: 17, fontWeight: 800, color: ds.ink, margin: 0 }}
          >
            체험존 상세
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
        <div
          style={{
            background: ds.bg,
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
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: ds.ink4,
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
              fontSize: 18,
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
                borderBottom: `1px solid ${ds.line}`,
              }}
            >
              <span style={{ fontSize: 13, color: ds.ink3 }}>{r.l}</span>
              <span style={{ fontSize: 13, color: ds.ink, fontWeight: 600 }}>
                {r.v}
              </span>
            </div>
          ))}
          {item.description && (
            <p
              style={{
                fontSize: 13,
                color: ds.ink2,
                lineHeight: 1.6,
                marginTop: 14,
              }}
            >
              {item.description}
            </p>
          )}
        </div>
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
    </Overlay>
  );
}

/* ═══════════════════════════════════════════════ */
export default function ZoneManage() {
  const [items, setItems] = useState(() =>
    DATA.zoneManage.map((e) => ({ ...e, _visible: true })),
  );
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [removing, setRemoving] = useState(null);
  const rows = items.filter((e) => e._visible);
  const show = (msg, type = "success") => setToast({ msg, type });

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
    setModal(null);
    show("새 체험존이 등록되었습니다.");
  };
  const handleUpdate = (f) => {
    setItems((p) => p.map((e) => (e.id === f.id ? { ...e, ...f } : e)));
    setModal(null);
    show("체험존이 수정되었습니다.");
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
      show("체험존이 삭제되었습니다.");
    }, 300);
  };

  const cols = [
    { label: "" },
    { label: "ID" },
    { label: "체험존명" },
    { label: "유형" },
    { label: "수용 인원", align: "right" },
    { label: "운영자" },
    { label: "등록일" },
    { label: "상태" },
    { label: "" },
  ];

  return (
    <div>
      <style>{`@keyframes rowFadeOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-30px)}} .row-removing{animation:rowFadeOut .3s ease forwards;}`}</style>
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
          <Plus size={16} strokeWidth={2.5} /> 체험존 등록
        </button>
      </div>
      <DataTable
        title="체험존 목록"
        count={rows.length}
        columns={cols}
        rows={rows}
        renderRow={(r) => {
          const st = statusMap[r.status];
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
              <Td>
                <Pill color={ds.sky} bg={ds.skySoft}>
                  {r.type}
                </Pill>
              </Td>
              <Td align="right">{r.capacity}명</Td>
              <Td>{r.operator}</Td>
              <Td>{r.date}</Td>
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
          title="체험존 삭제"
          msg={`"${modal.item.name}" 체험존을 삭제하시겠습니까?`}
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
