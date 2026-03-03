import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight } from "lucide-react";
import { notificationApi } from "../../../app/http/notificationApi";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function resolvePath(targetType, targetId) {
  if (!targetId) return "/notifications";
  const type = String(targetType || "").toUpperCase();
  if (type === "EVENT") return `/event/current?eventId=${targetId}`;
  if (type === "NOTICE") return `/community/notice/${targetId}`;
  if (type === "POST") return `/community/freeboard?postId=${targetId}`;
  if (type === "REVIEW") return `/community/review?reviewId=${targetId}`;
  return "/notifications";
}

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchInbox = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await notificationApi.getInbox(0, 50);
        if (!mounted) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "알림을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchInbox();
    return () => {
      mounted = false;
    };
  }, []);

  const handleClick = async (item) => {
    try {
      const result = await notificationApi.click(item.inboxId);
      setItems((prev) => prev.filter((row) => row.inboxId !== item.inboxId));
      const targetType = result?.targetType ?? item?.targetType;
      const targetId = result?.targetId ?? item?.targetId;
      navigate(resolvePath(targetType, targetId));
    } catch (e) {
      setError(e?.message || "알림 처리에 실패했습니다.");
    }
  };

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "120px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Bell size={20} />
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>알림</h1>
      </div>

      {loading && <div style={{ color: "#64748B" }}>알림을 불러오는 중입니다.</div>}
      {!loading && error && <div style={{ color: "#DC2626" }}>{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div style={{ padding: "24px 0", color: "#64748B" }}>새 알림이 없습니다.</div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
          {items.map((item) => (
            <button
              key={item.inboxId}
              type="button"
              onClick={() => handleClick(item)}
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                background: "#fff",
                padding: "16px 18px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "#2563EB", fontWeight: 700, marginBottom: 6 }}>
                  {item.type}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.title}</div>
                <div style={{ marginTop: 6, fontSize: 13, color: "#475569" }}>{item.content}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#94A3B8" }}>
                  {formatDate(item.receivedAt)}
                </div>
              </div>
              <ChevronRight size={18} color="#94A3B8" />
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

