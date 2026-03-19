import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { boardApi } from "../../../app/http/boardApi";
import { fileApi } from "../../../app/http/fileApi";
import { postApi } from "../../../app/http/postApi";
import { tokenStore } from "../../../app/http/tokenStore";
import CommunityContentTextarea from "./shared/CommunityContentTextarea";
import { hasMeaningfulCommunityContent } from "./shared/communityHtml";
import CommunityWriteLayout from "./shared/CommunityWriteLayout";

const DRAFT_KEY_PREFIX = "draft_community_board_";

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        marginBottom: 18,
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        borderRadius: 10,
        padding: "12px 14px",
        fontSize: 13,
        color: "#B91C1C",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <AlertTriangle size={14} />
      {message}
    </div>
  );
}

function InProgressBox() {
  return (
    <div
      style={{
        marginBottom: 18,
        background: "#E6F7F2",
        border: "1px solid #CCF0E4",
        borderRadius: 10,
        padding: "12px 14px",
        fontSize: 13,
        color: "#1E40AF",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Loader2 size={14} style={{ flexShrink: 0, animation: "spin 1s linear infinite" }} />
      등록 중입니다. 기다려 주세요.
    </div>
  );
}

function SuccessBox({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        marginBottom: 18,
        background: "#F0FDF4",
        border: "1px solid #BBF7D0",
        borderRadius: 10,
        padding: "12px 14px",
        fontSize: 13,
        color: "#166534",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <CheckCircle size={14} />
      {message}
    </div>
  );
}

function getDraftKey(path) {
  return `${DRAFT_KEY_PREFIX}${(path || "").replace(/\//g, "_")}`;
}

export default function CommunityBoardWritePage({
  pageTitle,
  pageSubtitle,
  currentPath,
  badgeType,
  boardType,
}) {
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const [boardId, setBoardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!tokenStore.getAccess()) {
      navigate("/auth/login", { state: { from: `${currentPath}/write` } });
      return () => {
        mounted = false;
      };
    }

    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await boardApi.getBoards(true);
        if (!mounted) return;
        const matched = (Array.isArray(rows) ? rows : []).find(
          (row) => String(row?.boardType || "").toUpperCase() === String(boardType || "").toUpperCase(),
        );
        const nextBoardId = Number(matched?.boardId) || null;
        setBoardId(nextBoardId);
        if (!nextBoardId) {
          setError("게시판 정보를 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.");
        }
      } catch (err) {
        console.error("[CommunityBoardWritePage] board load failed:", err);
        if (!mounted) return;
        setBoardId(null);
        setError("게시판 정보를 불러오지 못했습니다.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [boardType, currentPath, navigate]);

  const localError = useMemo(() => {
    if (!title.trim()) return "제목을 입력해 주세요.";
    if (!hasMeaningfulCommunityContent(content)) return "내용을 입력해 주세요.";
    return "";
  }, [content, title]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (localError) {
      setError(localError);
      return;
    }
    if (!tokenStore.getAccess()) {
      navigate("/auth/login", { state: { from: `${currentPath}/write` } });
      return;
    }
    if (!boardId) {
      setError("게시판 정보를 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    const draftKey = getDraftKey(currentPath);
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ title: title.trim(), content, boardId, fileName: file?.name ?? null }),
      );
    } catch (_) {}

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const created = await postApi.create({
        boardId,
        postTitle: title.trim(),
        content,
      });

      if (!isMountedRef.current) return;

      const createdPostId = Number(created?.postId ?? created);
      if (file && createdPostId) {
        await fileApi.upload(file, "POST", createdPostId);
      }
      if (!isMountedRef.current) return;

      try {
        localStorage.removeItem(draftKey);
      } catch (_) {}

      setSuccessMessage("등록 완료");
      setTimeout(() => {
        if (!isMountedRef.current) return;
        navigate(currentPath);
      }, 1500);
    } catch (err) {
      console.error("[CommunityBoardWritePage] create failed:", err);
      if (!isMountedRef.current) return;
      setError(err?.response?.data?.error?.message || "글 등록에 실패했습니다.");
      setSaving(false);
    }
  };

  return (
    <CommunityWriteLayout
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      currentPath={currentPath}
      badgeType={badgeType}
      formTitle={`${pageTitle} 글쓰기`}
      formDescription="제목과 본문을 입력하고, 필요하면 첨부 파일도 함께 등록할 수 있습니다."
      footer={
        <>
          <button
            type="button"
            onClick={() => navigate(currentPath)}
            style={{
              height: 44,
              padding: "0 18px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "#fff",
              fontSize: 14,
              fontWeight: 700,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            type="submit"
            form="community-board-write-form"
            disabled={saving || loading}
            style={{
              height: 44,
              padding: "0 18px",
              borderRadius: 10,
              border: "none",
              background: "#028A6C",
              fontSize: 14,
              fontWeight: 800,
              color: "#fff",
              cursor: saving || loading ? "not-allowed" : "pointer",
              opacity: saving || loading ? 0.6 : 1,
            }}
          >
            {saving ? "등록 중..." : "등록하기"}
          </button>
        </>
      }
    >
      <form id="community-board-write-form" onSubmit={handleSubmit}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <ErrorBox message={error} />
        {saving && !successMessage ? <InProgressBox /> : null}
        <SuccessBox message={successMessage} />

        {loading ? (
          <div style={{ fontSize: 14, color: "#64748b" }}>게시판 정보를 확인하는 중입니다.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 18,
              position: "relative",
              pointerEvents: saving ? "none" : undefined,
              opacity: saving ? 0.75 : 1,
            }}
          >
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>제목</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="제목을 입력해 주세요"
                disabled={saving}
                readOnly={saving}
                style={{
                  height: 46,
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  padding: "0 14px",
                  fontSize: 14,
                  color: "#0f172a",
                  background: saving ? "#f1f5f9" : "#fff",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>내용</span>
              <CommunityContentTextarea
                value={content}
                onChange={setContent}
                placeholder="내용을 입력해 주세요."
                height={340}
              />
            </label>

            <label
              style={{
                display: "block",
                cursor: saving ? "not-allowed" : "pointer",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "18px 20px",
                background: saving ? "#f1f5f9" : "#f8fafc",
              }}
            >
              <input
                type="file"
                disabled={saving}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                style={{ position: "absolute", width: 0, height: 0, opacity: 0, overflow: "hidden" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                <Paperclip size={16} />
                첨부파일
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>
                {file ? `선택한 파일: ${file.name}` : "클릭하여 파일을 선택하세요. (선택 사항)"}
              </div>
            </label>
          </div>
        )}
      </form>
    </CommunityWriteLayout>
  );
}
