import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Pencil,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { inquiryApi } from "../../../app/http/inquiryApi";
import { useAuth } from "../auth/AuthProvider";

const PAGE_SIZE = 10;

const CATEGORY_OPTIONS = [
  { value: "EVENT", label: "행사" },
  { value: "PAYMENT", label: "결제" },
  { value: "REFUND", label: "환불" },
  { value: "ACCOUNT", label: "계정" },
  { value: "OTHER", label: "기타" },
];

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "OPEN", label: "접수" },
  { value: "IN_PROGRESS", label: "처리중" },
  { value: "CLOSED", label: "완료" },
];

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
  const bg = type === "success" ? "#10B981" : "#EF4444";
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
        boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
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
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "90%",
          maxWidth: 520,
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function WriteModal({ initial, onSave, onClose, saving }) {
  const isEdit = !!initial;
  const [category, setCategory] = useState(initial?.category ?? "OTHER");
  const [inquiryTitle, setInquiryTitle] = useState(initial?.inquiryTitle ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [err, setErr] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inquiryTitle.trim()) {
      setErr("제목을 입력하세요.");
      return;
    }
    setErr("");
    onSave({ category, inquiryTitle: inquiryTitle.trim(), content: content ?? "" });
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#222", margin: 0 }}>
            {isEdit ? "문의 수정" : "1:1 문의 등록"}
          </h3>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #eee", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#999" />
          </button>
        </div>
        {err && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "#FEF2F2", color: "#DC2626", borderRadius: 8, fontSize: 13 }}>
            {err}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#555" }}>분류</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#555" }}>제목 *</label>
            <input
              type="text"
              value={inquiryTitle}
              onChange={(e) => setInquiryTitle(e.target.value)}
              placeholder="문의 제목을 입력하세요"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#555" }}>내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="문의 내용을 입력하세요"
              rows={5}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} disabled={saving} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#666" }}>
              취소
            </button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: "#1a4fd6", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "저장 중…" : isEdit ? "수정" : "등록"}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

function DetailModal({ item, onClose, onEdit, onCloseInquiry }) {
  if (!item) return null;
  const categoryLabel = CATEGORY_OPTIONS.find((o) => o.value === item.category)?.label ?? item.category;
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === item.status)?.label ?? item.status;
  const canEdit = item.status === "OPEN";
  const canCloseInquiry = item.status !== "CLOSED";

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 12, color: "#64748B", marginRight: 8 }}>{categoryLabel}</span>
            <span style={{ fontSize: 12, color: "#64748B", padding: "2px 8px", borderRadius: 4, background: "#f1f5f9" }}>{statusLabel}</span>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#222", margin: "8px 0 0" }}>{item.inquiryTitle}</h3>
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #eee", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#999" />
          </button>
        </div>
        <div style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
          작성일 {fmtDate(item.createdAt)}
          {item.updatedAt && item.updatedAt !== item.createdAt && ` · 수정일 ${fmtDate(item.updatedAt)}`}
        </div>
        <div style={{ padding: "16px 0", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", fontSize: 14, color: "#334155", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {item.content || "(내용 없음)"}
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {canEdit && (
            <button type="button" onClick={() => onEdit(item)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#555" }}>
              <Pencil size={14} /> 수정
            </button>
          )}
          {canCloseInquiry && (
            <button type="button" onClick={() => onCloseInquiry(item)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 16px", borderRadius: 8, border: "1px solid #94a3b8", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748b" }}>
              <Lock size={14} /> 마감
            </button>
          )}
          <button type="button" onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#666" }}>
            닫기
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export default function Inquiry() {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  const [writeModal, setWriteModal] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const fetchList = useCallback(
    async (p = 1) => {
      setLoading(true);
      setError(null);
      try {
        const data = await inquiryApi.list({
          page: p - 1,
          size: PAGE_SIZE,
          status: statusFilter || undefined,
        });
        setItems(data?.content ?? []);
        setTotalPages(data?.totalPages ?? 0);
        setTotalElements(data?.totalElements ?? 0);
        setPage(p);
      } catch (err) {
        console.error("[Inquiry] fetch error:", err);
        if (err?.response?.status === 401) {
          setError("로그인 후 이용해 주세요.");
        } else {
          setError("문의 목록을 불러오는데 실패했습니다.");
        }
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    if (!isAuthed) {
      setLoading(false);
      setError("로그인 후 이용해 주세요.");
      setItems([]);
      return;
    }
    fetchList(1);
  }, [isAuthed, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = async (item) => {
    try {
      const detail = await inquiryApi.get(item.inquiryId);
      setDetailItem(detail);
    } catch (err) {
      console.error("[Inquiry] detail error:", err);
      showToast("문의를 불러오는데 실패했습니다.", "error");
    }
  };

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await inquiryApi.create(form);
      setWriteModal(null);
      showToast("문의가 등록되었습니다.");
      fetchList(1);
    } catch (err) {
      console.error("[Inquiry] create error:", err);
      showToast(err?.response?.data?.error?.message ?? "등록에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      await inquiryApi.update(writeModal.inquiryId, form);
      setWriteModal(null);
      setDetailItem(null);
      showToast("문의가 수정되었습니다.");
      fetchList(page);
    } catch (err) {
      console.error("[Inquiry] update error:", err);
      showToast(err?.response?.data?.error?.message ?? "수정에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseInquiry = async (item) => {
    if (!window.confirm("이 문의를 마감하시겠습니까?")) return;
    setSaving(true);
    try {
      await inquiryApi.close(item.inquiryId);
      setDetailItem(null);
      showToast("문의가 마감되었습니다.");
      fetchList(page);
    } catch (err) {
      console.error("[Inquiry] close error:", err);
      showToast(err?.response?.data?.error?.message ?? "마감에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthed) {
    return (
      <main style={{ maxWidth: 800, margin: "0 auto", padding: 40, fontFamily: "'Noto Sans KR', sans-serif" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 8 }}>1:1 문의</h1>
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>서비스 이용 문의를 남기실 수 있습니다.</p>
        <div style={{ padding: "60px 20px", textAlign: "center", background: "#f8fafc", borderRadius: 12 }}>
          <AlertCircle size={40} color="#94a3b8" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, color: "#475569", marginBottom: 16 }}>로그인 후 이용해 주세요.</p>
          <button type="button" onClick={() => navigate("/login")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1a4fd6", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            로그인
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 8 }}>1:1 문의</h1>
      <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>서비스 이용 문의를 남기실 수 있습니다.</p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>총 {totalElements}건</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14, background: "#fff", cursor: "pointer" }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setWriteModal({})}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, border: "none", background: "#1a4fd6", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={16} /> 문의하기
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0" }}>
          <Loader2 size={28} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <span style={{ marginTop: 12, fontSize: 14, color: "#64748B" }}>불러오는 중…</span>
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: 14, color: "#64748B", marginBottom: 12 }}>{error}</p>
          <button type="button" onClick={() => fetchList(page)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", fontSize: 14, cursor: "pointer", color: "#555" }}>
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && (
        <div>
          {items.map((item) => {
            const statusLabel = STATUS_OPTIONS.find((o) => o.value === item.status)?.label ?? item.status;
            const categoryLabel = CATEGORY_OPTIONS.find((o) => o.value === item.category)?.label ?? item.category;
            return (
              <div
                key={item.inquiryId}
                onClick={() => openDetail(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  gap: 16,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 12, color: "#64748B", minWidth: 48 }}>{categoryLabel}</span>
                <span style={{ flex: 1, fontSize: 15, color: "#222", fontWeight: 500 }}>{item.inquiryTitle}</span>
                <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: item.status === "CLOSED" ? "#e2e8f0" : "#dbeafe", color: item.status === "CLOSED" ? "#64748b" : "#1d4ed8" }}>{statusLabel}</span>
                <span style={{ fontSize: 13, color: "#94a3b8", minWidth: 90 }}>{fmtDate(item.createdAt)}</span>
              </div>
            );
          })}
          {items.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontSize: 14 }}>등록된 문의가 없습니다.</div>
          )}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 32 }}>
          <button type="button" onClick={() => fetchList(page - 1)} disabled={page <= 1} style={{ background: "none", border: "none", color: page <= 1 ? "#ddd" : "#666", cursor: page <= 1 ? "default" : "pointer", padding: "4px 8px" }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 14, color: "#333" }}>{page} / {totalPages}</span>
          <button type="button" onClick={() => fetchList(page + 1)} disabled={page >= totalPages} style={{ background: "none", border: "none", color: page >= totalPages ? "#ddd" : "#666", cursor: page >= totalPages ? "default" : "pointer", padding: "4px 8px" }}>
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {writeModal && (
        <WriteModal
          initial={writeModal.inquiryId ? writeModal : null}
          onSave={writeModal.inquiryId ? handleUpdate : handleCreate}
          onClose={() => setWriteModal(null)}
          saving={saving}
        />
      )}

      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={(item) => {
            setDetailItem(null);
            setWriteModal({ ...item, inquiryId: item.inquiryId });
          }}
          onCloseInquiry={handleCloseInquiry}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </main>
  );
}
