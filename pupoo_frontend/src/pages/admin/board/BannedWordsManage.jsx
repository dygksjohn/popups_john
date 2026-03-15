import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import ds from "../shared/designTokens";
import { boardApi } from "../../../app/http/boardApi";
import {
  bannedWordApi,
  BANNED_WORD_CATEGORIES,
} from "../../../app/http/bannedWordApi";
function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function getCategoryLabel(value) {
  return BANNED_WORD_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

/* ── Toast ── */
function Toast({ msg, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  const bg = type === "success" ? "#10B981" : type === "error" ? "#EF4444" : "#F59E0B";
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
      }}
    >
      {type === "success" ? "✓" : "✕"} {msg}
    </div>
  );
}

/* ── Confirm Modal ── */
function ConfirmModal({ title, msg, onConfirm, onCancel, loading }) {
  return (
    <div
      onClick={onCancel}
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
          background: ds.bg,
          borderRadius: 16,
          width: 400,
          padding: 28,
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: ds.redSoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={18} color="#EF4444" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: ds.ink, margin: 0 }}>
            {title}
          </h3>
        </div>
        <p style={{ fontSize: 13.5, color: ds.ink3, lineHeight: 1.6, margin: "0 0 24px" }}>
          {msg}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: `1px solid ${ds.line}`,
              background: ds.bg,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: ds.ff,
              color: ds.ink3,
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
    </div>
  );
}

/* ── Form Modal (추가/수정) ── */
function FormModal({ item, onSave, onClose, saving }) {
  const isEdit = !!item?.bannedWordId;
  const [bannedWord, setBannedWord] = useState(item?.bannedWord ?? "");
  const [category, setCategory] = useState(item?.category ?? "OTHER");
  const [replacement, setReplacement] = useState(item?.replacement ?? "");
  const [err, setErr] = useState("");

  const handleSubmit = () => {
    const word = bannedWord.trim();
    if (!word) {
      setErr("금지어를 입력하세요.");
      return;
    }
    setErr("");
    onSave({
      bannedWord: word,
      category,
      replacement: replacement.trim() || undefined,
      bannedWordId: item?.bannedWordId,
    });
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 9,
    border: `1.5px solid ${ds.line}`,
    fontSize: 13.5,
    fontFamily: ds.ff,
    color: ds.ink,
    outline: "none",
    boxSizing: "border-box",
    background: ds.bg,
  };

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
          background: ds.bg,
          borderRadius: 16,
          width: 440,
          padding: 28,
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: ds.ink, margin: 0 }}>
            {isEdit ? "금지어 수정" : "금지어 추가"}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: "none",
              background: ds.lineSoft,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} color={ds.ink4} />
          </button>
        </div>

        {err && (
          <div
            style={{
              background: ds.redSoft,
              border: `1px solid ${ds.red}33`,
              borderRadius: 9,
              padding: "10px 14px",
              fontSize: 12.5,
              color: ds.red,
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

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: ds.ink3, marginBottom: 6, display: "block" }}>
            금지어 <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            style={inputStyle}
            value={bannedWord}
            onChange={(e) => setBannedWord(e.target.value)}
            placeholder="등록할 금지어를 입력하세요"
            maxLength={100}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: ds.ink3, marginBottom: 6, display: "block" }}>
            카테고리 <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {BANNED_WORD_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: ds.ink3, marginBottom: 6, display: "block" }}>
            대체어 (선택)
          </label>
          <input
            style={inputStyle}
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="노출 시 치환할 텍스트 (비워두면 마스킹 등 정책에 따름)"
            maxLength={100}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "10px 20px",
              borderRadius: 9,
              border: `1px solid ${ds.line}`,
              background: ds.bg,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: ds.ff,
              color: ds.ink3,
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: "10px 20px",
              borderRadius: 9,
              border: "none",
              background: ds.brand,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}

const spinStyle = `
@keyframes spin { to { transform: rotate(360deg); } }
`;

export default function BannedWordsManage() {
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 20;

  const fetchBoards = useCallback(async () => {
    setBoardsLoading(true);
    try {
      const list = await boardApi.getBoards(false);
      const arr = Array.isArray(list) ? list : list?.content ?? [];
      setBoards(arr);
      if (arr.length > 0 && !selectedBoardId) {
        setSelectedBoardId(arr[0].boardId);
      }
    } catch (e) {
      console.warn("[BannedWordsManage] 게시판 목록 로드 실패:", e);
      setToast({ msg: "게시판 목록을 불러오지 못했습니다.", type: "error" });
    } finally {
      setBoardsLoading(false);
    }
  }, [selectedBoardId]);

  const fetchList = useCallback(async () => {
    if (!selectedBoardId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await bannedWordApi.list(selectedBoardId, page, size);
      setItems(res?.content ?? []);
      setTotalPages(res?.totalPages ?? 0);
      setTotalElements(res?.totalElements ?? 0);
    } catch (e) {
      console.warn("[BannedWordsManage] 금지어 목록 로드 실패:", e);
      setToast({ msg: "금지어 목록을 불러오지 못했습니다.", type: "error" });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBoardId, page]);

  useEffect(() => {
    fetchBoards();
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const handleCreate = async (body) => {
    setSaving(true);
    try {
      await bannedWordApi.create(selectedBoardId, {
        bannedWord: body.bannedWord,
        category: body.category,
        replacement: body.replacement,
      });
      setModal(null);
      showToast("금지어가 등록되었습니다.");
      fetchList();
    } catch (e) {
      const msg = e?.response?.data?.message || "등록에 실패했습니다.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (body) => {
    if (!body.bannedWordId) return;
    setSaving(true);
    try {
      await bannedWordApi.update(body.bannedWordId, {
        bannedWord: body.bannedWord,
        category: body.category,
        replacement: body.replacement,
      });
      setModal(null);
      showToast("금지어가 수정되었습니다.");
      fetchList();
    } catch (e) {
      const msg = e?.response?.data?.message || "수정에 실패했습니다.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = modal?.item?.bannedWordId;
    if (!id) return;
    setSaving(true);
    try {
      await bannedWordApi.delete(id);
      setModal(null);
      showToast("금지어가 삭제되었습니다.");
      fetchList();
    } catch (e) {
      const msg = e?.response?.data?.message || "삭제에 실패했습니다.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedBoard = boards.find((b) => b.boardId === selectedBoardId);
  const boardLabel = selectedBoard
    ? selectedBoard.name || selectedBoard.boardType || `게시판 #${selectedBoardId}`
    : "게시판 선택";

  return (
    <div
      style={{
        background: ds.bg,
        borderRadius: 12,
        border: `1px solid ${ds.line}`,
        overflow: "hidden",
      }}
    >
      <style>{spinStyle}</style>
      <div
        style={{
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          borderBottom: `1px solid ${ds.line}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldAlert size={18} color={ds.brand} />
            <span style={{ fontSize: 14, fontWeight: 800, color: ds.ink }}>금지어 관리</span>
          </div>
          <select
            value={selectedBoardId ?? ""}
            onChange={(e) => {
              setSelectedBoardId(e.target.value ? Number(e.target.value) : null);
              setPage(0);
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${ds.line}`,
              background: ds.bg,
              fontSize: 13,
              fontFamily: ds.ff,
              color: ds.ink,
              cursor: "pointer",
              minWidth: 160,
            }}
          >
            <option value="">게시판 선택</option>
            {boards.map((b) => (
              <option key={b.boardId} value={b.boardId}>
                {b.name || b.boardType || `게시판 #${b.boardId}`}
              </option>
            ))}
          </select>
          {selectedBoardId && (
            <span style={{ fontSize: 12, fontWeight: 600, color: ds.ink4 }}>
              총 {totalElements}개
            </span>
          )}
        </div>
        {selectedBoardId && (
          <button
            onClick={() => setModal({ type: "form" })}
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
            <Plus size={13} strokeWidth={2.5} /> 금지어 추가
          </button>
        )}
      </div>

      {boardsLoading && (
        <div style={{ padding: 60, textAlign: "center" }}>
          <Loader2 size={28} color={ds.ink4} style={{ animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: 13, color: ds.ink4, marginTop: 12 }}>게시판 목록 불러오는 중...</div>
        </div>
      )}

      {!boardsLoading && !selectedBoardId && (
        <div style={{ padding: 60, textAlign: "center", color: ds.ink4, fontSize: 13.5 }}>
          위에서 게시판을 선택하면 해당 게시판의 금지어 목록을 관리할 수 있습니다.
        </div>
      )}

      {!boardsLoading && selectedBoardId && loading && (
        <div style={{ padding: 60, textAlign: "center" }}>
          <Loader2 size={28} color={ds.ink4} style={{ animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: 13, color: ds.ink4, marginTop: 12 }}>금지어 목록 불러오는 중...</div>
        </div>
      )}

      {!boardsLoading && selectedBoardId && !loading && items.length === 0 && (
        <div style={{ padding: 60, textAlign: "center", color: ds.ink4, fontSize: 13.5 }}>
          등록된 금지어가 없습니다. "금지어 추가"로 등록하세요.
        </div>
      )}

      {!boardsLoading && selectedBoardId && !loading && items.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 120px 100px 80px",
              gap: 12,
              padding: "12px 20px",
              borderBottom: `1px solid ${ds.line}`,
              fontSize: 11,
              fontWeight: 700,
              color: ds.ink4,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            <span>금지어</span>
            <span>카테고리</span>
            <span>대체어</span>
            <span>등록일</span>
            <span></span>
          </div>
          {items.map((row) => (
            <div
              key={row.bannedWordId}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 120px 100px 80px",
                gap: 12,
                alignItems: "center",
                padding: "12px 20px",
                borderBottom: `1px solid ${ds.lineSoft}`,
                fontSize: 13,
                color: ds.ink3,
              }}
            >
              <span style={{ fontWeight: 600, color: ds.ink }}>{row.bannedWord}</span>
              <span>{getCategoryLabel(row.category)}</span>
              <span style={{ color: ds.ink4 }}>{row.replacement || "-"}</span>
              <span style={{ fontSize: 12, color: ds.ink4 }}>{fmtDate(row.createdAt)}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => setModal({ type: "form", item: row })}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 5,
                    border: `1px solid ${ds.brand}25`,
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
                  onClick={() => setModal({ type: "delete", item: row })}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 5,
                    border: "1px solid #FECACA50",
                    background: "transparent",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#EF4444",
                    cursor: "pointer",
                    fontFamily: ds.ff,
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <div
              style={{
                padding: "12px 20px",
                borderTop: `1px solid ${ds.line}`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page <= 0}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${ds.line}`,
                  background: ds.bg,
                  fontSize: 13,
                  color: page <= 0 ? ds.ink4 : ds.ink3,
                  cursor: page <= 0 ? "default" : "pointer",
                  fontFamily: ds.ff,
                }}
              >
                이전
              </button>
              <span style={{ fontSize: 13, color: ds.ink4 }}>
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${ds.line}`,
                  background: ds.bg,
                  fontSize: 13,
                  color: page >= totalPages - 1 ? ds.ink4 : ds.ink3,
                  cursor: page >= totalPages - 1 ? "default" : "pointer",
                  fontFamily: ds.ff,
                }}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {modal?.type === "form" && (
        <FormModal
          item={modal.item}
          onSave={modal.item ? handleUpdate : handleCreate}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmModal
          title="금지어 삭제"
          msg={`"${modal.item?.bannedWord}" 을(를) 삭제하시겠습니까?`}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
          loading={saving}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
