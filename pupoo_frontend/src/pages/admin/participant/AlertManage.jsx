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
} from "lucide-react";
import ds, { cardStyle, statusMap } from "../shared/designTokens";
import { Pill, DataTable, Td } from "../shared/Components";
import DATA from "../shared/data";

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

/* ── KPI 카드 ── */
function KpiCard({ icon: I, label, value, sub, color, bg }) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <I size={20} color={color} strokeWidth={2} />
      </div>
      <div>
        <div
          style={{
            fontSize: 11.5,
            color: ds.ink4,
            fontWeight: 600,
            marginBottom: 3,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: ds.ink }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: ds.ink4, marginTop: 2 }}>
            {sub}
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
      content: "",
      target: "전체",
      targetCount: 0,
      status: "draft",
    },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");
  const targets = { 전체: 234, 미체크인: 56, 체크인완료: 178, 미결제: 12 };
  const save = () => {
    if (!form.title || !form.content) {
      setErr("제목과 내용은 필수입니다.");
      return;
    }
    onSave({ ...form, targetCount: targets[form.target] || 0 });
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
            {isEdit ? "알림 수정" : "새 알림 작성"}
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
            placeholder="알림 제목"
          />
        </Field>
        <Field label="발송 대상">
          <div style={{ position: "relative" }}>
            <select
              value={form.target}
              onChange={(e) => set("target", e.target.value)}
              style={{
                ...iS,
                appearance: "none",
                paddingRight: 32,
                cursor: "pointer",
                background: "#fff",
              }}
            >
              {Object.keys(targets).map((t) => (
                <option key={t} value={t}>
                  {t} ({targets[t]}명)
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
        <Field label="내용" required>
          <textarea
            rows={4}
            style={{ ...iS, resize: "vertical" }}
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            onFocus={focus}
            onBlur={blur}
            placeholder="알림 내용을 입력하세요"
          />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
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
            {isEdit ? "수정 완료" : "저장하기"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export default function AlertManage() {
  const [items, setItems] = useState(() =>
    DATA.alertHistory.map((e) => ({ ...e, _visible: true })),
  );
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [removing, setRemoving] = useState(null);
  const show = (msg, type = "success") => setToast({ msg, type });

  const sent = items.filter((e) => e._visible && e.status === "sent").length;
  const draft = items.filter((e) => e._visible && e.status === "draft").length;
  const totalTarget = items
    .filter((e) => e._visible && e.status === "sent")
    .reduce((a, b) => a + b.targetCount, 0);

  const handleCreate = (f) => {
    setItems((p) => [
      {
        ...f,
        id: `AL-${String(p.length + 1).padStart(3, "0")}`,
        sentDate: null,
        _visible: true,
      },
      ...p,
    ]);
    setModal(null);
    show("알림이 저장되었습니다.");
  };
  const handleUpdate = (f) => {
    setItems((p) => p.map((e) => (e.id === f.id ? { ...e, ...f } : e)));
    setModal(null);
    show("알림이 수정되었습니다.");
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
      show("알림이 삭제되었습니다.");
    }, 300);
  };
  const handleSend = (id) => {
    const d = new Date();
    setItems((p) =>
      p.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "sent",
              sentDate: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`,
            }
          : e,
      ),
    );
    show("알림이 발송되었습니다.");
  };

  const rows = items.filter((e) => e._visible);
  const cols = [
    { label: "" },
    { label: "제목" },
    { label: "내용" },
    { label: "대상" },
    { label: "대상자수", align: "right" },
    { label: "발송일" },
    { label: "상태" },
    { label: "" },
  ];

  return (
    <div>
      <style>{`@keyframes rowFadeOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-30px)}} .row-removing{animation:rowFadeOut .3s ease forwards;}`}</style>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <KpiCard
          icon={Send}
          label="발송 완료"
          value={`${sent}건`}
          color={ds.green}
          bg={ds.greenSoft}
        />
        <KpiCard
          icon={Mail}
          label="임시 저장"
          value={`${draft}건`}
          color={ds.amber}
          bg={ds.amberSoft}
        />
        <KpiCard
          icon={Users}
          label="총 발송 대상"
          value={`${totalTarget.toLocaleString()}명`}
          color={ds.brand}
          bg={ds.brandSoft}
        />
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
          <Plus size={16} strokeWidth={2.5} /> 알림 작성
        </button>
      </div>

      <DataTable
        title="알림 발송 내역"
        count={rows.length}
        columns={cols}
        rows={rows}
        renderRow={(r) => {
          const st = statusMap[r.status] || {
            c: ds.ink4,
            bg: ds.lineSoft,
            l: r.status,
          };
          return (
            <tr
              key={r.id}
              className={removing === r.id ? "row-removing" : ""}
              style={{
                borderBottom: `1px solid ${ds.lineSoft}`,
                transition: "background .1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ds.bg)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Td>
                <input type="checkbox" style={{ accentColor: ds.brand }} />
              </Td>
              <Td bold>{r.title}</Td>
              <Td>
                <span
                  style={{
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                    fontSize: 12.5,
                    color: ds.ink3,
                  }}
                >
                  {r.content}
                </span>
              </Td>
              <Td>
                <Pill color={ds.sky} bg={ds.skySoft}>
                  {r.target}
                </Pill>
              </Td>
              <Td align="right" bold>
                {r.targetCount}명
              </Td>
              <Td>{r.sentDate || "—"}</Td>
              <Td>
                <Pill color={st.c} bg={st.bg}>
                  {st.l}
                </Pill>
              </Td>
              <Td>
                <div style={{ display: "flex", gap: 4 }}>
                  {r.status === "draft" && (
                    <button
                      onClick={() => handleSend(r.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: `1px solid #05966922`,
                        background: ds.greenSoft,
                        color: "#059669",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: ds.ff,
                      }}
                    >
                      <Send size={11} /> 발송
                    </button>
                  )}
                  <button
                    onClick={() => setModal({ type: "edit", item: r })}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: `1px solid ${ds.line}`,
                      background: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Pencil size={12} color={ds.ink4} />
                  </button>
                  <button
                    onClick={() => setModal({ type: "delete", item: r })}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: `1px solid #FECACA`,
                      background: "#FEF2F2",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Trash2 size={12} color="#DC2626" />
                  </button>
                </div>
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
      {modal?.type === "delete" && (
        <ConfirmModal
          title="알림 삭제"
          msg={`"${modal.item.title}" 알림을 삭제하시겠습니까?`}
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
