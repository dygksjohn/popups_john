import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import { postApi, unwrap } from "../../../api/postApi";
import { boardApi, unwrap as unwrapBoard } from "../../../api/boardApi";

const SERVICE_CATEGORIES = [
  { label: "자유게시판", path: "/community/freeboard" },
  { label: "공지사항", path: "/community/notice" },
  { label: "행사후기", path: "/community/review" },
  { label: "질문/답변", path: "/community/qna" },
];

const FILTER_OPTIONS = ["전체", "제목", "내용"];

function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function ServicePage() {
  const [currentPath, setCurrentPath] = useState("/community/freeboard");
  const [filter, setFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const boardsRes = await boardApi.getBoards();
      const boards = unwrapBoard(boardsRes) || [];
      const freeBoard = boards.find((b) => b.boardType === "FREE");

      if (!freeBoard) {
        throw new Error("FREE 게시판 정보를 찾을 수 없습니다.");
      }

      const res = await postApi.listByBoardType("FREE", 0, 10);
      const data = unwrap(res);
      setItems(data?.content || []);
    } catch (e) {
      console.error("[FreeBoard] fetch error", e);
      setError("자유게시판 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (!search) return true;
      if (filter === "제목") return n.postTitle?.includes(search);
      if (filter === "내용") return n.content?.includes(search);
      return n.postTitle?.includes(search) || n.content?.includes(search);
    });
  }, [filter, search, items]);

  return (
    <>
      <PageHeader
        title="자유게시판"
        subtitle="누구나 편하게 소통할 수 있는 게시판입니다"
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

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ position: "relative" }}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "7px 32px 7px 12px",
                  fontSize: "14px",
                  color: "#333",
                  background: "#fff",
                  cursor: "pointer",
                  outline: "none",
                  minWidth: "80px",
                }}
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
              <span
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ChevronDown size={14} color="#666" />
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #ccc",
                borderRadius: "6px",
                overflow: "hidden",
                background: "#fff",
                transition: "border 0.15s ease",
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
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s ease",
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
            <button onClick={fetchPosts}>다시 시도</button>
          </div>
        )}

        {!loading && !error && (
          <div>
            {filtered.map((notice) => (
              <div
                key={notice.postId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "18px 4px",
                  borderBottom: "1px solid #e8e8e8",
                  gap: "0",
                }}
              >
                <span
                  style={{
                    color: "#2d2d2d",
                    fontWeight: "600",
                    fontSize: "14px",
                    minWidth: "64px",
                  }}
                >
                  자유
                </span>
                <span
                  style={{
                    color: "#565656",
                    fontWeight: "400",
                    fontSize: "14px",
                    minWidth: "80px",
                  }}
                >
                  일반
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: "15px",
                    color: "#222",
                    fontWeight: "400",
                  }}
                >
                  {notice.postTitle} · 작성자 {notice.userId || "-"} · 조회수 {notice.viewCount ?? 0}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#999",
                    marginLeft: "16px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtDate(notice.createdAt)}
                </span>
              </div>
            ))}

            {filtered.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "#999",
                  fontSize: "14px",
                }}
              >
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
