import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { qnaApi, unwrap } from "../../../api/qnaApi";
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

export default function QnAEditPage() {
  const navigate = useNavigate();
  const { qnaId } = useParams();
  const numericQnaId = Number(qnaId);
  const isMountedRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!tokenStore.getAccess()) {
      navigate("/auth/login", { state: { from: `/community/qna/${qnaId}/edit` } });
      return;
    }

    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await qnaApi.get(numericQnaId);
        const data = unwrap(res);
        if (!mounted) return;
        setTitle(data?.title || "");
        setContent(data?.content || "");
      } catch (err) {
        console.error("[QnAEditPage] load failed:", err);
        if (mounted) setError("질문을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [navigate, numericQnaId, qnaId]);

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
      navigate("/auth/login", { state: { from: `/community/qna/${qnaId}/edit` } });
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await qnaApi.update(numericQnaId, {
        title: title.trim(),
        content,
      });

      if (!isMountedRef.current) return;

      setSuccessMessage("수정 완료");
      setTimeout(() => {
        if (!isMountedRef.current) return;
        navigate(`/community/qna/${qnaId}`);
      }, 1500);
    } catch (err) {
      console.error("[QnAEditPage] update failed:", err);
      if (!isMountedRef.current) return;
      if (err?.response?.status === 401) {
        navigate("/auth/login", { state: { from: `/community/qna/${qnaId}/edit` } });
        return;
      }
      setError(err?.response?.data?.message || err?.response?.data?.error?.message || "질문 수정에 실패했습니다.");
      setSaving(false);
    }
  };

  return (
    <CommunityWriteLayout
      pageTitle="질문/답변"
      pageSubtitle="서비스 이용과 관련한 문의사항을 등록하고 답변을 확인할 수 있습니다."
      currentPath="/community/qna"
      badgeType="QNA"
      formTitle="질문 수정"
      formDescription="질문 내용을 수정할 수 있습니다."
      footer={
        <>
          <button
            type="button"
            onClick={() => navigate(`/community/qna/${qnaId}`)}
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
            form="community-qna-edit-form"
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
      <form id="community-qna-edit-form" onSubmit={handleSubmit}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <ErrorBox message={error} />
        {saving && !successMessage ? <InProgressBox /> : null}
        <SuccessBox message={successMessage} />

        {loading ? (
          <div style={{ fontSize: 14, color: "#64748b" }}>질문 정보를 불러오는 중입니다.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 18,
              pointerEvents: saving ? "none" : undefined,
              opacity: saving ? 0.75 : 1,
            }}
          >
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>제목</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="질문 제목을 입력해 주세요"
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
                placeholder="질문 내용을 입력해 주세요."
                height={340}
              />
            </label>
          </div>
        )}
      </form>
    </CommunityWriteLayout>
  );
}
