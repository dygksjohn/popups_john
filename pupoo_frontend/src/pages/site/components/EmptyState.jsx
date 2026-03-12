import { SearchX, AlertCircle } from "lucide-react";

const styles = `
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
  }
  .empty-state-icon {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }
  .empty-state-title {
    font-size: 15px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 6px;
  }
  .empty-state-desc {
    font-size: 13px;
    color: #94a3b8;
    font-weight: 500;
    text-align: center;
    line-height: 1.5;
  }
`;

export default function EmptyState({ type = "empty", message, description }) {
  const isError = type === "error";
  return (
    <>
      <style>{styles}</style>
      <div className="empty-state">
        <div
          className="empty-state-icon"
          style={{ background: isError ? "#fef2f2" : "#f1f5f9" }}
        >
          {isError
            ? <AlertCircle size={28} color="#f87171" />
            : <SearchX size={28} color="#94a3b8" />
          }
        </div>
        <div className="empty-state-title">
          {message || (isError ? "오류가 발생했습니다" : "검색 결과가 없습니다")}
        </div>
        {description && <div className="empty-state-desc">{description}</div>}
      </div>
    </>
  );
}
