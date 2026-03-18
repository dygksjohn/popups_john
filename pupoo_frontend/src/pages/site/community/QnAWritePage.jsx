import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { qnaApi, unwrap } from "../../../api/qnaApi";
import { tokenStore } from "../../../app/http/tokenStore";
import CommunityContentTextarea from "./shared/CommunityContentTextarea";
import { hasMeaningfulCommunityContent } from "./shared/communityHtml";
import CommunityWriteLayout from "./shared/CommunityWriteLayout";

const DRAFT_KEY_QNA = "draft_community_qna";

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

export default function QnAWritePage() {
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
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
      navigate("/auth/login", { state: { from: "/community/qna/write" } });
    }
  }, [navigate]);

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
      navigate("/auth/login", { state: { from: "/community/qna/write" } });
      return;
    }

    try {
      localStorage.setItem(DRAFT_KEY_QNA, JSON.stringify({ title: title.trim(), content }));
    } catch (_) {}

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await qnaApi.create({
        title: title.trim(),
        content,
      });

      if (!isMountedRef.current) return;

      const created = unwrap(res);
      const createdQnaId = Number(created?.qnaId);

      try {
        localStorage.removeItem(DRAFT_KEY_QNA);
      } catch (_) {}

      setSuccessMessage("등록 완료");
      setTimeout(() => {
        if (!isMountedRef.current) return;
        navigate("/community/qna");
      }, 1500);
    } catch (err) {
      console.error("[QnAWritePage] create failed:", err);
      if (!isMountedRef.current) return;
      if (err?.response?.status === 401) {
        navigate("/auth/login", { state: { from: "/community/qna/write" } });
        return;
      }
      setError(err?.response?.data?.message || err?.response?.data?.error?.message || "질문 등록에 실패했습니다.");
      setSaving(false);
    }
  };

  return (
    <CommunityWriteLayout
      pageTitle="질문/답변"
      pageSubtitle="서비스 이용과 관련한 문의사항을 등록하고 답변을 확인할 수 있습니다."
      currentPath="/community/qna"
      badgeType="QNA"
      formTitle="질문 등록"
      formDescription="궁금한 내용을 남기면 상세 페이지에서 답변을 확인할 수 있습니다."
      footer={
        <>
          <button
            type="button"
            onClick={() => navigate("/community/qna")}
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
            form="community-qna-write-form"
            disabled={saving}
            style={{
              height: 44,
              padding: "0 18px",
              borderRadius: 10,
              border: "none",
              background: "#1d4ed8",
              fontSize: 14,
              fontWeight: 800,
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "등록 중..." : "등록하기"}
          </button>
        </>
      }
    >
      <form id="community-qna-write-form" onSubmit={handleSubmit}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <ErrorBox message={error} />
        {saving && !successMessage ? <InProgressBox /> : null}
        <SuccessBox message={successMessage} />

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
      </form>
    </CommunityWriteLayout>
  );
}
