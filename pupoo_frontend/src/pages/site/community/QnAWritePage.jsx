import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { qnaApi, unwrap } from "../../../api/qnaApi";
import { tokenStore } from "../../../app/http/tokenStore";
import CommunityRichTextEditor from "./shared/CommunityRichTextEditor";
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

export default function QnAWritePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

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

    setSaving(true);
    setError("");
    try {
      const res = await qnaApi.create({
        title: title.trim(),
        content,
      });
      const created = unwrap(res);
      const createdQnaId = Number(created?.qnaId);
      navigate(createdQnaId ? `/community/qna/${createdQnaId}` : "/community/qna");
    } catch (err) {
      console.error("[QnAWritePage] create failed:", err);
      if (err?.response?.status === 401) {
        navigate("/auth/login", { state: { from: "/community/qna/write" } });
        return;
      }
      setError(err?.response?.data?.message || "질문 등록에 실패했습니다.");
    } finally {
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
        <ErrorBox message={error} />

        <div style={{ display: "grid", gap: 18 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>제목</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="질문 제목을 입력해 주세요"
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
            <CommunityRichTextEditor
              value={content}
              onChange={setContent}
              placeholder="질문 내용을 입력해 주세요. 이미지는 본문에 삽입할 수 있습니다."
              height={340}
            />
          </label>
        </div>
      </form>
    </CommunityWriteLayout>
  );
}
