import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
  Eye,
} from "lucide-react";
import ds from "../shared/designTokens";
import { adminNoticeApi, unwrap } from "../../../api/noticeApi";

const styles = `
@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes rowFadeOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-30px)}}
@keyframes spin{to{transform:rotate(360deg)}}
.row-removing{animation:rowFadeOut .3s ease forwards}
.board-row:hover .board-actions{opacity:1}
`;

function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

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
function Spinner({ size = 20 }) {
  return (
    <Loader2
      size={size}
      color="#94A3B8"
      style={{ animation: "spin 1s linear infinite" }}
    />
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
            {item.pinned && (
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
            { l: "범위", v: item.scope === "ALL" ? "전체" : "이벤트" },
            { l: "상태", v: item.status || "-" },
            { l: "작성일", v: fmtDate(item.createdAt) },
            { l: "수정일", v: fmtDate(item.updatedAt) },
            { l: "고정공지", v: item.pinned ? "예" : "아니오" },
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
                  whiteSpace: "pre-wrap",
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
function SlidePanel({ item, onSave, onClose, isEdit, saving }) {
  const [form, setForm] = useState(
    item
      ? {
          title: item.title,
          content: item.content || "",
          pinned: item.pinned ?? false,
          scope: item.scope || "ALL",
        }
      : { title: "", content: "", pinned: false, scope: "ALL" },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");

  const handleSave = () => {
    if (!form.title.trim()) {
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
          <Field label="내용">
            <textarea
              rows={6}
              style={{ ...inputStyle, resize: "vertical" }}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="공지사항 내용"
            />
          </Field>
          <Field label="범위">
            <select
              style={inputStyle}
              value={form.scope}
              onChange={(e) => set("scope", e.target.value)}
            >
              <option value="ALL">전체</option>
              <option value="EVENT">이벤트</option>
            </select>
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
              checked={form.pinned}
              onChange={() => set("pinned", !form.pinned)}
            />
            고정 공지
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
            disabled={saving}
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
            disabled={saving}
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
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? "저장 중..." : isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════ */
export default function Notice() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 10;

  const [modal, setModal] = useState(null);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [search, setSearch] = useState("");

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const fetchList = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminNoticeApi.list(p, PAGE_SIZE);
      const d = unwrap(res);
      setItems(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotalElements(d.totalElements ?? d.content?.length ?? 0);
      setPage(p);
    } catch (err) {
      console.error("[Notice] fetch error:", err);
      setError("공지사항을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(1);
  }, [fetchList]);

  const rows = items.filter((e) => !search || e.title?.includes(search));

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await adminNoticeApi.create(form);
      setPanel(null);
      showToast("공지사항이 등록되었습니다.");
      fetchList(1);
    } catch (err) {
      console.error("[Notice] create error:", err);
      showToast("등록에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      await adminNoticeApi.update(panel.item.noticeId, form);
      setPanel(null);
      showToast("공지사항이 수정되었습니다.");
      fetchList(page);
    } catch (err) {
      console.error("[Notice] update error:", err);
      showToast("수정에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = modal.item.noticeId;
    setSaving(true);
    try {
      await adminNoticeApi.delete(id);
      setModal(null);
      setRemoving(id);
      setTimeout(() => {
        setRemoving(null);
        showToast("공지사항이 삭제되었습니다.");
        fetchList(page);
      }, 300);
    } catch (err) {
      console.error("[Notice] delete error:", err);
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
              총 {totalElements}개
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => fetchList(page)}
              style={{
                padding: "7px 10px",
                borderRadius: 7,
                border: "1px solid #E2E8F0",
                background: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: "#64748B",
                fontFamily: ds.ff,
              }}
            >
              <RefreshCw size={13} /> 새로고침
            </button>
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
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> 공지 등록
            </button>
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
              textAlign: "center",
              padding: "60px 20px",
              minHeight: 300,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <AlertTriangle
              size={36}
              color="#F59E0B"
              style={{ marginBottom: 12 }}
            />
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

        {!loading &&
          !error &&
          rows.map((r) => (
            <div
              key={r.noticeId}
              className={`board-row ${removing === r.noticeId ? "row-removing" : ""}`}
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
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#F4F6F8")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div style={{ width: 12, flexShrink: 0 }}>
                {r.pinned && (
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
              <span
                style={{
                  fontSize: 11,
                  color: "#94A3B8",
                  marginRight: 14,
                  flexShrink: 0,
                }}
              >
                {r.scope === "ALL" ? "전체" : "이벤트"}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "#94A3B8",
                  flexShrink: 0,
                  minWidth: 80,
                  textAlign: "right",
                }}
              >
                {fmtDate(r.createdAt)}
              </span>
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

        {!loading && !error && rows.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Search size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
              공지사항이 없습니다
            </div>
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div
            style={{
              padding: "14px 20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <button
              onClick={() => fetchList(page - 1)}
              disabled={page <= 1}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "1px solid #E2E8F0",
                background: "#fff",
                cursor: page <= 1 ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: page <= 1 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={14} color="#64748B" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => fetchList(i + 1)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  border: i + 1 === page ? "none" : "1px solid #E2E8F0",
                  background: i + 1 === page ? ds.brand : "#fff",
                  color: i + 1 === page ? "#fff" : "#64748B",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: ds.ff,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => fetchList(page + 1)}
              disabled={page >= totalPages}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "1px solid #E2E8F0",
                background: "#fff",
                cursor: page >= totalPages ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: page >= totalPages ? 0.4 : 1,
              }}
            >
              <ChevronRight size={14} color="#64748B" />
            </button>
          </div>
        )}
      </div>

      {panel?.type === "create" && (
        <SlidePanel
          onSave={handleCreate}
          onClose={() => setPanel(null)}
          saving={saving}
        />
      )}
      {panel?.type === "edit" && (
        <SlidePanel
          item={panel.item}
          isEdit
          onSave={handleUpdate}
          onClose={() => setPanel(null)}
          saving={saving}
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
          loading={saving}
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
