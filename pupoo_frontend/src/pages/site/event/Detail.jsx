import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { eventApi } from "../../../app/http/eventApi";

export default function Detail() {
  const navigate = useNavigate();
  const location = useLocation();
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

  // ✅ 버튼 5개 (두번째 이미지)
  const buttons = useMemo(() => {
    const id = eventId;

    return [
      {
        key: "preregister",
        label: "사전등록",
        onClick: () => navigate(`/event/preregister?eventId=${id}`),
      },
      {
        key: "guide",
        label: "참가자 안내",
        // TODO: 실제 라우트 없으면 여기만 너희 라우트로 변경
        onClick: () => navigate(`/event/guide?eventId=${id}`),
        // 라우트가 아직 없으면 아래로 바꿔도 됨:
        // onClick: () => alert("참가자 안내 페이지는 준비중입니다."),
      },
      {
        key: "community",
        label: "커뮤니티",
        // TODO: 커뮤니티 라우트에 맞게 수정
        onClick: () => navigate(`/community?eventId=${id}`),
      },
      {
        key: "schedule",
        label: "세션/일정",
        onClick: () => navigate(`/program/session?eventId=${eventId}`),
      },
      {
        key: "contest",
        label: "콘테스트",
        onClick: () => navigate(`/program/contest?eventId=${id}`),
      },
    ];
  }, [eventId, navigate]);

  // ✅ 현재 페이지에서 “활성” 버튼 스타일(지금은 Detail 화면이니까 기본은 사전등록처럼 보이게)
  // 필요하면 pathname으로 더 정확히 매핑 가능
  const activeKey = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/event/preregister")) return "preregister";
    if (path.startsWith("/event/guide")) return "guide";
    if (path.startsWith("/community")) return "community";
    if (path.startsWith("/program/schedule")) return "schedule";
    if (path.startsWith("/program/contest")) return "contest";
    // Detail 화면에서는 첫 버튼을 활성처럼 처리(이미지와 동일)
    return "preregister";
  }, [location.pathname]);

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

      {/* ✅ 버튼 5개 영역 */}
      <div style={styles.btnBarWrap}>
        <div style={styles.btnBar}>
          {buttons.map((b) => {
            const isActive = b.key === activeKey;
            return (
              <button
                key={b.key}
                type="button"
                onClick={b.onClick}
                style={{
                  ...styles.pill,
                  ...(isActive ? styles.pillActive : styles.pillInactive),
                }}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  btnBarWrap: {
    marginTop: 14,
    marginBottom: 8,
    display: "flex",
    justifyContent: "center",
  },
  btnBar: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap", // 화면 좁으면 줄바꿈
  },
  pill: {
    padding: "8px 16px",
    borderRadius: 999,
    border: "1px solid #dcdcdc",
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
    minWidth: 90,
  },
  pillActive: {
    backgroundColor: "#2f2f2f",
    color: "#fff",
    borderColor: "#2f2f2f",
    fontWeight: 600,
  },
  pillInactive: {
    backgroundColor: "#fff",
    color: "#333",
  },
};
