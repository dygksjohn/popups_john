import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { Loader2, Search } from "lucide-react";
import { qnaApi, unwrap } from "../../../api/qnaApi";
import { useAuth } from "../auth/AuthProvider";

const SERVICE_CATEGORIES = [
  { label: "자유게시판", path: "/community/freeboard" },
  { label: "공지사항", path: "/community/notice" },
  { label: "행사후기", path: "/community/review" },
  { label: "질문/답변", path: "/community/qna" },
];

function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function QnA() {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const [currentPath, setCurrentPath] = useState("/community/qna");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQna = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await qnaApi.list(1, 50);
      const data = unwrap(res);
      setItems(data?.content || []);
    } catch (e) {
      console.error("[QnA] fetch error", e);
      setError("질문/답변 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQna();
  }, [fetchQna]);

  const filtered = items.filter((item) => {
    if (!search) return true;
    return item.title?.includes(search) || item.content?.includes(search);
  });

  const handleCreateQuestionClick = () => {
    if (!isAuthed) {
      navigate("/login", {
        state: { from: "/community/qna" },
      });
      return;
    }

    navigate("/community/qna/new");
  };

  return (
    <>
      <PageHeader
        title="질문 답변"
        subtitle="서비스 이용과 관련된 문의사항을 등록하고 답변을 확인할 수 있습니다."
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

      <main
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "40px 20px",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "16px",
            borderBottom: "1px solid #e0e0e0",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#222" }}>
            총 {filtered.length}개
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={handleCreateQuestionClick}
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#fff",
                background: "#2563EB",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              질문 등록
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #ccc",
                borderRadius: "6px",
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <input
                type="text"
                placeholder="검색어를 입력하세요."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  padding: "8px 12px",
                  fontSize: "14px",
                  color: "#333",
                  width: "240px",
                  background: "transparent",
                }}
              />
              <button
                style={{
                  border: "none",
                  background: "#fff",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Search size={16} strokeWidth={2} color="#555" />
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#999" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ color: "#999", marginBottom: 12 }}>{error}</div>
            <button onClick={fetchQna}>다시 시도</button>
          </div>
        )}

        {!loading && !error && (
          <div>
            {filtered.map((qna) => (
              <div
                key={qna.qnaId}
                style={{
                  borderBottom: "1px solid #e8e8e8",
                  padding: "18px 4px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ minWidth: 72, fontSize: 12, color: "#64748B" }}>
                  {qna.status === "CLOSED" ? "답변완료" : "답변대기"}
                </span>
                <span style={{ flex: 1, fontSize: 15, color: "#222" }}>{qna.title}</span>
                <span style={{ fontSize: 13, color: "#999" }}>{fmtDate(qna.createdAt)}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
