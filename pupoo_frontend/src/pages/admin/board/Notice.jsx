import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Search,
  ChevronDown,
  AlertTriangle,
  Check,
} from "lucide-react";
import ds from "../shared/designTokens";
import { Pill } from "../shared/Components";
import DATA from "../shared/data";

const styles = `
@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes rowFadeOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-30px)}}
.row-removing{animation:rowFadeOut .3s ease forwards}
.board-row:hover .board-actions{opacity:1}
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
        transition: "all .15s ease",
        flexShrink: 0,
      }}
    >
      {checked && <Check size={size - 6} color="#fff" strokeWidth={3} />}
    </div>
  );
}

/* ── 상세 모달 ── */
function DetailModal({ item, onClose, onEdit, onDelete }) {
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
            공지사항 상세
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
              gap: 8,
              marginBottom: 14,
            }}
          >
            {item.important && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: "#EF4444",
                  display: "inline-block",
                }}
              />
            )}
            <h4
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: ds.ink,
                margin: 0,
              }}
            >
              {item.title}
            </h4>
          </div>
          {[
            { l: "카테고리", v: item.category },
            { l: "작성일", v: item.date },
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
          {item.content && (
            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>
                내용
              </span>
              <p
                style={{
                  fontSize: 13,
                  color: "#475569",
                  lineHeight: 1.65,
                  marginTop: 6,
                }}
              >
                {item.content}
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

/* ── 슬라이드 패널 ── */
function SlidePanel({ item, onSave, onClose, isEdit }) {
  const [form, setForm] = useState(
    item || { title: "", category: "시스템", content: "", important: false },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");
  const handleSave = () => {
    if (!form.title) {
      setErr("제목은 필수입니다.");
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
              {isEdit ? "공지사항 수정" : "새 공지사항"}
            </h3>
            <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "3px 0 0" }}>
              {isEdit
                ? "공지사항을 수정합니다"
                : "새로운 공지사항을 등록합니다"}
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
          <Field label="제목" required>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="공지사항 제목"
            />
          </Field>
          <Field label="카테고리">
            <div style={{ position: "relative" }}>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  paddingRight: 32,
                  cursor: "pointer",
                }}
              >
                {["시스템", "이벤트", "업데이트", "긴급"].map((c) => (
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
          <Field label="내용">
            <textarea
              rows={6}
              style={{ ...inputStyle, resize: "vertical" }}
              value={form.content || ""}
              onChange={(e) => set("content", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="공지사항 내용"
            />
          </Field>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 13,
              color: "#475569",
              fontWeight: 600,
            }}
          >
            <Checkbox
              checked={form.important}
              onChange={() => set("important", !form.important)}
            />
            중요 공지
          </label>
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
   메인 컴포넌트
   ═══════════════════════════════════════════ */
const CATEGORIES = ["전체", "시스템", "이벤트", "업데이트", "긴급"];

export default function Notice() {
  const [items, setItems] = useState(() =>
    DATA.notices.map((e) => ({ ...e, _visible: true })),
  );
  const [modal, setModal] = useState(null);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("전체");

  const rows = items
    .filter((e) => e._visible)
    .filter((e) => filterCat === "전체" || e.category === filterCat)
    .filter((e) => !search || e.title.includes(search));
  const showToast = (msg, type = "success") => setToast({ msg, type });

  const handleCreate = (f) => {
    const d = new Date();
    setItems((p) => [
      {
        ...f,
        id: Math.max(...p.map((x) => x.id)) + 1,
        date: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`,
        _visible: true,
      },
      ...p,
    ]);
    setPanel(null);
    showToast("공지사항이 등록되었습니다.");
  };
  const handleUpdate = (f) => {
    setItems((p) => p.map((e) => (e.id === f.id ? { ...e, ...f } : e)));
    setPanel(null);
    showToast("공지사항이 수정되었습니다.");
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
      showToast("공지사항이 삭제되었습니다.");
    }, 300);
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
        {/* 헤더 */}
        <div
          style={{
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: ds.ink }}>
              공지사항
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>
              총 {rows.length}개
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                style={{
                  padding: "7px 28px 7px 10px",
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  fontSize: 13,
                  fontFamily: ds.ff,
                  color: "#475569",
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer",
                  background: "#fff",
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                color="#94A3B8"
                style={{
                  position: "absolute",
                  right: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
            </div>
            <div style={{ position: "relative" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색어를 입력하세요."
                style={{
                  width: 220,
                  padding: "7px 14px 7px 34px",
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  fontSize: 13,
                  fontFamily: ds.ff,
                  color: ds.ink,
                  outline: "none",
                  transition: "border-color .15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = ds.brand)}
                onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
              />
              <Search
                size={14}
                color="#94A3B8"
                style={{
                  position: "absolute",
                  left: 11,
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
                padding: "7px 14px",
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
              <Plus size={13} strokeWidth={2.5} /> 공지 등록
            </button>
          </div>
        </div>

        {/* 리스트 */}
        {rows.map((r) => (
          <div
            key={r.id}
            className={`board-row ${removing === r.id ? "row-removing" : ""}`}
            onClick={() => setModal({ type: "detail", item: r })}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "14px 20px",
              borderBottom: "1px solid #F8FAFC",
              cursor: "pointer",
              transition: "background .1s",
              position: "relative",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6F8")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {/* 중요 표시 */}
            <div style={{ width: 12, flexShrink: 0 }}>
              {r.important && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: "#EF4444",
                    display: "inline-block",
                  }}
                />
              )}
            </div>

            {/* 카테고리 */}
            <span style={{ flexShrink: 0, marginRight: 14 }}>
              <Pill color="#0EA5E9" bg="#0EA5E910">
                {r.category}
              </Pill>
            </span>

            {/* 제목 */}
            <span
              style={{
                flex: 1,
                fontSize: 13.5,
                color: "#475569",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.title}
            </span>

            {/* 날짜 */}
            <span
              style={{
                fontSize: 13,
                color: "#94A3B8",
                flexShrink: 0,
                minWidth: 80,
                textAlign: "right",
              }}
            >
              {r.date}
            </span>

            {/* 호버 액션 */}
            <div
              className="board-actions"
              style={{
                opacity: 0,
                transition: "opacity .12s",
                display: "flex",
                gap: 3,
                marginLeft: 10,
                flexShrink: 0,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPanel({ type: "edit", item: r });
                }}
                style={{
                  padding: "3px 8px",
                  borderRadius: 5,
                  border: `1px solid ${ds.brand}25`,
                  background: `${ds.brand}06`,
                  fontSize: 11,
                  fontWeight: 600,
                  color: ds.brand,
                  cursor: "pointer",
                  fontFamily: ds.ff,
                  lineHeight: 1.2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${ds.brand}12`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${ds.brand}06`;
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
                  padding: "3px 8px",
                  borderRadius: 5,
                  border: "1px solid #FECACA50",
                  background: "transparent",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#EF4444",
                  cursor: "pointer",
                  fontFamily: ds.ff,
                  lineHeight: 1.2,
                  opacity: 0.7,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FEF2F2";
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.opacity = "0.7";
                }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Search size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#64748B",
                marginBottom: 4,
              }}
            >
              공지사항이 없습니다
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
          title="공지사항 삭제"
          msg={`"${modal.item.title}" 공지사항을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
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
