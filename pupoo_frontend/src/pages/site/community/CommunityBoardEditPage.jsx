import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, Paperclip } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { postApi } from "../../../app/http/postApi";
import { fileApi } from "../../../app/http/fileApi";
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

function InProgressBox() {
  return (
    <div
      style={{
        marginBottom: 18,
        background: "#EFF6FF",
        border: "1px solid #BFDBFE",
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
      수정 중입니다. 기다려 주세요.
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

export default function CommunityBoardEditPage({
  pageTitle,
  pageSubtitle,
  currentPath,
  badgeType,
}) {
  const navigate = useNavigate();
  const { postId } = useParams();
  const numericPostId = Number(postId);
  const isMountedRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [existingAttachment, setExistingAttachment] = useState(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!tokenStore.getAccess()) {
      navigate("/auth/login", { state: { from: `${currentPath}/${postId}/edit` } });
      return;
    }

    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const detail = await postApi.get(numericPostId);
        if (!mounted) return;
        setTitle(detail.postTitle || "");
        setContent(detail.content || "");

        try {
          const att = await fileApi.getByPostId(numericPostId);
          if (mounted && att?.fileId) setExistingAttachment(att);
        } catch (_) {}
      } catch (err) {
        console.error("[CommunityBoardEditPage] load failed:", err);
        if (mounted) setError("게시글을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [currentPath, navigate, numericPostId, postId]);

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
      navigate("/auth/login", { state: { from: `${currentPath}/${postId}/edit` } });
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await postApi.update(numericPostId, {
        postTitle: title.trim(),
        content,
      });

      if (!isMountedRef.current) return;

      if (file) {
        await fileApi.upload(file, "POST", numericPostId);
      }
      if (!isMountedRef.current) return;

      setSuccessMessage("수정 완료");
      setTimeout(() => {
        if (!isMountedRef.current) return;
        navigate(`${currentPath}/${postId}`);
      }, 1500);
    } catch (err) {
      console.error("[CommunityBoardEditPage] update failed:", err);
      if (!isMountedRef.current) return;
      setError(err?.response?.data?.message || err?.response?.data?.error?.message || "글 수정에 실패했습니다.");
      setSaving(false);
    }
  };

  return (
    <CommunityWriteLayout
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      currentPath={currentPath}
      badgeType={badgeType}
      formTitle={`${pageTitle} 글 수정`}
      formDescription="제목과 본문을 수정하고, 필요하면 첨부 파일을 교체할 수 있습니다."
      footer={
        <>
          <button
            type="button"
            onClick={() => navigate(`${currentPath}/${postId}`)}
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
            form="community-board-edit-form"
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
            {saving ? "수정 중..." : "수정하기"}
          </button>
        </>
      }
    >
      <form id="community-board-edit-form" onSubmit={handleSubmit}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <ErrorBox message={error} />
        {saving && !successMessage ? <InProgressBox /> : null}
        <SuccessBox message={successMessage} />

        {loading ? (
          <div style={{ fontSize: 14, color: "#64748b" }}>게시글 정보를 불러오는 중입니다.</div>
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
                {file
                  ? `새 파일: ${file.name}`
                  : existingAttachment
                    ? `기존 파일: ${existingAttachment.originalName || "첨부파일"}`
                    : "클릭하여 파일을 선택하세요. (선택 사항)"}
              </div>
            </label>
          </div>
        )}
      </form>
    </CommunityWriteLayout>
  );
}
