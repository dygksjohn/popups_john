import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { eventApi } from "../../../app/http/eventApi";

export default function Detail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      setErrorMsg("eventId가 없습니다. 목록에서 다시 선택해 주세요.");
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        const res = await eventApi.getEventDetail(eventId);
        setEvent(res.data.data);
      } catch (e) {
        const statusCode = e?.response?.status;
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "상세 조회 실패";
        setErrorMsg(statusCode ? `[${statusCode}] ${msg}` : msg);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [eventId]);

  if (loading) return <div style={{ padding: 16 }}>로딩중...</div>;

  if (errorMsg) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ color: "red", marginBottom: 12 }}>에러: {errorMsg}</div>
        <button onClick={() => navigate("/event/current")}>
          현재 진행 행사로
        </button>
      </div>
    );
  }

  if (!event) return <div style={{ padding: 16 }}>데이터 없음</div>;

  return (
    <div style={{ padding: 16 }}>
      <button onClick={() => navigate(-1)}>뒤로</button>

      <h2 style={{ marginTop: 12 }}>{event.eventName}</h2>

      <div style={{ opacity: 0.8 }}>status: {event.status}</div>
      <div style={{ opacity: 0.8 }}>
        {String(event.startAt ?? "")} ~ {String(event.endAt ?? "")}
      </div>

      {event.location && (
        <div style={{ marginTop: 8, opacity: 0.8 }}>
          location: {event.location}
        </div>
      )}

      {event.description && (
        <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
          {event.description}
        </div>
      )}
    </div>
  );
}
