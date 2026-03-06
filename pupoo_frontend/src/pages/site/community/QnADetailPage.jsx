import { useEffect, useMemo, useState } from "react";
import { unwrap, qnaApi } from "../../../api/qnaApi";
import { useParams } from "react-router-dom";
import CommunityDetailLayout from "./shared/CommunityDetailLayout";

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function QnADetailPage() {
  const { qnaId } = useParams();
  const numericQnaId = Number(qnaId);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await qnaApi.get(numericQnaId);
        const data = unwrap(res);
        if (mounted) setItem(data);
      } catch (err) {
        console.error("[QnADetailPage] load failed:", err);
        if (mounted) setError(err?.response?.data?.message || "질문을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [numericQnaId]);

  const metaItems = useMemo(() => {
    if (!item) return [];
    return [
      { label: "작성일", value: fmtDate(item.createdAt) },
      { label: "조회수", value: item.viewCount ?? 0 },
      { label: "상태", value: item.status === "CLOSED" ? "답변 완료" : "미답변" },
    ];
  }, [item]);

  return (
    <CommunityDetailLayout
      pageTitle="질문/답변"
      pageSubtitle="궁금한 내용을 확인하고 답변을 읽을 수 있습니다"
      currentPath="/community/qna"
      badgeType="QNA"
      articleTitle={loading ? "불러오는 중" : item?.title || "질문을 찾을 수 없습니다."}
      metaItems={metaItems}
      content={error ? `<p>${error}</p>` : item?.content || "<p>내용이 없습니다.</p>"}
      extraContent={
        !loading && item?.answerContent ? (
          <div style={{ marginTop: 28, padding: "18px 20px", borderRadius: 14, background: "#eef4ff", borderLeft: "4px solid #1d4ed8" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1d4ed8", marginBottom: 8 }}>
              관리자 답변 {item.answeredAt ? `· ${fmtDate(item.answeredAt)}` : ""}
            </div>
            <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {item.answerContent}
            </div>
          </div>
        ) : null
      }
    />
  );
}
