import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { boardApi } from "../../../app/http/boardApi";
import { fileApi } from "../../../app/http/fileApi";
import { postApi } from "../../../app/http/postApi";
import { tokenStore } from "../../../app/http/tokenStore";
import CommunityContentTextarea from "./shared/CommunityContentTextarea";
import { hasMeaningfulCommunityContent } from "./shared/communityHtml";
import CommunityWriteLayout from "./shared/CommunityWriteLayout";

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

export default function CommunityBoardWritePage({
  pageTitle,
  pageSubtitle,
  currentPath,
  badgeType,
  boardType,
}) {
  const navigate = useNavigate();
  const [boardId, setBoardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

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

    setSaving(true);
    setError("");
    try {
      const created = await postApi.create({
        boardId,
        postTitle: title.trim(),
        content,
      });
      const createdPostId = Number(created?.postId);
      if (file && createdPostId) {
        await fileApi.upload(file, "POST", createdPostId);
      }
      navigate(createdPostId ? `${currentPath}/${createdPostId}` : currentPath);
    } catch (err) {
      console.error("[CommunityBoardWritePage] create failed:", err);
      setError(err?.response?.data?.error?.message || "글 등록에 실패했습니다.");
    } finally {
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
              background: "#1d4ed8",
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
        <ErrorBox message={error} />

        {loading ? (
          <div style={{ fontSize: 14, color: "#64748b" }}>게시판 정보를 확인하는 중입니다.</div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>제목</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="제목을 입력해 주세요"
                style={{
                  height: 46,
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  padding: "0 14px",
                  fontSize: 14,
                  color: "#0f172a",
                  background: "#fff",
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

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>첨부 파일</span>
              <input
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  color: "#334155",
                  background: "#fff",
                }}
              />
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {file ? `선택한 파일: ${file.name}` : "첨부 파일은 선택 사항입니다."}
              </span>
            </label>
          </div>
        )}
      </form>
    </CommunityWriteLayout>
  );
}
