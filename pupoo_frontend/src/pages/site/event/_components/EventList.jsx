import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventApi } from "../../../../app/http/eventApi";

export default function EventList({
  title = "행사 목록",
  statusList = [], // 예: ["ONGOING"] or ["ENDED","CANCELLED"]
  pageSize = 10,
}) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [events, setEvents] = useState([]);

  // ✅ statusList가 새 배열로 들어와도 동일하게 동작하도록 안정 키 생성
  const statusKey = useMemo(() => {
    const list = Array.isArray(statusList) ? statusList : [];
    return list.slice().sort().join(",");
  }, [statusList]);

  // ✅ React StrictMode에서 useEffect가 개발환경에서 2번 실행되는 경우 중복 호출 방지(선택)
  const didFetchRef = useRef(false);

  const fetchEvents = async (signal) => {
    setLoading(true);
    setErrorMsg("");

    try {
      // status가 없으면 전체 조회
      if (!statusKey) {
        const res = await eventApi.getEvents({ page: 0, size: pageSize });
        if (signal.aborted) return;
        setEvents(res.data.data.content || []);
        return;
      }

      const statuses = statusKey.split(",");

      // 단일 status
      if (statuses.length === 1) {
        const res = await eventApi.getEvents({
          status: statuses[0],
          page: 0,
          size: pageSize,
        });
        if (signal.aborted) return;
        setEvents(res.data.data.content || []);
        return;
      }

      // 다중 status: API가 status 단일만 받으므로 병렬 호출 후 병합/중복제거
      const results = await Promise.all(
        statuses.map((s) =>
          eventApi.getEvents({ status: s, page: 0, size: pageSize }),
        ),
      );

      if (signal.aborted) return;

      const merged = results.flatMap((r) => r.data.data.content || []);
      const dedup = Array.from(
        new Map(merged.map((e) => [e.eventId, e])).values(),
      );
      setEvents(dedup);
    } catch (e) {
      if (signal.aborted) return;

      const statusCode = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "이벤트 조회 실패";

      setErrorMsg(statusCode ? `[${statusCode}] ${msg}` : msg);
      setEvents([]);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    // StrictMode 중복 호출이 거슬리면 유지, 아니면 이 if 블록 제거해도 됨
    if (didFetchRef.current) {
      // 이미 호출했으면 재호출 허용하려면 아래 return 제거
      // return;
    }
    didFetchRef.current = true;

    const controller = new AbortController();
    fetchEvents(controller.signal);

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusKey, pageSize]);

  const goDetail = (eventId) => {
    navigate(`/event/detail?eventId=${eventId}`);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>{title}</h2>

      {loading && <div>로딩중...</div>}

      {errorMsg && (
        <div style={{ color: "red", marginBottom: 12 }}>
          에러: {errorMsg}
          <div style={{ marginTop: 8 }}>
            <button onClick={() => window.location.reload()}>새로고침</button>
          </div>
        </div>
      )}

      {!loading && !errorMsg && events.length === 0 && (
        <div style={{ opacity: 0.7 }}>조회 결과가 없습니다.</div>
      )}

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {events.map((ev) => (
          <div
            key={ev.eventId}
            onClick={() => goDetail(ev.eventId)}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 12,
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 700 }}>{ev.eventName}</div>
            <div style={{ opacity: 0.7 }}>status: {ev.status}</div>
            <div style={{ opacity: 0.7 }}>
              {String(ev.startAt ?? "")} ~ {String(ev.endAt ?? "")}
            </div>
            {ev.location && (
              <div style={{ opacity: 0.7 }}>location: {ev.location}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
